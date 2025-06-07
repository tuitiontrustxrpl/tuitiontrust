import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import xrpl from 'xrpl';

// Ensure CRON_SECRET is set in your environment variables
const CRON_SECRET = process.env.CRON_SECRET;
const TREASURY_WALLET_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const TREASURY_WALLET_SECRET = process.env.DONATION_ACCOUNT_SECRET;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const RLUSD_CURRENCY_HEX = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE;
const XRPL_NODE = process.env.NEXT_PUBLIC_XRPL_NODE || 'wss://s.altnet.rippletest.net:51233';

export async function POST(req: NextRequest) {
  console.log('DISTRIBUTE_RLUSD_API: Received request');

  // 1. Authenticate the cron job request
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET) {
    console.error('DISTRIBUTE_RLUSD_API: CRON_SECRET is not set in environment variables.');
    return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn('DISTRIBUTE_RLUSD_API: Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('DISTRIBUTE_RLUSD_API: Cron job authenticated.');

  if (!TREASURY_WALLET_ADDRESS || !TREASURY_WALLET_SECRET || !RLUSD_ISSUER_ADDRESS || !RLUSD_CURRENCY_HEX) {
    console.error('DISTRIBUTE_RLUSD_API: Missing required XRPL environment variables for treasury or RLUSD.');
    return NextResponse.json({ error: 'XRPL configuration missing on server.' }, { status: 500 });
  }

  let client;
  try {
    // 2. Fetch verified schools from Supabase
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('wallet_address, name')
      .eq('is_verified', true)
      .not('wallet_address', 'is', null);

    if (fetchError) {
      console.error('DISTRIBUTE_RLUSD_API: Error fetching schools:', fetchError);
      return NextResponse.json({ error: `Failed to fetch schools: ${fetchError.message}` }, { status: 500 });
    }

    if (!schools || schools.length === 0) {
      console.log('DISTRIBUTE_RLUSD_API: No verified schools with wallet addresses found to distribute RLUSD to.');
      return NextResponse.json({ message: 'No schools eligible for RLUSD distribution at this time.' }, { status: 200 });
    }

    console.log(`DISTRIBUTE_RLUSD_API: Found ${schools.length} verified school(s) to process.`);

    // Initialize XRPL client
    client = new xrpl.Client(XRPL_NODE);
    await client.connect();
    console.log('DISTRIBUTE_RLUSD_API: Connected to XRPL.');

    const treasuryWallet = xrpl.Wallet.fromSeed(TREASURY_WALLET_SECRET);
    if (treasuryWallet.address !== TREASURY_WALLET_ADDRESS) {
        console.error('DISTRIBUTE_RLUSD_API: Mismatch between configured treasury address and address derived from seed.');
        return NextResponse.json({ error: 'Treasury wallet configuration error.' }, { status: 500 });
    }

    const distributionResults = [];

    for (const school of schools) {
      if (!school.wallet_address) continue;

      const amountToDistribute = '0.05'; // Send 0.05 RLUSD per school

      try {
        const paymentTx: xrpl.Payment = {
          TransactionType: 'Payment',
          Account: treasuryWallet.address,
          Destination: school.wallet_address,
          Amount: {
            currency: RLUSD_CURRENCY_HEX,
            value: amountToDistribute,
            issuer: RLUSD_ISSUER_ADDRESS,
          },
        };

        console.log(`DISTRIBUTE_RLUSD_API: Preparing payment of ${amountToDistribute} RLUSD to ${school.name} (${school.wallet_address})`);
        
        const prepared = await client.autofill(paymentTx);
        const signed = treasuryWallet.sign(prepared);
        const txResult = await client.submitAndWait(signed.tx_blob);

        if (txResult.result.meta && typeof txResult.result.meta === 'object' && txResult.result.meta.TransactionResult === 'tesSUCCESS') {
          console.log(`DISTRIBUTE_RLUSD_API: Successfully sent ${amountToDistribute} RLUSD to ${school.name}. Tx Hash: ${signed.hash}`);
          distributionResults.push({ 
            schoolName: school.name, 
            schoolAddress: school.wallet_address, 
            status: 'success', 
            amount: amountToDistribute, 
            txHash: signed.hash 
          });
        } else {
          const txStatus = (txResult.result.meta && typeof txResult.result.meta === 'object' && txResult.result.meta.TransactionResult) || 'Unknown XRPL Error';
          console.error(`DISTRIBUTE_RLUSD_API: Failed to send RLUSD to ${school.name}. Result: ${txStatus}`, txResult);
          distributionResults.push({ 
            schoolName: school.name, 
            schoolAddress: school.wallet_address, 
            status: 'failed', 
            amount: amountToDistribute, 
            error: txStatus,
            details: txResult
          });
        }
      } catch (paymentError: unknown) {
        const paymentErrorMessage = paymentError instanceof Error ? paymentError.message : 'An unknown error occurred during payment processing';
        console.error(`DISTRIBUTE_RLUSD_API: Error processing payment for ${school.name}:`, paymentError);
        distributionResults.push({ 
          schoolName: school.name, 
          schoolAddress: school.wallet_address, 
          status: 'exception', 
          amount: amountToDistribute, 
          error: paymentErrorMessage 
        });
      }
    }

    return NextResponse.json({ 
      message: 'RLUSD distribution process completed.', 
      results: distributionResults 
    }, { status: 200 });

  } catch (error: unknown) {
    const generalErrorMessage = error instanceof Error ? error.message : 'An unknown general error occurred';
    console.error('DISTRIBUTE_RLUSD_API: Unhandled error in distribution process:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${generalErrorMessage}` }, { status: 500 });
  } finally {
    if (client && client.isConnected()) {
      await client.disconnect();
      console.log('DISTRIBUTE_RLUSD_API: Disconnected from XRPL.');
    }
  }
}
