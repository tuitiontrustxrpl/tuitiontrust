"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white border-b border-green-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-green-700">Tuition<span className="text-amber-600">Trust</span></span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink('/') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}>
              Home
            </Link>
            <Link href="/donate" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink('/donate') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}>
              Donate
            </Link>
            <Link href="/schools" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink('/schools') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}>
              Register School
            </Link>
            <Link href="/schools/list" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink('/schools/list') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}>
              Browse Schools
            </Link>
            <Link href="/donations" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActiveLink('/donations') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}>
              Donations Tracking
            </Link>
            <Link href="#" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50">
              About
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50 focus:outline-none"
            >
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-green-100">
            <Link href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink('/') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link href="/donate" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink('/donate') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Donate
            </Link>
            <Link href="/schools" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink('/schools') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Register School
            </Link>
            <Link href="/schools/list" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink('/schools/list') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Schools
            </Link>
            <Link href="/donations" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink('/donations') 
                  ? 'text-green-800 bg-green-50' 
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Donations Tracking
            </Link>
            <Link href="#" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
