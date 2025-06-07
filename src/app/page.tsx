import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-green-50 to-white pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-green-50 opacity-20 transform -skew-x-12"></div>
          <div className="absolute left-0 bottom-0 w-1/3 h-64 bg-amber-50 opacity-30 transform skew-x-12"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                <span className="text-green-700">Empowering</span> Education <br />
                <span className="text-amber-600">Where It's Needed Most</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl mx-auto md:mx-0">
                TuitionTrust connects donors directly with underprivileged schools through transparent, 
                blockchain-backed donations. Every contribution creates opportunity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/donate" legacyBehavior>
                  <span className="inline-block px-6 py-3 text-base font-medium text-white bg-green-700 hover:bg-green-800 rounded-md shadow-md transition-all">
                    Make a Donation
                  </span>
                </Link>
                <Link href="/schools" legacyBehavior>
                  <span className="inline-block px-6 py-3 text-base font-medium text-green-700 border border-green-700 hover:bg-green-50 rounded-md shadow-sm transition-all">
                    Register Your School
                  </span>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative h-72 sm:h-80 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
                {/* Placeholder for an image - in production you would use a real image */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-amber-100 to-green-100 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">Supporting education in underprivileged communities</p>
                    <p className="text-xs mt-2 text-gray-600">Image placeholder - Insert hero image here</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-100 rounded-full z-0"></div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-green-100 rounded-full z-0"></div>
            </div>
          </div>
        </div>
      </section>
      {/* Impact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Making an Impact Where It Matters</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">TuitionTrust focuses on connecting donors with schools in regions with limited access to resources and funding.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Direct Funding</h3>
              <p className="text-gray-600">100% of your donation goes directly to the schools. XRPL's low-cost transactions ensure maximum impact of your contribution.</p>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-lg shadow-sm border border-amber-100">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Transparency</h3>
              <p className="text-gray-600">Every donation is recorded on the XRP Ledger, providing complete transparency for how funds are distributed.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Schools</h3>
              <p className="text-gray-600">We verify all participating schools using Decentralized Identifiers (DIDs) to ensure your donations reach legitimate institutions.</p>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How TuitionTrust Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Our platform leverages blockchain technology to create a secure, transparent giving experience.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-12 md:gap-x-6">
                {/* Step 1 */}
                <div className="relative flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg z-10">
                    1
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Donate</h3>
                    <p className="text-gray-600">Make a secure donation in RLUSD via our simple QR code system.</p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="relative flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg z-10">
                    2
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Verify</h3>
                    <p className="text-gray-600">Schools register with DIDs and undergo our verification process.</p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="relative flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg z-10">
                    3
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Distribute</h3>
                    <p className="text-gray-600">Funds are securely managed and distributed to qualified schools.</p>
                  </div>
                </div>
                
                {/* Step 4 */}
                <div className="relative flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg z-10">
                    4
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Track</h3>
                    <p className="text-gray-600">All transactions are transparently tracked on the XRP Ledger.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:max-w-xl">
              <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
              <p className="text-lg text-green-100 mb-6 md:mb-0">
                Your contribution can help provide essential resources to schools that need them most. 
                Every donation makes an impact.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/donate" legacyBehavior>
                <span className="inline-block px-6 py-3 text-base font-medium text-green-700 bg-white hover:bg-gray-100 rounded-md shadow-md transition-all text-center w-full sm:w-auto">
                  Donate Now
                </span>
              </Link>
              <Link href="/schools" legacyBehavior>
                <span className="inline-block px-6 py-3 text-base font-medium text-white border border-white hover:bg-green-600 rounded-md shadow-sm transition-all text-center w-full sm:w-auto">
                  Register a School
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

