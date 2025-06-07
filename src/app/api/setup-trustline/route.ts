import { NextResponse } from 'next/server';
import { Client, Wallet, xrpToDrops, TrustSet, AccountLinesRequest } from 'xrpl';

const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233'; // Default to testnet
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const DONATION_ACCOUNT_SECRET = process.env.DONATION_ACCOUNT_SECRET;
const CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE;
const TRUST_LINE_LIMIT = '10000000000'; // A large limit for the trustline, e.g., 10 billion

export async function GET() {
  if (process.env.ENABLE_TRUSTLINE_SETUP_API !== 'true') {
    return NextResponse.json(
      { message: 'Trustline setup API is disabled by environment configuration.' },
      { status: 403 } // Forbidden
    );
  }
  if (!DONATION_ADDRESS || !RLUSD_ISSUER_ADDRESS || !DONATION_ACCOUNT_SECRET || !CURRENCY_CODE) {
    return NextResponse.json(
      { error: 'Missing required environment variables (donation address, issuer address, account secret, or currency code).' },
      { status: 500 }
    );
  }

  const client = new Client(XRPL_NODE_URL);

  try {
    await client.connect();
    console.log('Connected to XRPL node:', XRPL_NODE_URL);

    const wallet = Wallet.fromSecret(DONATION_ACCOUNT_SECRET);
    if (wallet.address !== DONATION_ADDRESS) {
      console.error('ENV MISMATCH: DONATION_ADDRESS from env does not match address from DONATION_ACCOUNT_SECRET.');
      return NextResponse.json(
        { error: 'Donation address in .env (NEXT_PUBLIC_DONATION_ADDRESS) does not match the address derived from the DONATION_ACCOUNT_SECRET. Please check your .env.local file.' },
        { status: 400 }
      );
    }

    // Check if trustline already exists
    console.log(`Checking account lines for ${DONATION_ADDRESS} with peer ${RLUSD_ISSUER_ADDRESS}...`);
    const accountLinesRequest: AccountLinesRequest = {
      command: 'account_lines',
      account: DONATION_ADDRESS,
      peer: RLUSD_ISSUER_ADDRESS, // Check lines specifically with the issuer
    };
    const accountLines = await client.request(accountLinesRequest);
    
    const existingTrustline = accountLines.result.lines.find(
      (line: any) => line.currency === CURRENCY_CODE // Issuer is already filtered by 'peer'
    );

    if (existingTrustline) {
      console.log(`Trustline for ${CURRENCY_CODE} from ${RLUSD_ISSUER_ADDRESS} already exists for ${DONATION_ADDRESS}. Limit: ${existingTrustline.limit}`);
      return NextResponse.json({
        message: `Trustline already exists for ${CURRENCY_CODE} to ${RLUSD_ISSUER_ADDRESS}.`,
        details: existingTrustline,
      });
    }

    // Prepare TrustSet transaction
    const trustSetTx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: DONATION_ADDRESS,
      LimitAmount: {
        currency: CURRENCY_CODE,
        issuer: RLUSD_ISSUER_ADDRESS,
        value: TRUST_LINE_LIMIT,
      },
      // Fee: xrpToDrops('0.000012'), // Optional: specify fee, otherwise auto-filled by autofill
    };

    console.log(`Attempting to set trustline for ${DONATION_ADDRESS} to ${RLUSD_ISSUER_ADDRESS} for ${CURRENCY_CODE}...`);
    const prepared = await client.autofill(trustSetTx);
    console.log('Transaction autofilled:', prepared);
    const signed = wallet.sign(prepared);
    console.log('Transaction signed. Hash:', signed.hash);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta && (result.result.meta as any).TransactionResult === 'tesSUCCESS') {
      console.log('Trustline set successfully. Transaction result:', result.result);
      return NextResponse.json({ 
        message: 'Trustline set successfully!', 
        transactionId: signed.hash,
        details: result.result
      });
    } else {
      console.error('Failed to set trustline. Transaction result:', result.result);
      return NextResponse.json(
        { error: 'Failed to set trustline.', details: (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) ? (result.result.meta as any).TransactionResult : result.result },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in setup-trustline API:', error.message, error.stack, error.data);
    let errorMessage = 'An unexpected error occurred.';
    if (error.data && error.data.error_message) {
      errorMessage = error.data.error_message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log('Disconnected from XRPL');
    }
  }
}
