import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client, TransactionMetadata } from 'xrpl'; // Removed rippleTimeToISOTime
import type { Payment } from 'xrpl/dist/npm/models/transactions'; // Keep Payment for type casting if needed, though direct access to tx_json fields is more common now.

// Environment variables
const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const RLUSD_CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  console.log(`SYNC_DONATIONS: Using DONATION_ADDRESS: "${DONATION_ADDRESS}"`);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase URL or Service Role Key is not configured.' }, { status: 500 });
  }
  if (!DONATION_ADDRESS || !RLUSD_CURRENCY_CODE || !RLUSD_ISSUER_ADDRESS) {
    return NextResponse.json({ error: 'XRPL donation address, currency code, or issuer address is not configured.' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const xrplClient = new Client(XRPL_NODE_URL);

  let newDonationsSynced = 0;
  let transactionsChecked = 0;
  const errors: string[] = [];

  try {
    await xrplClient.connect();
    console.log('Connected to XRPL for donation sync.');

    // Fetch account transactions for the donation address
    // Adjust limit as needed; fetches most recent first
    const response = await xrplClient.request({
      command: 'account_tx',
      account: DONATION_ADDRESS,
      limit: 50, // Check the last 50 transactions. Increase if needed but be mindful of API limits.
      forward: false, // True to start from oldest, false for newest
    });

    transactionsChecked = response.result.transactions.length;
    console.log(`Fetched ${response.result.transactions.length} transactions for account ${DONATION_ADDRESS}`);
    console.log('SYNC_DONATIONS: Fetched transactions:', JSON.stringify(response.result.transactions, null, 2));

    for (const txEntry of response.result.transactions) {
      // Use txEntry.meta directly for type safety with TransactionMetadata
      const meta = txEntry.meta as TransactionMetadata | undefined; // meta can be string or object

      // Ensure the transaction was validated and successful
      if (!txEntry.validated || !meta || typeof meta !== 'object' || meta.TransactionResult !== 'tesSUCCESS') {
        console.log(`SYNC_DONATIONS: Skipping unvalidated or unsuccessful transaction. Validated: ${txEntry.validated}, Meta: ${JSON.stringify(meta)}`);
        continue;
      }

      // Determine the source of transaction data: tx or tx_json
      const transactionDataSource = (txEntry as any).tx || (txEntry as any).tx_json;
      if (!transactionDataSource) {
        console.log(`SYNC_DONATIONS: Skipping transaction because neither tx nor tx_json is present. Hash: ${txEntry.hash}`);
        continue;
      }

      // Cast to a more flexible type for easier access
      const tx = transactionDataSource as { 
        Account: string; 
        Destination?: string; 
        Amount: any; 
        TransactionType: string; 
        DestinationTag?: number;
        // tx_json also includes 'date', but we'll use close_time_iso from txEntry
      };

      // We are interested in Payment transactions sent TO our donation address
      if (tx.TransactionType !== 'Payment' || tx.Destination !== DONATION_ADDRESS) {
        console.log(`SYNC_DONATIONS: Skipping non-payment or incorrect destination. Hash: ${txEntry.hash}, Type: ${tx.TransactionType}, Dest: ${tx.Destination}`);
        continue;
      }

      // Ensure txEntry.hash is present (it should be for validated transactions)
      if (!txEntry.hash) {
        console.warn('SYNC_DONATIONS: Transaction entry missing hash despite being validated:', txEntry);
        continue;
      }
      const xrpl_tx_hash = txEntry.hash;

      let parsedAmount: string;
      let parsedCurrency: string;
      let parsedIssuer: string | null = null; // Default to null for issuer
      const deliveredAmount = meta.delivered_amount;

      if (typeof deliveredAmount === 'string') {
        // XRP payment (amount in drops)
        parsedAmount = (parseInt(deliveredAmount) / 1000000).toString();
        parsedCurrency = 'XRP';
        // parsedIssuer remains null for XRP
      } else if (typeof deliveredAmount === 'object' && deliveredAmount !== null && 'value' in deliveredAmount && 'currency' in deliveredAmount && 'issuer' in deliveredAmount) {
        // IOU payment
        parsedAmount = (deliveredAmount as { value: string; currency: string; issuer: string }).value;
        parsedCurrency = (deliveredAmount as { value: string; currency: string; issuer: string }).currency;
        parsedIssuer = (deliveredAmount as { value: string; currency: string; issuer: string }).issuer;
      } else {
        console.log(`SYNC_DONATIONS: Skipping transaction with hash ${xrpl_tx_hash} due to unhandled or missing delivered_amount format. delivered_amount:`, deliveredAmount);
        continue;
      }

      // Proceed if we successfully parsed an amount and currency (which implies a valid donation type)
      if (parsedAmount && parsedCurrency) {
        console.log(`SYNC_DONATIONS: Processing transaction ${xrpl_tx_hash} for potential sync.`);

        // Check if this transaction hash already exists in Supabase
        const { data: existingDonation, error: selectError } = await supabase
          .from('donations')
          .select('xrpl_tx_hash')
          .eq('xrpl_tx_hash', xrpl_tx_hash)
          .maybeSingle();

        if (selectError) {
          console.error(`SYNC_DONATIONS: Supabase select error for ${xrpl_tx_hash}:`, selectError.message);
          errors.push(`Supabase select error for ${xrpl_tx_hash}: ${selectError.message}`);
          continue; // Skip this transaction if DB check fails
        }

        if (existingDonation) {
          console.log(`SYNC_DONATIONS: Donation ${xrpl_tx_hash} already exists in Supabase. Skipping.`);
          continue;
        }

        // New donation, let's insert it
        const newDonationRecord = {
          xrpl_tx_hash: xrpl_tx_hash,
          sender_address: tx.Account, // From tx_json (aliased as tx)
          amount_value: parsedAmount,
          amount_currency: parsedCurrency,
          amount_issuer: parsedIssuer,
          transaction_timestamp: (txEntry as any).close_time_iso, // Use close_time_iso from txEntry
          explorer_url: `https://testnet.xrpl.org/transactions/${xrpl_tx_hash}`,
          destination_tag: tx.DestinationTag || null, // From tx_json (aliased as tx)
          raw_transaction: txEntry, // Store the whole transaction entry including metadata
        };

        console.log(`SYNC_DONATIONS: Attempting to insert new donation ${xrpl_tx_hash} with data:`, newDonationRecord);
        const { error: insertError } = await supabase.from('donations').insert([newDonationRecord]);

        if (insertError) {
          console.error(`SYNC_DONATIONS: Supabase insert error for ${xrpl_tx_hash}:`, insertError.message, insertError.details, insertError.hint);
          errors.push(`Supabase insert error for ${xrpl_tx_hash}: ${insertError.message}`);
        } else {
          newDonationsSynced++;
          console.log(`SYNC_DONATIONS: Successfully synced new donation ${xrpl_tx_hash} to Supabase.`);
        }
      }
    }

    return NextResponse.json({
      message: 'Donation sync process completed.',
      transactionsChecked,
      newDonationsSynced,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error during donation sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync donations.', details: error.message, fullError: String(error) }, 
      { status: 500 }
    );
  } finally {
    if (xrplClient.isConnected()) {
      await xrplClient.disconnect();
      console.log('Disconnected from XRPL.');
    }
  }
}
