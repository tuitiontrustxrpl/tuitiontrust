"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface School {
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

// Helper function to create a URL-friendly slug from a string
const slugify = (text: string): string => {
  if (!text) return 'n-a';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

// Helper function to convert original DID to URL param format
const slugifyDid = (did: string): string => {
  if (!did) return 'invalid-did';
  return did.replace(/:/g, '-');
};

export default function SchoolsListPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: supabaseError } = await supabase
          .from('schools')
          .select('*')
          .order('name', { ascending: true });

        if (supabaseError) {
          throw supabaseError;
        }
        setSchools(data || []);
      } catch (e: any) {
        console.error('Error fetching schools:', e);
        setError(`Failed to load schools: ${e.message}`);
        setSchools([]);
      }
      setLoading(false);
    };

    fetchSchools();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-green-50 to-amber-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-800 mb-4">Registered Schools</h1>
          <p className="text-lg text-center text-gray-600 max-w-2xl mx-auto">Browse the list of educational institutions on TuitionTrust ready to receive donations through the XRPL.</p>
        </div>
      </div>
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-700 text-lg">Loading schools...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg shadow-sm mb-8 max-w-3xl mx-auto" role="alert">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-medium">Error:</strong>
                <span className="ml-1">{error}</span>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && schools.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-700 text-xl font-medium mb-2">No schools registered yet</p>
            <p className="text-gray-500">Check back soon as schools continue to join the platform.</p>
          </div>
        )}

        {!loading && !error && schools.length > 0 && (
          <>
            <p className="text-gray-700 mb-8 text-center">{schools.length} {schools.length === 1 ? 'institution' : 'institutions'} currently registered</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${slugifyDid(school.did)}/${slugify(school.name)}`}
                  className="block bg-white shadow hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200"
                >
                  <div className="p-5">
                    <div className="flex justify-between mb-3">
                      {school.is_verified ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          <svg className="mr-1 h-2 w-2 fill-green-500" viewBox="0 0 6 6" aria-hidden="true">
                            <circle cx="3" cy="3" r="3" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <svg className="mr-1 h-2 w-2 fill-amber-500" viewBox="0 0 6 6" aria-hidden="true">
                            <circle cx="3" cy="3" r="3" />
                          </svg>
                          Pending
                        </span>
                      )}
                      
                      {school.country && (
                        <span className="text-sm text-gray-500 font-medium">
                          {school.country}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-semibold text-green-700 mb-3 truncate" title={school.name}>
                      {school.name}
                    </h2>
                    
                    <div className="space-y-2.5 mb-4">
                      <p className="text-sm text-gray-600 truncate font-mono" title={school.did}>
                        <span className="text-gray-500 mr-1">DID:</span> {school.did}
                      </p>
                      
                      {school.website_url && (
                        <p className="text-sm truncate" title={school.website_url}>
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (school.website_url) {
                                window.open(school.website_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="text-green-600 hover:text-green-700 cursor-pointer flex items-center"
                            role="link"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (school.website_url) {
                                  window.open(school.website_url, '_blank', 'noopener,noreferrer');
                                }
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {school.website_url.replace(/^https?:\/\//, '')}
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3 mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="text-green-600 font-medium text-sm hover:underline">View details</div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
