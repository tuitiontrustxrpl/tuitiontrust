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
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">School Registration</h1>
            <p className="text-lg text-gray-700">
              Register your school to receive donations through TuitionTrust's secure blockchain-based platform.
            </p>
          </div>
  
          {/* DID Information Section */}
          <div className="bg-gradient-to-br from-green-50 to-white p-6 mb-6 rounded-lg border border-green-100 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">About DIDs and Registration</h2>
            <p className="text-sm text-gray-600 mb-2">
              A DID (Decentralized Identifier) is a globally unique identifier that you control. It helps us verify your institution's identity securely and transparently.
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>If you don't have a DID:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-4">
              <li><strong>For schools with a website:</strong> Consider using <code className="text-xs bg-gray-200 p-1 rounded">did:web</code>. You can host a small JSON file on your website. See the generator tool below.</li>
              <li><strong>Alternative:</strong> <code className="text-xs bg-gray-200 p-1 rounded">did:key</code> can be generated from a cryptographic key pair. Search for "did:key generator" for local tools.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">TuitionTrust will perform an off-chain verification of your submitted DID and school information.</p>
          </div>
  
          {/* DID Generator Tool */}
          <div className="bg-amber-50 p-6 mb-6 rounded-lg border border-amber-100 shadow-md">
            <h2 className="text-xl font-semibold text-amber-800 mb-3">Need help with your DID?</h2>
            <p className="text-sm text-gray-600 mb-3">
              Enter your school's website domain and the XRPL wallet address you'll use for verification. We'll generate the <code>did.json</code> content for you.
            </p>
            <div className="space-y-3 mb-3">
              <div>
                <label htmlFor="didWebDomainInput" className="block text-xs font-medium text-gray-700">Your Website Domain (e.g., exampleschool.edu)</label>
                <input
                  type="text"
                  id="didWebDomainInput"
                  value={didWebDomainInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDidWebDomainInput(e.target.value)}
                  className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  placeholder="exampleschool.edu"
                />
              </div>
              <div>
                <label htmlFor="didWebWalletInput" className="block text-xs font-medium text-gray-700">Your School's XRPL Wallet Address (r...)</label>
                <input
                  type="text"
                  id="didWebWalletInput"
                  value={didWebWalletInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDidWebWalletInput(e.target.value)}
                  className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  placeholder="rXXXXXXXXXXXXXXXXXXXX"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateDidJson}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium"
            >
              Generate did.json Content
            </button>
  
            {generatedDidJson && (
              <div className="mt-4">
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-md font-medium text-gray-800">Your did.json File Content:</h3>
                    <button onClick={handleCopyDidJson} className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                      Copy to Clipboard
                    </button>
                  </div>
                  <textarea
                    id="generatedDidJsonOutput"
                    readOnly
                    value={generatedDidJson}
                    className="mt-1 block w-full h-48 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm font-mono text-xs"
                  />
                  <div className="mt-3 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                    <h4 className="text-sm font-semibold text-yellow-800">How to use this <code>did.json</code> content:</h4>
                    <ol className="list-decimal list-inside text-sm text-gray-600 mt-3 space-y-2">
                      <li>Copy the JSON content above</li>
                      <li>Create a file named "did.json" on your web server</li>
                      <li>In your domain (example.com) create a ".well-known" directory</li>
                      <li>Place the did.json file inside that directory</li>
                      <li>The file should be accessible at: https://example.com/.well-known/did.json</li>
                      <li>Use the generated DID (did:web:example.com) in the registration form below</li>
                      <li>For more details on did:web, see the <a href="https://w3c-ccg.github.io/did-method-web/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">did:web method specification</a></li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
  
          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">School Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your school's official name"
              />
            </div>
  
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., admin@exampleschool.edu"
              />
            </div>
  
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., https://www.exampleschool.edu"
              />
            </div>
  
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
  
            <div>
              <label htmlFor="did" className="block text-sm font-medium text-gray-700 mb-1">Decentralized Identifier (DID) <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="did"
                name="did"
                value={formData.did}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., did:web:exampleschool.edu"
              />
              <p className="mt-1 text-xs text-gray-500">This will be used to verify your institution's identity. See section above for help.</p>
            </div>
  
            <div>
              <label htmlFor="wallet_address" className="block text-sm font-medium text-gray-700 mb-1">XRPL Wallet Address (for RLUSD)</label>
              <input
                type="text"
                id="wallet_address"
                name="wallet_address"
                value={formData.wallet_address}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Your school's public XRPL address (e.g., rXXXX...)"
              />
              <p className="mt-1 text-xs text-gray-500">This address will be used to receive RLUSD donations.</p>
            </div>
  
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">School Description / Mission</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Briefly describe your school and its mission (optional)"
              />
            </div>
  
            {message && (
              <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.content}
              </div>
            )}
  
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
  
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