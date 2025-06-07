// src/app/api/donations/balances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as xrpl from 'xrpl';

const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const RLUSD_CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE 
    ? xrpl.convertHexToString(process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE)
    : 'RLUSD'; // Fallback if not set or conversion fails, though it should be set.
console.log(`API_DONATION_BALANCES: Derived RLUSD_CURRENCY_CODE for comparison: ${RLUSD_CURRENCY_CODE}`);

export async function GET(req: NextRequest) {
  if (!DONATION_ADDRESS) {
    console.error('API_DONATION_BALANCES: Donation address (NEXT_PUBLIC_DONATION_ADDRESS) is not configured.');
    return NextResponse.json({ error: 'Donation address is not configured.' }, { status: 500 });
  }
  if (!RLUSD_ISSUER_ADDRESS) {
    console.error('API_DONATION_BALANCES: RLUSD Issuer address (NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS) is not configured.');
    return NextResponse.json({ error: 'RLUSD Issuer address is not configured.' }, { status: 500 });
  }
  if (!process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE) {
    console.error('API_DONATION_BALANCES: RLUSD Currency code (NEXT_PUBLIC_RLUSD_CURRENCY_CODE) is not configured.');
    // It's important this is the hex version from your .env for consistency with how RLUSD is often represented.
  }


  const client = new xrpl.Client(XRPL_NODE_URL);
  let xrpBalance = '0';
  let rlusdBalance = '0';

  try {
    await client.connect();
    console.log(`API_DONATION_BALANCES: Connected to XRPL for ${DONATION_ADDRESS}`);

    // Fetch XRP balance
    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: DONATION_ADDRESS,
        ledger_index: 'validated',
      });
      xrpBalance = xrpl.dropsToXrp(accountInfo.result.account_data.Balance);
      console.log(`API_DONATION_BALANCES: XRP Balance for ${DONATION_ADDRESS}: ${xrpBalance}`);
    } catch (e: any) {
      console.error(`API_DONATION_BALANCES: Error fetching XRP balance for ${DONATION_ADDRESS}:`, e.message);
      // Potentially return partial data or specific error for XRP balance
    }

    // Fetch RLUSD balance
    try {
      const accountLines = await client.request({
        command: 'account_lines',
        account: DONATION_ADDRESS,
        peer: RLUSD_ISSUER_ADDRESS, // Filter by issuer
        ledger_index: 'validated',
      });

      console.log('API_DONATION_BALANCES: Full account_lines.result.lines:', JSON.stringify(accountLines.result.lines, null, 2));

      const rlusdLine = accountLines.result.lines.find(
        (line) => line.currency === process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE && line.account === RLUSD_ISSUER_ADDRESS
      );

      if (rlusdLine) {
        rlusdBalance = rlusdLine.balance; // This is the balance of the IOU
        console.log(`API_DONATION_BALANCES: Found RLUSD line: ${JSON.stringify(rlusdLine, null, 2)}`);
      } else {
        console.log(`API_DONATION_BALANCES: No RLUSD line found matching currency '${RLUSD_CURRENCY_CODE}' and issuer '${RLUSD_ISSUER_ADDRESS}'.`);
      }
      console.log(`API_DONATION_BALANCES: RLUSD Balance for ${DONATION_ADDRESS} from issuer ${RLUSD_ISSUER_ADDRESS}: ${rlusdBalance}`);

    } catch (e: any) {
      console.error(`API_DONATION_BALANCES: Error fetching RLUSD balance for ${DONATION_ADDRESS}:`, e.message);
      // Potentially return partial data or specific error for RLUSD balance
    }

    return NextResponse.json({
      xrpBalance,
      rlusdBalance,
      currency: {
        xrp: 'XRP',
        rlusd: RLUSD_CURRENCY_CODE,
      },
      account: DONATION_ADDRESS,
    });

  } catch (error: any) {
    console.error(`API_DONATION_BALANCES: General error for ${DONATION_ADDRESS}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balances.', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log(`API_DONATION_BALANCES: Disconnected from XRPL for ${DONATION_ADDRESS}`);
    }
  }
}
