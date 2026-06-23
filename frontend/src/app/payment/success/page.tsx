'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const data = searchParams.get('data');
  const isTest = searchParams.get('test') === 'true';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    // ── TEST MODE: only in development, skip backend verification ──
    const isDev = process.env.NODE_ENV === 'development';
    if (isTest && isDev) {
      setStatus('success');
      setMessage('Payment verified successfully! (Test Mode)');
      setTransaction({
        orderId: 'ORD-TKN-TEST123',
        amount: 250,
      });
      return;
    }

    if (!data) {
      setStatus('error');
      setMessage('Invalid payment data received.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await apiFetch('/purchases/verify-esewa', {
          method: 'POST',
          body: JSON.stringify({ data }),
        });
        setStatus('success');
        setMessage(res.message || 'Payment verified successfully!');
        setTransaction(res.transaction);
      } catch (err: any) {
        console.error('Verification failed:', err);
        setStatus('error');
        setMessage(err.message || 'Payment verification failed. Please contact support.');
      }
    };

    verifyPayment();
  }, [data, isTest]);

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.15)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="max-w-md w-full bg-zinc-950 border border-green-500/20 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(34,197,94,0.05)]">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <h2 className="text-xl font-bold font-serif">Verifying Payment</h2>
            <p className="text-zinc-400 text-sm">Please wait while we confirm with eSewa...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold font-serif text-white">Payment Successful!</h2>
              <p className="text-zinc-400 text-sm mt-2">{message}</p>
            </div>

            {transaction && (
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="font-mono text-white">{transaction.orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Amount Paid</span>
                  <span className="font-bold text-[#f5d06f]">₹{transaction.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">APPROVED</span>
                </div>
              </div>
            )}

            <Link href="/dashboard" className="w-full mt-4">
              <button className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition text-sm flex items-center justify-center gap-2">
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold font-serif text-white">Verification Failed</h2>
              <p className="text-red-400 text-sm mt-2">{message}</p>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <Link href="/dashboard" className="flex-1">
                <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition text-sm">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f0c] text-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
