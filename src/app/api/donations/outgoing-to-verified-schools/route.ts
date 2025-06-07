// src/app/api/donations/outgoing-to-verified-schools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as xrpl from 'xrpl';
import { supabase } from '@/lib/supabaseClient'; // Your Supabase client

const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const XRP_TO_DROPS_CONVERSION = 1000000;
const EXPLORER_BASE_URL = 'https://testnet.xrpl.org/transactions/';

interface VerifiedSchoolTransaction {
  id: string;
  timestamp: string;
  amount: string;
  currency: string;
  destinationAddress: string;
  destinationSchoolName?: string; // Add school name
  explorerUrl: string;
}

export async function GET(req: NextRequest) {
  if (!DONATION_ADDRESS) {
    console.error('API_OUTGOING_VERIFIED: Donation address (NEXT_PUBLIC_DONATION_ADDRESS) is not configured.');
    return NextResponse.json({ error: 'Donation address is not configured.' }, { status: 500 });
  }

  const client = new xrpl.Client(XRPL_NODE_URL);
  const outgoingTransactionsToVerified: VerifiedSchoolTransaction[] = [];

  try {
    await client.connect();
    console.log(`API_OUTGOING_VERIFIED: Connected to XRPL for ${DONATION_ADDRESS}`);

    const response = await client.request({
      command: 'account_tx',
      account: DONATION_ADDRESS,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 50, // Fetch a decent number of recent transactions
      forward: false, // Newest first
    });

    if (!response.result.transactions || response.result.transactions.length === 0) {
      console.log(`API_OUTGOING_VERIFIED: No transactions found for ${DONATION_ADDRESS}`);
      return NextResponse.json([]);
    }

    const potentialSchoolDestinations = new Set<string>();
    const rawTransactionsMap = new Map<string, any[]>(); // Store raw tx by destination for later filtering

    for (const txEntry of response.result.transactions) {
      const tx = (txEntry.tx_json || txEntry.tx) as any; // tx_json is preferred if available
      const meta = txEntry.meta as xrpl.TransactionMetadata;

      if (
        tx &&
        tx.TransactionType === 'Payment' &&
        tx.Account === DONATION_ADDRESS && // Ensure it's an outgoing payment
        tx.Destination &&
        meta && meta.TransactionResult === 'tesSUCCESS'
      ) {
        potentialSchoolDestinations.add(tx.Destination);
        // Store the full transaction entry temporarily, keyed by its hash for uniqueness
        // or by destination if we only care about the latest to a specific school (less likely for this use case)
        // For now, let's store all relevant ones and filter later.
        // We'll need to map back from verified addresses to these transactions.
        if (!rawTransactionsMap.has(tx.Destination)) {
            rawTransactionsMap.set(tx.Destination, []);
        }
        rawTransactionsMap.get(tx.Destination)!.push(txEntry); // Added non-null assertion
      }
    }

    if (potentialSchoolDestinations.size === 0) {
      console.log(`API_OUTGOING_VERIFIED: No outgoing payment transactions found from ${DONATION_ADDRESS}`);
      return NextResponse.json([]);
    }

    // Fetch verified schools from Supabase whose wallet addresses are in our list
    const { data: verifiedSchools, error: supabaseError } = await supabase
      .from('schools')
      .select('wallet_address, name')
      .in('wallet_address', Array.from(potentialSchoolDestinations))
      .eq('is_verified', true);

    if (supabaseError) {
      console.error('API_OUTGOING_VERIFIED: Supabase error fetching verified schools:', supabaseError);
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }

    const verifiedSchoolMap = new Map<string, string>(); // wallet_address -> name
    if (verifiedSchools) {
      for (const school of verifiedSchools) {
        if (school.wallet_address && school.name) {
          verifiedSchoolMap.set(school.wallet_address, school.name);
        }
      }
    }
    
    console.log(`API_OUTGOING_VERIFIED: Found ${verifiedSchoolMap.size} verified school destinations.`);

    // Filter transactions based on verified schools
    verifiedSchoolMap.forEach((schoolName, walletAddress) => {
        const schoolTransactions = rawTransactionsMap.get(walletAddress);
        if (schoolTransactions) {
            for (const txEntry of schoolTransactions) {
                const tx = (txEntry.tx_json || txEntry.tx) as any;
                const meta = txEntry.meta as xrpl.TransactionMetadata;
                
                let amountStr = 'N/A';
                let currencyStr = 'N/A';
                const deliveredAmount = meta.delivered_amount || meta.DeliveredAmount;

                if (typeof deliveredAmount === 'string') {
                    amountStr = xrpl.dropsToXrp(deliveredAmount);
                    currencyStr = 'XRP';
                } else if (typeof deliveredAmount === 'object' && deliveredAmount !== null) {
                    const typedDeliveredAmount = deliveredAmount as xrpl.IssuedCurrencyAmount;
                    amountStr = typedDeliveredAmount.value;
                    const currencyCode = typedDeliveredAmount.currency;
                    if (currencyCode.length === 40) { // Potentially a hex-encoded currency
                        try {
                            const decoded = xrpl.convertHexToString(currencyCode).trim();
                            currencyStr = decoded.length > 0 ? decoded : currencyCode; // Use decoded if not empty
                        } catch { 
                            currencyStr = currencyCode; // Fallback to original hex on error
                        }
                    } else {
                        currencyStr = currencyCode;
                    }
                }

                outgoingTransactionsToVerified.push({
                    id: txEntry.hash || 'N/A',
                    timestamp: (txEntry as any).close_time_iso || 
                               ((txEntry as any).date ? new Date((((txEntry as any).date || 0) + 946684800) * 1000).toISOString() : 'N/A'),
                    amount: amountStr,
                    currency: currencyStr,
                    destinationAddress: tx.Destination,
                    destinationSchoolName: schoolName,
                    explorerUrl: `${EXPLORER_BASE_URL}${txEntry.hash || ''}`,
                });
            }
        }
    });
    
    // Sort by timestamp descending (newest first)
    outgoingTransactionsToVerified.sort((a, b) => {
        if (a.timestamp === 'N/A') return 1; // Push 'N/A' timestamps to the end
        if (b.timestamp === 'N/A') return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });


    return NextResponse.json(outgoingTransactionsToVerified.slice(0, 20)); // Return up to 20 recent ones

  } catch (error: any) {
    console.error(`API_OUTGOING_VERIFIED: General error for ${DONATION_ADDRESS}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch outgoing transactions to verified schools.', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log(`API_OUTGOING_VERIFIED: Disconnected from XRPL for ${DONATION_ADDRESS}`);
    }
  }
}
