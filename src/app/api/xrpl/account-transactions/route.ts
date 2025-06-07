import { NextRequest, NextResponse } from 'next/server';
import * as xrpl from 'xrpl';

const XRPL_RPC_URL = process.env.NEXT_PUBLIC_XRPL_TESTNET_RPC || 'wss://s.altnet.rippletest.net:51233';
const XRP_TO_DROPS_CONVERSION = 1000000;
const EXPLORER_BASE_URL = 'https://testnet.xrpl.org/transactions/'; // Or mainnet equivalent

interface TransactionData {
  id: string;
  timestamp: string;
  amount: string;
  currency: string;
  sender: string;
  explorer_url: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountAddress = searchParams.get('address');

  if (!accountAddress) {
    return NextResponse.json({ error: 'XRPL address parameter is required' }, { status: 400 });
  }

  if (!xrpl.isValidAddress(accountAddress)) {
    return NextResponse.json({ error: 'Invalid XRPL address provided' }, { status: 400 });
  }

  const client = new xrpl.Client(XRPL_RPC_URL);

  try {
    await client.connect();
    console.log(`ACCOUNT_TX_API: Connected to XRPL to fetch transactions for ${accountAddress}`);

    const response = await client.request({
      command: 'account_tx',
      account: accountAddress,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 20, // Fetch a reasonable number of recent transactions
      forward: false, // True means oldest first, false means newest first
    });

    const transactions: TransactionData[] = [];
    if (response.result.transactions) {
      for (const txEntry of response.result.transactions) {
        if (!txEntry.tx_json || !txEntry.meta) {
          console.log(`ACCOUNT_TX_API: Skipping transaction due to missing tx_json or meta for hash: ${txEntry.hash}`);
          continue;
        }

        const tx = txEntry.tx_json;
        // Assert meta is TransactionMetadata, as it should be for non-binary account_tx results
        const meta = txEntry.meta as xrpl.TransactionMetadata;

        if (
          tx.TransactionType === 'Payment' &&
          meta.TransactionResult === 'tesSUCCESS' &&
          tx.Destination === accountAddress
        ) {
          let amountStr = 'N/A';
          let currencyStr = 'N/A';

          // delivered_amount can be string (XRP) or object (IOU)
          const deliveredAmount = meta.delivered_amount || meta.DeliveredAmount; // Use alias if primary is undefined

          if (typeof deliveredAmount === 'string') {
            // XRP
            amountStr = (parseInt(deliveredAmount) / XRP_TO_DROPS_CONVERSION).toFixed(6);
            currencyStr = 'XRP';
          } else if (typeof deliveredAmount === 'object' && deliveredAmount !== null) {
            // Check if it conforms to IssuedCurrency structure (must have value and currency)
            if ('value' in deliveredAmount && 'currency' in deliveredAmount) {
              const typedDeliveredAmount = deliveredAmount as xrpl.IssuedCurrencyAmount; // Cast for type safety
              amountStr = typedDeliveredAmount.value;
              const currencyCode = typedDeliveredAmount.currency;
              
              if (currencyCode.length === 40) { // Potentially a hex-encoded currency (20 bytes)
                  try {
                      const decoded = xrpl.convertHexToString(currencyCode);
                      if (/^[a-zA-Z0-9]{3,10}$/.test(decoded) && decoded.trim().length > 0) { // Ensure not empty/whitespace
                          currencyStr = decoded.trim();
                      } else {
                          currencyStr = currencyCode; // Decoded doesn't look like a currency or is empty, use original hex
                      }
                  } catch (e) {
                      currencyStr = currencyCode; // Conversion failed, use original hex
                  }
              } else if (/^[A-Z0-9]{3}$/.test(currencyCode)) { // Standard 3-char currency code
                  currencyStr = currencyCode;
              } else { // Unknown format or already decoded non-standard, use as is
                  currencyStr = currencyCode;
              }
            } else {
              // This is an unexpected object structure for deliveredAmount
              console.warn('ACCOUNT_TX_API: Unexpected structure for delivered_amount object:', deliveredAmount);
              amountStr = 'Unknown Value'; 
              currencyStr = 'UNK';
            }
          }

          transactions.push({
            id: txEntry.hash || 'N/A',
            timestamp: (
            (txEntry as any).close_time_iso || 
            ((txEntry as any).date ? new Date((((txEntry as any).date || 0) + 946684800) * 1000).toISOString() : 'N/A')
          ),
            amount: amountStr,
            currency: currencyStr,
            sender: tx.Account || 'N/A',
            explorer_url: `${EXPLORER_BASE_URL}${txEntry.hash}`,
          });
        }
      }
    }
    
    console.log(`ACCOUNT_TX_API: Processed and returning ${transactions.length} transactions for ${accountAddress}.`);
    return NextResponse.json(transactions);

  } catch (error: any) {
    console.error(`ACCOUNT_TX_API: Error fetching transactions for ${accountAddress}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions from XRPL', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log(`ACCOUNT_TX_API: Disconnected from XRPL for ${accountAddress}`);
    }
  }
}
