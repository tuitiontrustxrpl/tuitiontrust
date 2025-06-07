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
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Donation Wallet Tracking</h1>

      {!donationWalletAddress && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Configuration Error: </strong>
          <span className="block sm:inline">The `NEXT_PUBLIC_DONATION_ADDRESS` is not set. Please configure it in your environment variables.</span>
        </div>
      )}

      {/* Balances Section */}
      <section className="mb-12 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Wallet Balances</h2>
        {loadingBalances && <p className="text-gray-600">Loading balances...</p>}
        {errorBalances && <p className="text-red-500">Error: {errorBalances}</p>}
        {balances && !loadingBalances && !errorBalances && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-lg font-medium text-blue-700">Total XRP:</p>
              <p className="text-2xl font-bold text-blue-900">{parseFloat(balances.xrpBalance).toLocaleString()} {balances.currency.xrp}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-lg font-medium text-green-700">Total RLUSD:</p>
              <p className="text-2xl font-bold text-green-900">{parseFloat(balances.rlusdBalance).toLocaleString()} {balances.currency.rlusd}</p>
            </div>
            <div className="md:col-span-2 mt-2">
                <p className="text-sm text-gray-500">Wallet Address: <code className="bg-gray-100 p-1 rounded text-xs">{balances.account}</code></p>
            </div>
          </div>
        )}
      </section>

      {/* Transactions Section */}
      <section className="p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Recent Outgoing Donations to Verified Schools</h2>
        {loadingTransactions && <p className="text-gray-600">Loading transactions...</p>}
        {errorTransactions && <p className="text-red-500">Error: {errorTransactions}</p>}
        {!loadingTransactions && !errorTransactions && transactions.length === 0 && (
          <p className="text-gray-600">No outgoing transactions to verified schools found.</p>
        )}
        {!loadingTransactions && !errorTransactions && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To School</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatTimestamp(tx.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{parseFloat(tx.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.destinationSchoolName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="bg-gray-100 p-1 rounded text-xs">{tx.destinationAddress}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 hover:underline">
                        View on Explorer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default DonationsPage;
