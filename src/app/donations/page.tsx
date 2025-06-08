// src/app/donations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface WalletBalances {
  xrpBalance: string;
  rlusdBalance: string;
  currency: {
    xrp: string;
    rlusd: string;
  };
  account: string;
}

interface VerifiedSchoolTransaction {
  id: string;
  timestamp: string;
  amount: string;
  currency: string;
  destinationAddress: string;
  destinationSchoolName?: string;
  explorerUrl: string;
}

const DonationsPage: React.FC = () => {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [transactions, setTransactions] = useState<VerifiedSchoolTransaction[]>([]);
  const [loadingBalances, setLoadingBalances] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [errorBalances, setErrorBalances] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);

  const donationWalletAddress = process.env.NEXT_PUBLIC_DONATION_ADDRESS;

  useEffect(() => {
    const fetchBalances = async () => {
      setLoadingBalances(true);
      setErrorBalances(null);
      try {
        const response = await fetch('/api/donations/balances');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: WalletBalances = await response.json();
        setBalances(data);
      } catch (error: any) {
        console.error("Failed to fetch balances:", error);
        setErrorBalances(error.message || 'Failed to load wallet balances.');
      } finally {
        setLoadingBalances(false);
      }
    };

    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      setErrorTransactions(null);
      try {
        const response = await fetch('/api/donations/outgoing-to-verified-schools');
        if (!response.ok) {
          // If 502, try fallback
          if (response.status === 502) {
            console.warn('WSS API failed with 502, attempting JSON-RPC fallback');
            // Fallback: direct JSON-RPC to XRPL
            const fallbackData = await fetchXRPLTransactionsFallback();
            setTransactions(fallbackData);
            return;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
        }
        const data: VerifiedSchoolTransaction[] = await response.json();
        setTransactions(data);
      } catch (error: any) {
        console.error("Failed to fetch transactions:", error);
        setErrorTransactions(error.message || 'Failed to load transactions.');
      } finally {
        setLoadingTransactions(false);
      }
    };

    // Fallback: fetch transactions directly from XRPL JSON-RPC
    const fetchXRPLTransactionsFallback = async (): Promise<VerifiedSchoolTransaction[]> => {
      try {
        const address = donationWalletAddress;
        if (!address) throw new Error('Donation wallet address is not set.');
        // XRPL Testnet JSON-RPC endpoint
        const XRPL_RPC_URL = 'https://s.altnet.rippletest.net:51234';
        // Request last 10 transactions for the donation wallet
        const reqBody = {
          method: 'account_tx',
          params: [
            {
              account: address,
              ledger_index_min: -1,
              ledger_index_max: -1,
              limit: 10,
              binary: false,
              forward: false
            }
          ]
        };
        const rpcRes = await fetch(XRPL_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });
        if (!rpcRes.ok) throw new Error('XRPL JSON-RPC request failed');
        const rpcJson = await rpcRes.json();
        // Parse and filter for successful Payment transactions
        const txs = (rpcJson.result?.transactions || [])
          .filter((entry: any) => entry.tx.TransactionType === 'Payment' && entry.meta?.TransactionResult === 'tesSUCCESS')
          .map((entry: any) => {
            // Amount parsing
            let amount = '0';
            let currency = 'XRP';
            const delivered = entry.meta?.delivered_amount;
            if (typeof delivered === 'string') {
              // XRP in drops
              amount = (parseInt(delivered, 10) / 1_000_000).toString();
              currency = 'XRP';
            } else if (typeof delivered === 'object' && delivered !== null) {
              amount = delivered.value;
              currency = delivered.currency;
            }
            return {
              id: entry.tx.hash,
              timestamp: entry.tx.date ? new Date((entry.tx.date + 946684800) * 1000).toISOString() : 'N/A',
              amount,
              currency,
              destinationAddress: entry.tx.Destination,
              destinationSchoolName: undefined, // Not available from XRPL directly
              explorerUrl: `https://testnet.xrpl.org/transactions/${entry.tx.hash}`,
            };
          });
        return txs;
      } catch (e: any) {
        setErrorTransactions('XRPL fallback failed: ' + (e.message || e.toString()));
        return [];
      }
    };

    if (donationWalletAddress) {
        fetchBalances();
        fetchTransactions();
    } else {
        setErrorBalances("Donation wallet address is not configured in environment variables.");
        setErrorTransactions("Donation wallet address is not configured, cannot fetch transactions.");
        setLoadingBalances(false);
        setLoadingTransactions(false);
    }
  }, [donationWalletAddress]);

  const formatTimestamp = (isoString: string) => {
    if (!isoString || isoString === 'N/A') return 'N/A';
    try {
      return new Date(isoString).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl shadow-lg p-8 mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Donation Wallet Tracking</h1>
          <p className="text-green-100 text-lg">Monitor donations flowing into and out of verified schools</p>
        </div>

      {!donationWalletAddress && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-lg shadow-sm mb-8 flex items-start max-w-3xl mx-auto" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Configuration Error</p>
            <p>The <code className="bg-red-100 px-1 py-0.5 rounded">NEXT_PUBLIC_DONATION_ADDRESS</code> is not set. Please configure it in your environment variables.</p>
          </div>
        </div>
      )}

      {/* Balances Section */}
      <section className="mb-12 bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800">Wallet Balances</h2>
        </div>
        <div className="p-6">
          {loadingBalances && (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600">Loading wallet balances...</span>
            </div>
          )}
          {errorBalances && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error: {errorBalances}</span>
              </div>
            </div>
          )}
          {!loadingBalances && !errorBalances && balances && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M20 12a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 002 2M20 12v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4" />
                    </svg>
                    <p className="text-lg font-medium text-blue-700">XRP Balance</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-900">
                      {parseFloat(balances.xrpBalance).toLocaleString()} 
                      <span className="text-lg ml-1 font-semibold text-blue-700">{balances.currency.xrp}</span>
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-green-50 rounded-xl border border-green-100 flex flex-col justify-between">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-green-700">RLUSD Balance</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-900">
                      {parseFloat(balances.rlusdBalance).toLocaleString()} 
                      <span className="text-lg ml-1 font-semibold text-green-700">{balances.currency.rlusd}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-gray-700 font-medium">XRPL Donation Wallet:</p>
                </div>
                <div className="flex items-center mt-2">
                  <code className="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 flex-1">{balances.account}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(balances.account);
                      alert('Wallet address copied to clipboard!');
                    }}
                    className="ml-2 p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                    title="Copy address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Transactions Section */}
      <section className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800">Recent Outgoing Donations to Verified Schools</h2>
        </div>
        
        <div className="p-6">
          {loadingTransactions && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600">Loading transaction history...</span>
            </div>
          )}
          
          {errorTransactions && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Error loading transactions</p>
                  <p className="text-sm">{errorTransactions}</p>
                </div>
              </div>
            </div>
          )}
          
          {!loadingTransactions && !errorTransactions && transactions.length === 0 && (
            <div className="text-center py-12 px-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Outgoing Transactions Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">There are no verified outgoing transactions to schools at this time. Transactions will appear here after funds are sent to verified school accounts.</p>
            </div>
          )}
          
          {!loadingTransactions && !errorTransactions && transactions.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To School</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => {
                    // Parse timestamp
                    let dateObj;
                    try {
                      dateObj = new Date(tx.timestamp);
                    } catch(e) {
                      dateObj = null;
                    }
                    
                    // Format date parts if valid
                    const dateStr = dateObj ? dateObj.toLocaleDateString() : 'Invalid Date';
                    const timeStr = dateObj ? dateObj.toLocaleTimeString() : 'Invalid Time';
                    
                    // Truncate wallet address for display
                    const truncatedAddress = tx.destinationAddress.length > 12 ?
                      `${tx.destinationAddress.substring(0, 6)}...${tx.destinationAddress.substring(tx.destinationAddress.length-4)}` :
                      tx.destinationAddress;
                    
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dateStr}</div>
                          <div className="text-xs text-gray-500">{timeStr}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {parseFloat(tx.amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">{tx.currency}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tx.destinationSchoolName ? (
                            <span className="text-sm text-gray-900">{tx.destinationSchoolName}</span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Unknown School</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200" title={tx.destinationAddress}>
                              {truncatedAddress}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link 
                            href={tx.explorerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center text-green-600 hover:text-green-800 transition hover:underline"
                          >
                            <span>View on Explorer</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default DonationsPage;
