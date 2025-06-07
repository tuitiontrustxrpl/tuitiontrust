"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeCanvas), { ssr: false });

interface QrCodeDisplayProps {
  value: string;
}

export default function QrCodeDisplay({ value }: QrCodeDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="relative h-72 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-gradient-to-br from-green-200 via-amber-100 to-green-100 p-6 transform transition-all duration-300 hover:scale-[1.02]">
      {/* Decorative Elements */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-300 rounded-full opacity-20"></div>
      <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-amber-300 rounded-full opacity-20"></div>
      
      <div className="relative z-10 text-center">
        <div className="bg-white p-5 rounded-2xl inline-block shadow-lg border-2 border-green-100 transform transition-transform hover:rotate-1">
          {!isClient ? (
            // Server-side placeholder with same dimensions
            <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center">
              <div className="animate-pulse text-sm text-gray-400">QR Code</div>
            </div>
          ) : (
            <QRCodeCanvas
              value={value}
              size={200}
              level="H"
              includeMargin={false}
              fgColor="#047857" // Green-700 color
            />
          )}
        </div>
        <div className="mt-5">
          <p className="text-xl font-bold text-green-800 mb-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Scan to Donate!
          </p>
          <p className="text-sm text-gray-600 mb-3">We accept XRP and RLUSD payments</p>
          <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm inline-block">
            <p className="text-xs text-gray-700 font-mono break-all">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
