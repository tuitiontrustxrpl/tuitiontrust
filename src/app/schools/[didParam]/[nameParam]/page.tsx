"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useParams } from 'next/navigation'; // Correct hook for App Router

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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p className="text-center text-gray-700">Loading school profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p className="text-center text-gray-700">School profile not found.</p>
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
          <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{school.name}</h1>
            <p className="text-green-100 text-sm sm:text-base">DID: {school.did}</p>
            {school.is_verified ? (
                <span className="inline-block bg-white text-green-600 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2">Verified</span>
            ) : (
                <span className="inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2">Pending Verification</span>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">School Information</h2>
                <dl className="space-y-2 text-sm text-gray-600">
                  {school.website_url && (
                    <div>
                      <dt className="font-medium text-gray-700">Website:</dt>
                      <dd><a href={school.website_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{school.website_url}</a></dd>
                    </div>
                  )}
                  {school.contact_email && (
                     <div>
                      <dt className="font-medium text-gray-700">Email:</dt>
                      <dd>{school.contact_email}</dd>
                    </div>
                  )}
                  {school.country && (
                    <div>
                      <dt className="font-medium text-gray-700">Country:</dt>
                      <dd>{school.country}</dd>
                    </div>
                  )}
                  {school.description && (
                    <div className="pt-2">
                      <dt className="font-medium text-gray-700 mb-1">Description:</dt>
                      <dd className="whitespace-pre-wrap">{school.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Financials</h2>
                 <dl className="space-y-2 text-sm text-gray-600">
                    {school.wallet_address ? (
                        <div>
                        <dt className="font-medium text-gray-700">Registered XRPL Address:</dt>
                        <dd className="font-mono text-xs bg-gray-100 p-1 rounded inline-block">{school.wallet_address}</dd>
                        </div>
                    ) : (
                        <div>
                        <dt className="font-medium text-gray-700">Registered XRPL Address:</dt>
                        <dd className="text-gray-500 italic">Not provided</dd>
                        </div>
                    )}
                </dl>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
              {school.wallet_address ? (
                transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                          <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tx ID</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {tx.timestamp && tx.timestamp !== 'N/A' ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{tx.amount} {tx.currency}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{tx.sender}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-xs">View on Explorer</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No transactions found for this school's address yet, or transaction fetching is not yet implemented.</p>
                )
              ) : (
                <p className="text-sm text-gray-500">This school has not provided an XRPL wallet address for donations.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
