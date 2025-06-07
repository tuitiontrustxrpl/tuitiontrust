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
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Registered Schools</h1>
          <p className="mt-2 text-lg text-gray-600">Browse the list of educational institutions on TuitionTrust.</p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <p className="text-gray-700 text-lg">Loading schools...</p>
            {/* You can add a spinner here */}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && schools.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-700 text-lg">No schools registered yet.</p>
          </div>
        )}

        {!loading && !error && schools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${slugifyDid(school.did)}/${slugify(school.name)}`}
                legacyBehavior
              >
                <a className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-green-700 mb-2 truncate" title={school.name}>{school.name}</h2>
                    <p className="text-sm text-gray-600 mb-1 truncate" title={school.did}>DID: {school.did}</p>
                    {school.country && <p className="text-sm text-gray-500 mb-1">Country: {school.country}</p>}
                    {school.website_url &&
                      <p className="text-sm text-green-600 hover:text-green-700 truncate" title={school.website_url}>
                          <span
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (school.website_url) {
                                    window.open(school.website_url, '_blank', 'noopener,noreferrer');
                                  }
                              }}
                              className="cursor-pointer"
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
                              {school.website_url.replace(/^https?:\/\//, '')}
                          </span>
                      </p>
                    }
                    <div className="mt-3">
                      {school.is_verified ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Verified</span>
                      ) : (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pending Verification</span>
                      )}
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
