"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Using alias set up during Next.js init
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FormData {
  name: string;
  contact_email: string;
  website_url: string;
  country: string;
  did: string;
  wallet_address: string;
  description: string;
}

export default function SchoolsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_email: '',
    website_url: '',
    country: '',
    did: '',
    wallet_address: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  // State for did:web generator
  const [didWebDomainInput, setDidWebDomainInput] = useState('');
  const [didWebWalletInput, setDidWebWalletInput] = useState('');
  const [generatedDidJson, setGeneratedDidJson] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from('schools')
      .insert([
        {
          name: formData.name,
          contact_email: formData.contact_email,
          website_url: formData.website_url || null, // Handle optional field
          country: formData.country || null,
          did: formData.did,
          wallet_address: formData.wallet_address || null, // Handle optional field
          description: formData.description || null, // Handle optional field
          // is_verified defaults to false in the database
        },
      ])
      .select(); // .select() can be useful to get the inserted data back if needed

    setIsLoading(false);

    if (error) {
      console.error('Error inserting data:', error);
      setMessage({ type: 'error', content: `Registration failed: ${error.message}. Please ensure your DID is unique.` });
    } else {
      setMessage({ type: 'success', content: 'Registration successful! Your application is pending verification.' });
      setFormData({
        name: '',
        contact_email: '',
        website_url: '',
        country: '',
        did: '',
        wallet_address: '',
        description: '',
      }); // Clear form
    }
  };

  const handleGenerateDidJson = () => {
    if (!didWebDomainInput || !didWebWalletInput) {
      setMessage({ type: 'error', content: 'Please enter both your website domain and XRPL wallet address for DID generation.' });
      return;
    }

    const cleanedDomain = didWebDomainInput.replace(/^https?:\/\//, '').split('/')[0];

    if (!cleanedDomain.includes('.')) {
      setMessage({ type: 'error', content: 'Please enter a valid domain name (e.g., exampleschool.edu) for DID generation.' });
      return;
    }
    // Basic XRPL r-address validation
    if (!didWebWalletInput.startsWith('r') || didWebWalletInput.length < 25 || didWebWalletInput.length > 35) {
      setMessage({ type: 'error', content: 'Please enter a valid XRPL r-address for DID generation.' });
      return;
    }

    const did = `did:web:${cleanedDomain}`;
    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      verificationMethod: [
        {
          id: `${did}#controller`,
          type: 'XrpWallet', // Custom type indicating it's an XRPL wallet/address
          controller: did,
          blockchainAccountId: `xrpl:${didWebWalletInput}`,
        },
      ],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
    };
    setGeneratedDidJson(JSON.stringify(didDocument, null, 2));
    setMessage({ type: 'success', content: 'did.json content generated successfully below.' });
  };

  const handleCopyDidJson = () => {
    if (generatedDidJson) {
      navigator.clipboard.writeText(generatedDidJson)
        .then(() => {
          setMessage({ type: 'success', content: 'did.json content copied to clipboard!' });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setMessage({ type: 'error', content: 'Failed to copy to clipboard. Please select and copy manually.' });
        });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-green-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">School Registration</h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Register your school to receive donations through TuitionTrust's secure blockchain-based platform.
            </p>
          </div>
  
          {/* DID Information Section */}
          <div className="bg-gradient-to-br from-green-50 to-white p-7 mb-8 rounded-lg border border-green-100 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">About DIDs and Registration</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                A DID (Decentralized Identifier) is a globally unique identifier that you control. It helps us verify your institution's identity securely and transparently.
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <p className="font-medium text-gray-700 mb-2">
                  If you don't have a DID, you have options:
                </p>
                <ul className="list-disc list-outside text-gray-600 space-y-2 pl-5">
                  <li>
                    <strong>For schools with a website:</strong> Consider using <code className="text-xs bg-gray-100 p-1 rounded font-mono">did:web</code>. You can host a small JSON file on your website. Use the generator tool below.
                  </li>
                  <li>
                    <strong>Alternative:</strong> <code className="text-xs bg-gray-100 p-1 rounded font-mono">did:key</code> can be generated from a cryptographic key pair. Search for "did:key generator" for local tools.
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 italic text-center">TuitionTrust will perform an off-chain verification of your submitted DID and school information.</p>
            </div>
          </div>
  
          {/* DID Generator Tool */}
          <div className="bg-gradient-to-br from-amber-50 to-white p-7 mb-8 rounded-lg border border-amber-100 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-amber-800 mb-4 text-center">Need help with your DID?</h2>
            <p className="text-gray-600 mb-5 text-center max-w-2xl mx-auto">
              Enter your school's website domain and XRPL wallet address for verification. We'll generate the <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">did.json</code> content for you.
            </p>
            <div className="bg-white p-5 rounded-lg border border-amber-100 mb-5 max-w-2xl mx-auto">
              <div className="grid gap-5 mb-5">
                <div>
                  <label htmlFor="didWebDomainInput" className="block text-sm font-medium text-gray-700 mb-1.5">Your Website Domain</label>
                  <input
                    type="text"
                    id="didWebDomainInput"
                    value={didWebDomainInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDidWebDomainInput(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    placeholder="exampleschool.edu"
                  />
                </div>
                <div>
                  <label htmlFor="didWebWalletInput" className="block text-sm font-medium text-gray-700 mb-1.5">Your School's XRPL Wallet Address</label>
                  <input
                    type="text"
                    id="didWebWalletInput"
                    value={didWebWalletInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDidWebWalletInput(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    placeholder="rXXXXXXXXXXXXXXXXXXXX"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateDidJson}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium shadow-sm"
                >
                  Generate did.json Content
                </button>
              </div>
            </div>
  
            {generatedDidJson && (
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-amber-800">Your did.json File Content</h3>
                    <button 
                      onClick={handleCopyDidJson} 
                      className="text-sm px-4 py-1.5 bg-white text-amber-700 rounded-md border border-amber-300 hover:bg-amber-50 transition-colors shadow-sm flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="p-4">
                    <textarea
                      id="generatedDidJsonOutput"
                      readOnly
                      value={generatedDidJson}
                      className="block w-full h-56 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-amber-50 to-white">
                    <h4 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How to use this <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">did.json</code> content:
                    </h4>
                    <ol className="list-decimal list-outside text-gray-700 space-y-2 pl-5">
                      <li>Copy the JSON content above</li>
                      <li>Create a file named "did.json" on your web server</li>
                      <li>In your domain (example.com) create a ".well-known" directory</li>
                      <li>Place the did.json file inside that directory</li>
                      <li>The file should be accessible at: https://example.com/.well-known/did.json</li>
                      <li>Use the generated DID (did:web:example.com) in the registration form below</li>
                    </ol>
                    <div className="mt-3 text-center">
                      <a 
                        href="https://w3c-ccg.github.io/did-method-web/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1">
                        <span>Learn more about the did:web method specification</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
  
          {/* Registration Form */}
          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">School Registration Form</h2>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-3xl mx-auto">
              <div className="grid gap-6 mb-8 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">School Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Enter your school's official name"
                  />
                </div>
      
                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="e.g., admin@exampleschool.edu"
                  />
                </div>
                
                <div>
                  <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
                  <input
                    type="url"
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="e.g., https://www.exampleschool.edu"
                  />
                </div>
      
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                  >
                    <option value="">Select a country</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Ukraine">Ukraine</option>
                    <option value="Romania">Romania</option>
                    <option value="Poland">Poland</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="did" className="block text-sm font-medium text-gray-700 mb-1.5">Decentralized Identifier (DID) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="did"
                    name="did"
                    value={formData.did}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="e.g., did:web:exampleschool.edu"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">This will be used to verify your institution's identity. See section above for help.</p>
                </div>
      
                <div>
                  <label htmlFor="wallet_address" className="block text-sm font-medium text-gray-700 mb-1.5">XRPL Wallet Address (for RLUSD)</label>
                  <input
                    type="text"
                    id="wallet_address"
                    name="wallet_address"
                    value={formData.wallet_address}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Your school's public XRPL address (e.g., rXXXX...)"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">This address will be used to receive RLUSD donations.</p>
                </div>
      
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">School Description / Mission</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Briefly describe your school and its mission (optional)"
                  />
                </div>
              </div>
      
              {message && (
                <div className={`p-4 my-6 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  <div className="flex items-center">
                    {message.type === 'success' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {message.content}
                  </div>
                </div>
              )}
      
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
  
          {/* Placeholder for Profile Management Section (Future) */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Manage Your Profile</h2>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-gray-700">Once verified, school profile details and funding status will be displayed here.</p>
              <p className="text-center text-gray-500 text-sm mt-2">This section is under construction and will be available soon.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}