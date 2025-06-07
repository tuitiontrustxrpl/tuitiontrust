import { NextResponse } from 'next/server';
import { Client, Wallet, TrustSet } from 'xrpl';

const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE;
const TRUST_LINE_LIMIT = '10000000000'; // A large limit for the trustline, e.g., 10 billion

interface FakeWallet {
  name: string;
  address: string;
  secret: string;
}

const fakeWallets: FakeWallet[] = [
  {
    name: "Fake School 1",
    address: "rweachc46DLM9S5avhfubKT2p9Xt3S6cEd",
    secret: "sEdS6MGSguPQtmZazn8S9sHpkHFyNze",
  },
  {
    name: "Fake School 2",
    address: "rLbmFWAe6JDCaZ2Zffe1Wjn9weSwhJiXsb",
    secret: "sEd7HEJdFV4Dc5RzruoreYNMrMBjSeu",
  },
  {
    name: "Fake School 3",
    address: "rwQBkAke9HScNzAe1qoe6cY3nETZCkCEP5",
    secret: "sEd7Rages2iB2doVNoWrwxJeRL8JLpM",
  },
  {
    name: "School", // User provided, assuming it's for testing trustlines
    address: "rwQFeVCggQ51GBTTR5o9SS6CHK1C4uF2Kn",
    secret: "sEdVcvewEKCiBNQ49vyuJtYvTWuQp1j",
  },
];

export async function GET() {
  if (process.env.ENABLE_TRUSTLINE_SETUP_API !== 'true') {
    return NextResponse.json(
      { message: 'Trustline setup API is disabled by environment configuration.' },
      { status: 403 } // Forbidden
    );
  }

  if (!RLUSD_ISSUER_ADDRESS || !CURRENCY_CODE) {
    return NextResponse.json(
      { error: 'Missing required environment variables (RLUSD issuer address or currency code).' },
      { status: 500 }
    );
  }

  const client = new Client(XRPL_NODE_URL);
  const results = [];

  try {
    await client.connect();
    console.log('CREATE_FAKE_TRUSTLINES: Connected to XRPL.');

    for (const fw of fakeWallets) {
      try {
        const wallet = Wallet.fromSeed(fw.secret);
        if (wallet.address !== fw.address) {
          console.warn(`CREATE_FAKE_TRUSTLINES: Mismatch for ${fw.name}. Provided address: ${fw.address}, Derived address: ${wallet.address}. Proceeding with derived address.`);
        }

        const trustSetTx: TrustSet = {
          TransactionType: 'TrustSet',
          Account: wallet.address,
          LimitAmount: {
            issuer: RLUSD_ISSUER_ADDRESS,
            currency: CURRENCY_CODE,
            value: TRUST_LINE_LIMIT,
          },
          Flags: 131072, // tfSetNoRipple flag (0x00020000). Common for issuers.
        };

        console.log(`CREATE_FAKE_TRUSTLINES: Preparing TrustSet for ${fw.name} (${wallet.address}) to ${RLUSD_ISSUER_ADDRESS} for ${CURRENCY_CODE}`);
        
        const prepared = await client.autofill(trustSetTx);
        const signed = wallet.sign(prepared);
        const txResult = await client.submitAndWait(signed.tx_blob);

        const meta = txResult.result.meta;
        if (typeof meta === 'object' && meta && meta.TransactionResult === 'tesSUCCESS') {
          console.log(`CREATE_FAKE_TRUSTLINES: Successfully set trustline for ${fw.name} (${wallet.address}). Tx Hash: ${signed.hash}`);
          results.push({
            name: fw.name,
            address: wallet.address,
            status: 'success',
            message: `Trustline set to ${RLUSD_ISSUER_ADDRESS} for ${CURRENCY_CODE}.`,
            txHash: signed.hash
          });
        } else {
          console.error(`CREATE_FAKE_TRUSTLINES: Failed to set trustline for ${fw.name} (${wallet.address}). Result: ${typeof meta === 'object' && meta ? meta.TransactionResult : 'N/A (meta not an object)'}`, txResult);
          results.push({
            name: fw.name,
            address: wallet.address,
            status: 'failed',
            message: `Failed: ${typeof meta === 'object' && meta ? meta.TransactionResult : 'Unknown error (meta not an object)'}`,
            details: txResult.result
          });
        }
      } catch (walletError: unknown) {
        const walletErrorMessage = walletError instanceof Error ? walletError.message : 'An unknown error occurred during wallet processing';
        console.error(`CREATE_FAKE_TRUSTLINES: Error processing wallet ${fw.name} (${fw.address}):`, walletError);
        results.push({
          name: fw.name,
          address: fw.address,
          status: 'error',
          message: walletErrorMessage
        });
      }
    }
  } catch (error: unknown) {
    const generalErrorMessage = error instanceof Error ? error.message : 'An unknown general error occurred';
    console.error('CREATE_FAKE_TRUSTLINES: General error:', error);
    return NextResponse.json({ error: 'Failed to connect to XRPL or general error.', details: generalErrorMessage }, { status: 500 });
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log('CREATE_FAKE_TRUSTLINES: Disconnected from XRPL.');
    }
  }

  return NextResponse.json({ results });
}