// src/app/api/get-donations-xrpl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, Payment, TransactionMetadata } from 'xrpl';

export interface Donation {
  id: string;
  sender: string;
  amount: string;
  currency: string;
  timestamp: string;
  explorerUrl: string;
}

const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
// RLUSD details - not strictly needed for the simplified parsing but kept for context if other logic uses them
// const RLUSD_CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE; // Commented out as not directly used in simplified logic
// const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS; // Commented out as not directly used in simplified logic

export async function GET(req: NextRequest) {
  if (!DONATION_ADDRESS) {
    console.error('GET_DONATIONS_XRPL: Donation address is not configured.');
    return NextResponse.json({ error: 'Donation address is not configured.' }, { status: 500 });
  }
  
  const xrplClient = new Client(XRPL_NODE_URL);
  const displayedDonations: Donation[] = [];

  try {
    await xrplClient.connect();
    console.log('GET_DONATIONS_XRPL: Connected to XRPL.');

    const response = await xrplClient.request({
      command: 'account_tx',
      account: DONATION_ADDRESS,
      limit: 30, // Fetch a bit more to ensure we can filter down to 10 valid ones
      forward: false, // Fetch newest first
    });

    console.log(`GET_DONATIONS_XRPL: Fetched ${response.result.transactions.length} transactions for account ${DONATION_ADDRESS}`);

    // Log the first transaction entry for inspection
    if (response.result.transactions.length > 0) {
      console.log('GET_DONATIONS_XRPL: First raw txEntry object:', JSON.stringify(response.result.transactions[0], null, 2));
    }

    for (const txEntry of response.result.transactions) {
      // Detailed logging for each transaction entry
      console.log(`GET_DONATIONS_XRPL: Inspecting txEntry. Validated: ${txEntry.validated}, tx field exists: ${'tx' in txEntry}, meta field exists: ${'meta' in txEntry}`);
      if ('tx' in txEntry && txEntry.tx) {
        console.log(`GET_DONATIONS_XRPL: txEntry.tx.TransactionType: ${(txEntry.tx as any).TransactionType}, txEntry.tx.hash: ${(txEntry.tx as any).hash}`);
      } else {
        console.log(`GET_DONATIONS_XRPL: txEntry.tx is not present or is falsy.`);
      }

      if (displayedDonations.length >= 10) {
        console.log('GET_DONATIONS_XRPL: Reached 10 donations, stopping processing.');
        break;
      }

      // Break down the condition for clarity in logs
      if (!txEntry.validated) {
        console.log(`GET_DONATIONS_XRPL: Skipping transaction because txEntry.validated is ${txEntry.validated}. Hash (if tx exists): ${(txEntry.tx as any)?.hash || 'N/A'}`);
        continue;
      }

      const transactionDataSource = txEntry.tx || (txEntry as any).tx_json;

      if (!transactionDataSource) {
        console.log(`GET_DONATIONS_XRPL: Skipping transaction because neither txEntry.tx nor txEntry.tx_json is present. Keys in txEntry: ${Object.keys(txEntry).join(', ')}`);
        continue;
      }

      const tx = transactionDataSource as {
        Account: string;
        Destination?: string;
        Amount: any; // string for XRP (drops), object for IOU
        TransactionType: string;
        date?: number; // XRPL epoch time
        // Other fields like Fee, Sequence, etc., are also in tx_json but not strictly needed for display
      };
      const meta = typeof txEntry.meta === 'object' ? txEntry.meta as TransactionMetadata : undefined;

      if (!meta || meta.TransactionResult !== 'tesSUCCESS') {
        // Use txEntry.hash for logging the transaction hash
        console.log(`GET_DONATIONS_XRPL: Skipping transaction with hash ${txEntry.hash || 'N/A'} due to unsuccessful result: ${meta?.TransactionResult}`);
        continue;
      }

      if (tx.TransactionType !== 'Payment' || tx.Destination !== DONATION_ADDRESS) {
        // Use txEntry.hash for logging the transaction hash
        console.log(`GET_DONATIONS_XRPL: Skipping non-payment or incorrect destination transaction with hash ${txEntry.hash} (Type: ${tx.TransactionType}, Dest: ${tx.Destination})`);
        continue;
      }

      let parsedAmount: string;
      let parsedCurrency: string;
      const deliveredAmount = meta.delivered_amount;

      if (typeof deliveredAmount === 'string') {
        // XRP payment (amount in drops)
        parsedAmount = (parseInt(deliveredAmount) / 1000000).toString();
        parsedCurrency = 'XRP';
        console.log(`GET_DONATIONS_XRPL: Processed XRP payment: ${parsedAmount} ${parsedCurrency} from ${tx.Account}`);
      } else if (typeof deliveredAmount === 'object' && deliveredAmount !== null && 'value' in deliveredAmount && 'currency' in deliveredAmount) {
        // IOU payment
        parsedAmount = (deliveredAmount as { value: string; currency: string }).value;
        parsedCurrency = (deliveredAmount as { value: string; currency: string }).currency;
        console.log(`GET_DONATIONS_XRPL: Processed IOU payment: ${parsedAmount} ${parsedCurrency} from ${tx.Account}`);
      } else {
        console.log(`GET_DONATIONS_XRPL: Skipping transaction with hash ${txEntry.hash || 'N/A'} due to unhandled or missing delivered_amount format. delivered_amount:`, deliveredAmount);
        continue;
      }

      displayedDonations.push({
        id: txEntry.hash!,
        sender: tx.Account, // Corrected: Use tx.Account (aliased from tx_json)
        amount: parsedAmount,
        currency: parsedCurrency,
        timestamp: (txEntry as any).close_time_iso, // Corrected: Cast txEntry to any for close_time_iso
        explorerUrl: `https://testnet.xrpl.org/transactions/${txEntry.hash!}`
      });
    }

    console.log(`GET_DONATIONS_XRPL: Processed and returning ${displayedDonations.length} donations.`);
    return NextResponse.json(displayedDonations);

  } catch (error: any) {
    console.error('GET_DONATIONS_XRPL: Error fetching donations from XRPL:', error.message, error.data || error);
    return NextResponse.json({ error: 'Failed to fetch donations from XRPL.', details: error.message }, { status: 500 });
  } finally {
    if (xrplClient.isConnected()) {
      await xrplClient.disconnect();
      console.log('GET_DONATIONS_XRPL: Disconnected from XRPL.');
    }
  }
}
