// src/app/api/donations/balances/route.ts
import { NextRequest, NextResponse } from 'next/server';
const XRPL_HTTP_RPC_URL = process.env.XRPL_HTTP_RPC_URL || 'https://s.altnet.rippletest.net:51234'; // Placeholder for HTTP RPC endpoint

// xrpl.js is still used for utility functions like dropsToXrp and convertHexToString
import * as xrpl from 'xrpl';
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const RLUSD_CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE 
    ? xrpl.convertHexToString(process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE)
    : 'RLUSD'; // Fallback if not set or conversion fails, though it should be set.
console.log(`API_DONATION_BALANCES: Derived RLUSD_CURRENCY_CODE for comparison: ${RLUSD_CURRENCY_CODE}`);

export async function GET() {
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


  let xrpBalance = '0';
  let rlusdBalance = '0';

  try {
    // Fetch XRP balance
    try {
      const response = await fetch(XRPL_HTTP_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'account_info',
          params: [
            {
              account: DONATION_ADDRESS,
              ledger_index: 'validated',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result && data.result.account_data) {
        xrpBalance = String(xrpl.dropsToXrp(data.result.account_data.Balance));
        console.log(`API_DONATION_BALANCES: XRP Balance for ${DONATION_ADDRESS}: ${xrpBalance}`);
      } else if (data.error) {
        throw new Error(data.error_message || data.error);
      }
    } catch (e: unknown) {
      const xrpErrorMessage = e instanceof Error ? e.message : 'An unknown error occurred fetching XRP balance';
      console.error(`API_DONATION_BALANCES: Error fetching XRP balance for ${DONATION_ADDRESS}:`, xrpErrorMessage);
      // Potentially return partial data or specific error for XRP balance
    }

    // Fetch RLUSD balance
    try {
      const response = await fetch(XRPL_HTTP_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'account_lines',
          params: [
            {
              account: DONATION_ADDRESS,
              peer: RLUSD_ISSUER_ADDRESS, // Filter by issuer
              ledger_index: 'validated',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API_DONATION_BALANCES: Full account_lines.result.lines:', JSON.stringify(data.result.lines, null, 2));

      const rlusdLine = data.result.lines.find(
        (line: any) => line.currency === process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE && line.account === RLUSD_ISSUER_ADDRESS
      );

      if (rlusdLine) {
        rlusdBalance = rlusdLine.balance; // This is the balance of the IOU
        console.log(`API_DONATION_BALANCES: Found RLUSD line: ${JSON.stringify(rlusdLine, null, 2)}`);
      } else {
        console.log(`API_DONATION_BALANCES: No RLUSD line found matching currency '${RLUSD_CURRENCY_CODE}' and issuer '${RLUSD_ISSUER_ADDRESS}'.`);
      }
      console.log(`API_DONATION_BALANCES: RLUSD Balance for ${DONATION_ADDRESS} from issuer ${RLUSD_ISSUER_ADDRESS}: ${rlusdBalance}`);
    } catch (e: unknown) {
      const rlusdErrorMessage = e instanceof Error ? e.message : 'An unknown error occurred fetching RLUSD balance';
      console.error(`API_DONATION_BALANCES: Error fetching RLUSD balance for ${DONATION_ADDRESS}:`, rlusdErrorMessage);
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

  } catch (error: unknown) {
    const generalErrorMessage = error instanceof Error ? error.message : 'An unknown general error occurred';
    console.error(`API_DONATION_BALANCES: General error for ${DONATION_ADDRESS}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balances.', details: generalErrorMessage },
      { status: 500 }
    );
  } finally {
    // No client to disconnect from in HTTP mode
  }
}
