"use client";

import dynamic from 'next/dynamic';
const QRCodeCanvas = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeCanvas), { ssr: false });
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Donation {
  id: string; // Transaction hash
  sender: string;
  amount: string;
  currency: string;
  timestamp: string;
  explorerUrl: string;
}

const DONATION_ADDRESS = process.env.NEXT_PUBLIC_DONATION_ADDRESS;
const RLUSD_ISSUER_ADDRESS = process.env.NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS;
const HEX_CURRENCY_CODE = process.env.NEXT_PUBLIC_RLUSD_CURRENCY_CODE;
const DISPLAY_CURRENCY_CODE = 'RLUSD'; // For user display

const RLUSD_PRESETS = [1, 5, 10, 20, 50, 100];
const XRP_PRESETS = [0.1, 0.2, 0.5, 1];
const XRP_TO_DROPS_CONVERSION = 1000000;

interface DonationPreset {
  amount: number;
  currency: 'RLUSD' | 'XRP';
  displayAmount: string;
}

let envWarning = '';

if (!DONATION_ADDRESS || !RLUSD_ISSUER_ADDRESS || !HEX_CURRENCY_CODE) {
  console.warn("Warning: NEXT_PUBLIC_DONATION_ADDRESS, NEXT_PUBLIC_RLUSD_ISSUER_ADDRESS, or NEXT_PUBLIC_RLUSD_CURRENCY_CODE is not set in .env.local. QR code may not function correctly.");
  envWarning = 'Donation address, RLUSD issuer, or currency code is not configured. Please contact support or try again later.';
  // Provide a fallback or prevent QR code generation if critical info is missing
  // For now, we'll let it try to generate, which might result in an invalid QR code if vars are missing.
}

export default function DonatePage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For donation history
  const [error, setError] = useState<string | null>(null); // For donation history

  const [selectedPreset, setSelectedPreset] = useState<DonationPreset | null>(null);
  const [currentQrCodeUri, setCurrentQrCodeUri] = useState<string>('');

  useEffect(() => {
    if (!DONATION_ADDRESS) {
      setCurrentQrCodeUri('');
      return;
    }

    let baseUri = `xrpl:${DONATION_ADDRESS}`;
    const params = new URLSearchParams();

    if (selectedPreset) {
      if (selectedPreset.currency === 'RLUSD') {
        if (HEX_CURRENCY_CODE && RLUSD_ISSUER_ADDRESS) {
          params.append('currency', HEX_CURRENCY_CODE);
          params.append('issuer', RLUSD_ISSUER_ADDRESS);
          params.append('amount', selectedPreset.amount.toString());
        } else {
          setCurrentQrCodeUri(baseUri); // Fallback if RLUSD config missing for preset
          return;
        }
      } else { // XRP
        params.append('amount', (selectedPreset.amount * XRP_TO_DROPS_CONVERSION).toString());
      }
    } else {
      // No preset selected, use default RLUSD URI if configured
      if (HEX_CURRENCY_CODE && RLUSD_ISSUER_ADDRESS) {
        params.append('currency', HEX_CURRENCY_CODE);
        params.append('issuer', RLUSD_ISSUER_ADDRESS);
      }
    }

    const queryString = params.toString();
    const finalUri = queryString ? `${baseUri}?${queryString}` : baseUri;
    console.log('Generated QR Code URI:', finalUri); // DEBUGGING LINE
    setCurrentQrCodeUri(finalUri);

  }, [selectedPreset]); // Removed DONATION_ADDRESS, HEX_CURRENCY_CODE, RLUSD_ISSUER_ADDRESS from deps as they are module consts

  const handlePresetClick = (amount: number, currency: 'RLUSD' | 'XRP') => {
    const displayAmount = currency === 'RLUSD' ? `$${amount}` : `${amount} XRP`;
    setSelectedPreset({ amount, currency, displayAmount });
  };

  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/get-donations-xrpl');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch donations: ${response.statusText}`);
        }
        const data: Donation[] = await response.json();
        setDonations(data);
      } catch (err: any) {
        console.error("Failed to fetch donations:", err);
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow bg-gradient-to-b from-green-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Make a Donation</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Your contribution directly supports underprivileged schools and creates opportunities for students.
            </p>
          </div>

          {/* How to Donate Instructions 
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg shadow-sm border border-green-100 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">How to Donate</h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>Open your XRP Ledger wallet app (Xumm, Crossmark, etc.)</li>
              <li>Scan the QR code below</li>
              <li>Confirm the transaction details in your wallet</li>
              <li>Submit the payment</li>
            </ol>
            <p className="mt-4 text-sm text-gray-600 text-center">All donations are transparent and trackable on the XRP Ledger.</p>
          </div> */}
          
          {/* Preset Donation Buttons */}
          <div className="my-8 w-full max-w-lg mx-auto">
            <div className="mb-6">
              <p className="text-center text-gray-700 font-medium mb-3">Select RLUSD Amount:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {RLUSD_PRESETS.map((amount) => (
                  <button
                    key={`rlusd-${amount}`}
                    className={`px-5 py-2 rounded-lg ${selectedPreset && selectedPreset.currency === 'RLUSD' && selectedPreset.amount === amount
                      ? 'bg-green-600 text-white font-semibold shadow-md'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-green-300 transition-colors'
                      }`}
                    onClick={() => handlePresetClick(amount, 'RLUSD')}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-center text-gray-700 font-medium mb-3">Donate XRP:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {XRP_PRESETS.map((amount) => (
                  <button
                    key={`xrp-${amount}`}
                    onClick={() => handlePresetClick(amount, 'XRP')}
                    className={`px-5 py-2 border rounded-md text-sm font-medium transition-colors
                      ${selectedPreset?.currency === 'XRP' && selectedPreset?.amount === amount
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                      }`}
                  >
                    {amount} XRP
                  </button>
                ))}
              </div>
            </div>
            {selectedPreset && (
              <div className="text-center mt-4">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  onClick={() => setSelectedPreset(null)}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          <div className="bg-gradient-to-b from-white to-green-50 p-8 rounded-xl shadow-md mb-10 border border-green-100 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800">Scan to Donate</h2>
            {envWarning && (
              <div className="mb-5 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                <p>{envWarning}</p>
              </div>
            )}
            <div className="flex justify-center">
              {currentQrCodeUri && DONATION_ADDRESS ? (
                <div className="mb-5 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <QRCodeCanvas 
                    value={currentQrCodeUri} 
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="Q"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="mb-5 p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center">
                  <p className="text-lg font-medium text-gray-500">QR Code cannot be displayed.</p>
                  <p className="text-sm text-gray-400">{DONATION_ADDRESS ? 'Error generating QR.' : 'Configuration missing.'}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Scan with your XRPL-compatible wallet to donate <span className="font-semibold">
                  {selectedPreset ? selectedPreset.displayAmount : DISPLAY_CURRENCY_CODE}
                </span>
              </p>
              <p className="text-xs text-gray-500 break-all">
                Address: <span className="font-mono">{DONATION_ADDRESS || 'N/A'}</span>
              </p>
              {(selectedPreset?.currency === 'RLUSD' || (!selectedPreset && RLUSD_ISSUER_ADDRESS && HEX_CURRENCY_CODE)) && (
                <p className="text-xs text-gray-500 break-all">
                  Issuer: <span className="font-mono">{RLUSD_ISSUER_ADDRESS}</span>
                </p>
              )}
              <p className="mt-3 text-red-600 text-xs font-semibold">
                IMPORTANT: Ensure your wallet supports sending
                {selectedPreset ? ` ${selectedPreset.displayAmount}` : ` ${DISPLAY_CURRENCY_CODE}`}
                {(selectedPreset?.currency === 'RLUSD' || (!selectedPreset && RLUSD_ISSUER_ADDRESS && HEX_CURRENCY_CODE)) && ` to this address and issuer`}
                {selectedPreset?.currency === 'XRP' && ` to this address`}.
              </p>
            </div>
          </div>

          {/* Donation History Section */}
          <div className="mt-16 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Recent Donations</h2>
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-3">Loading donation history...</p>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {error && (
              <div className="my-4 p-4 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm text-center max-w-lg mx-auto">
                <p>Error loading donations: {error}</p>
              </div>
            )}
            {!isLoading && !error && donations.length === 0 && (
              <div className="bg-gray-50 p-6 rounded-lg text-center max-w-lg mx-auto border border-gray-200">
                <p className="text-gray-700">No recent donations found.</p>
                <p className="text-sm text-gray-500 mt-2">Be the first to contribute!</p>
              </div>
            )}
            {!isLoading && !error && donations.length > 0 && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {donations.map((donation) => (
                  <div key={donation.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Amount:</span> {donation.amount} {donation.currency}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">From:</span> <span className="font-mono break-all">{donation.sender}</span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(donation.timestamp).toLocaleString()}
                        </p>
                        <a 
                          href={donation.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-1 inline-block"
                        >
                          View Transaction
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
