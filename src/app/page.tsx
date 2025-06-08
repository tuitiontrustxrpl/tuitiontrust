import Link from 'next/link';
import QrCodeDisplay from '@/components/QrCodeDisplay';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS || 'rNPhw4JALciTdSrwZ3gKwrntnS5zAUatDy';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-green-50 via-white to-white pt-8 pb-16 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-b from-green-100 to-green-50 opacity-20 transform -skew-x-12 animate-pulse"></div>
          <div className="absolute left-0 bottom-0 w-1/3 h-64 bg-gradient-to-r from-amber-100 to-amber-50 opacity-30 transform skew-x-12"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-green-100 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-100 opacity-20 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0 text-center md:text-left">
              <div className="inline-block mb-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold tracking-wide">
                Empowering Education via XRPL
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                <span className="text-green-700 inline-block transform transition-all hover:scale-105 duration-300">Empowering</span> Education <br />
                <span className="text-amber-600 inline-block transform transition-all hover:scale-105 duration-300">Where It's Needed Most</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                TuitionTrust connects donors directly with underprivileged schools through transparent, 
                blockchain-backed donations on the XRP Ledger. Every contribution creates opportunity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/donate" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-md shadow-md transition-all transform hover:-translate-y-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Make a Donation
                </Link>
                <Link href="/schools" className="inline-flex items-center px-6 py-3 text-base font-medium text-green-700 border border-green-700 bg-white hover:bg-green-50 rounded-md shadow-sm transition-all transform hover:-translate-y-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Register Your School
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative transform transition-transform duration-500 hover:scale-105">
              <div className="relative z-10">
                <QrCodeDisplay value={DONATION_ADDRESS} />
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-amber-100 rounded-full opacity-70 animate-pulse z-0"></div>
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-green-100 rounded-full opacity-70 animate-pulse z-0"></div>
            </div>
          </div>
        </div>
      </section>
      {/* Impact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-3 px-4 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold tracking-wide">
              Making A Difference
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Making an Impact Where It Matters</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">TuitionTrust focuses on connecting donors with schools in regions with limited access to resources and funding, leveraging the power of blockchain technology.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg border border-green-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">Direct Funding</h3>
              <p className="text-gray-600 leading-relaxed">TuitionTrust eliminates middlemen, ensuring that 100% of donations reach schools that need it most, maximizing the impact of every contribution.</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg border border-green-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">Full Transparency</h3>
              <p className="text-gray-600 leading-relaxed">Every donation is tracked on the XRP Ledger, providing complete visibility of fund movement from donor to recipient school in real-time.</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg border border-green-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">Verified Schools</h3>
              <p className="text-gray-600 leading-relaxed">We verify all participating schools using Decentralized Identifiers (DIDs) to ensure your donations go to legitimate educational institutions.</p>
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
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-600 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-green-500 opacity-20 blur-xl"></div>
          <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-amber-500 opacity-20 blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:max-w-xl">
              <div className="inline-block mb-2 px-3 py-1 bg-green-800 text-green-100 rounded-full text-sm font-semibold tracking-wide">
                Join Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Make a Difference?</h2>
              <p className="text-lg text-green-100 mb-8 md:mb-0 leading-relaxed">
                Your contribution can help provide essential resources to schools that need them most. 
                Every donation on the XRP Ledger makes a transparent, verifiable impact.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/donate" className="inline-flex items-center px-8 py-4 text-base font-medium text-green-700 bg-white hover:bg-gray-100 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 text-center w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Donate Now
              </Link>
              <Link href="/schools" className="inline-flex items-center px-8 py-4 text-base font-medium text-white border-2 border-white hover:bg-green-600 rounded-xl shadow-md transition-all transform hover:-translate-y-1 text-center w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                Register a School
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

