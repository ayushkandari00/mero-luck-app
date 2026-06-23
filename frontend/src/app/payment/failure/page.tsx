'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('message') || searchParams.get('error') || 'The transaction was cancelled or failed.';

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.15)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="max-w-md w-full bg-zinc-950 border border-red-500/20 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold font-serif text-white">Payment Failed</h2>
            <p className="text-zinc-400 text-sm mt-2">We could not process your payment.</p>
          </div>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            <Link href="/coins" className="w-full">
              <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Retry Payment
              </button>
            </Link>
            <Link href="/" className="w-full">
              <button className="w-full py-3 bg-transparent text-zinc-400 hover:text-white rounded-xl font-bold transition text-sm flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Return Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f0c]" />}>
      <PaymentFailureContent />
    </Suspense>
  );
}
