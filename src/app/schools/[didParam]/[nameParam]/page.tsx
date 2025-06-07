"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useParams } from 'next/navigation'; // Correct hook for App Router
import { QRCodeCanvas } from 'qrcode.react';

interface SchoolData {
  id: string;
  created_at: string;
  name: string;
  contact_email: string;
  website_url?: string | null;
  country?: string | null;
  did: string;
  wallet_address?: string | null;
  description?: string | null;
  is_verified: boolean;
}

interface Transaction {
  id: string;
  timestamp: string;
  amount: string;
  currency: string;
  sender: string;
  explorer_url: string;
}

// Helper function to convert URL param back to original DID format
const deslugifyDid = (didParam: string): string => {
  if (!didParam) return '';
  const parts = didParam.split('-');
  // A valid slugified DID should have at least 3 parts (e.g., did-key-identifier)
  if (parts.length < 3) {
    console.warn(`Unexpected didParam format for deslugification: ${didParam}. Attempting basic replacement.`);
    // Fallback to a simple replacement if the structure is not as expected (e.g. did-something)
    // This might still be incorrect for some edge cases but is better than crashing.
    return didParam.replace(/-/g, ':'); 
  }
  const scheme = parts[0];
  const method = parts[1];
  const identifier = parts.slice(2).join('-'); // Join the rest with hyphens preserved
  return `${scheme}:${method}:${identifier}`;
};

export default function SchoolProfilePage() {
  const params = useParams();
  const didParam = typeof params.didParam === 'string' ? params.didParam : '';
  // nameParam is mostly for URL aesthetics, DID is the primary identifier
  // const nameParam = typeof params.nameParam === 'string' ? params.nameParam : ''; 

  const [school, setSchool] = useState<SchoolData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!didParam) {
      setLoading(false);
      setError('School identifier not found in URL.');
      return;
    }

    const fetchSchoolData = async () => {
      setLoading(true);
      setError(null);
      const originalDid = deslugifyDid(didParam);

      try {
        // Fetch school details from Supabase
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('did', originalDid)
          .single();

        if (schoolError) {
          console.error('Error fetching school data:', schoolError);
          setError(`Failed to load school data: ${schoolError.message}. Please check if the DID is correct.`);
          setSchool(null);
          setLoading(false);
          return;
        }

        if (!schoolData) {
          setError('School not found.');
          setSchool(null);
          setLoading(false);
          return;
        }
        
        setSchool(schoolData as SchoolData);

        // If school has a wallet address, fetch transactions
        if (schoolData.wallet_address) {
          console.log(`Fetching transactions for ${schoolData.wallet_address}...`);
          try {
            const res = await fetch(`/api/xrpl/account-transactions?address=${encodeURIComponent(schoolData.wallet_address)}`);
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Failed to fetch transactions and could not parse error response.' }));
              console.error('Error fetching transactions:', res.status, errorData);
              // Optionally set an error state specific to transactions
              // setError(`Failed to load transactions: ${errorData.message || res.statusText}`);
              setTransactions([]); // Keep transactions empty on error or set specific error message for transactions part
            } else {
              const fetchedTransactions: Transaction[] = await res.json();
              setTransactions(fetchedTransactions);
            }
          } catch (txError: any) {
            console.error('Error during transaction fetch operation:', txError);
            // Optionally set an error state specific to transactions
            // setError(`Error fetching transactions: ${txError.message}`);
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }

      } catch (e: any) {
        console.error('Error in fetchSchoolData:', e);
        setError(e.message || 'An unexpected error occurred.');
        setSchool(null);
        setTransactions([]);
      }
      setLoading(false);
    };

    fetchSchoolData();
  }, [didParam]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-700 text-lg">Loading school profile...</p>
            <p className="text-gray-500 text-sm mt-2">Retrieving data from Supabase and XRPL</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm max-w-2xl mx-auto" role="alert">
            <div className="flex items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-800">Error Loading School Profile</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <a href="/schools/list" className="inline-flex items-center text-red-700 hover:text-red-800 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Schools List
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-xl font-medium text-gray-700 mb-2">School Profile Not Found</h2>
            <p className="text-gray-500 mb-6">The school profile you're looking for could not be found. It may have been removed or the URL might be incorrect.</p>
            <a href="/schools/list" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              Browse All Schools
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-500 p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{school.name}</h1>
                {school.is_verified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-green-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-green-100 font-mono text-sm mb-2">DID: <span className="bg-green-700 bg-opacity-30 px-2 py-1 rounded">{school.did}</span></p>
                  {school.country && (
                    <p className="text-green-100 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      {school.country}
                    </p>
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <a
                    href="/donate"
                    className="inline-flex items-center px-4 py-2 bg-white text-green-700 rounded-md shadow hover:bg-green-50 transition font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Donate to This School
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-800">School Information</h2>
                </div>
                <div className="space-y-4 text-sm text-gray-600">
                  {school.website_url && (
                    <div className="flex border-b border-gray-100 pb-3">
                      <dt className="font-medium text-gray-700 w-24">Website:</dt>
                      <dd className="flex-1">
                        <a 
                          href={school.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-green-600 hover:text-green-700 transition group"
                        >
                          <span className="mr-1 group-hover:underline">{school.website_url}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </dd>
                    </div>
                  )}
                  {school.contact_email && (
                    <div className="flex border-b border-gray-100 pb-3">
                      <dt className="font-medium text-gray-700 w-24">Email:</dt>
                      <dd className="flex-1">
                        <a 
                          href={`mailto:${school.contact_email}`}
                          className="inline-flex items-center text-gray-800 hover:text-green-700 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {school.contact_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {school.country && (
                    <div className="flex border-b border-gray-100 pb-3">
                      <dt className="font-medium text-gray-700 w-24">Country:</dt>
                      <dd className="flex-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {school.country}
                      </dd>
                    </div>
                  )}
                  {school.description && (
                    <div className="pt-2">
                      <dt className="font-medium text-gray-700 mb-2">Description:</dt>
                      <dd className="bg-white p-4 rounded border border-gray-200 whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {school.description}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-100">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-800">XRPL Direct Donation</h2>
                </div>
                <div className="mt-4">
                  {school.wallet_address ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">Scan to Donate via XRPL:</h3>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-green-200 inline-block">
                          <QRCodeCanvas value={school.wallet_address} size={160} bgColor={"#ffffff"} fgColor={"#000000"} level={"Q"} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">XRPL Wallet Address:</h3>
                        <div className="flex items-center space-x-2">
                          <div className="font-mono text-xs bg-white p-2 rounded border border-gray-200 flex-1 break-all">
                            {school.wallet_address}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(school.wallet_address || '');
                              alert('Wallet address copied to clipboard!');
                            }}
                            className="p-2 bg-green-100 rounded hover:bg-green-200 transition"
                            title="Copy address"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scan the QR code or copy this address to donate directly via any XRPL-compatible wallet.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <h3 className="font-medium text-yellow-800 mb-1">No XRPL Address Available</h3>
                          <p className="text-sm">This school has not provided an XRPL wallet address for donations. Please contact the school directly for donation information.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
              </div>
              
              {school.wallet_address ? (
                transactions.length > 0 ? (
                  <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sender</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {tx.timestamp && tx.timestamp !== 'N/A' ? 
                                  <div>
                                    <div className="font-medium text-gray-800">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                                  </div> : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-green-700">
                                  {tx.amount} <span className="text-xs font-bold">{tx.currency}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-mono text-xs text-gray-500 truncate max-w-[150px]" title={tx.sender}>
                                    {tx.sender}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <a 
                                  href={tx.explorer_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center text-green-600 hover:text-green-800 transition text-sm"
                                >
                                  <span className="mr-1">View on Explorer</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-xl shadow border border-gray-200 flex items-center justify-center flex-col text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="text-gray-600 font-medium text-lg mb-2">No Transactions Found</h3>
                    <p className="text-gray-500 max-w-md mb-4">No transactions have been recorded for this school's address yet. This could be because no donations have been made or transaction fetching is still being implemented.</p>
                    <a href="/donate" className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm text-sm font-medium transition">
                      Be the first to donate!
                    </a>
                  </div>
                )
              ) : (
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-gray-700 font-medium text-lg mb-2">No XRPL Address Available</h3>
                  <p className="text-gray-500 max-w-md mx-auto">This school has not provided an XRPL wallet address for donations. Please contact the school directly for alternative donation methods.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
