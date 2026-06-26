'use client';

import { useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  XCircle, RefreshCw, ChevronLeft, AlertTriangle,
  CheckCircle2, Loader2, Upload, X, FileImage,
  MessageSquare, Send, Hash, Clock
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import Link from 'next/link';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('q') || searchParams.get('orderId') || '';
  const errFromUrl = searchParams.get('message') || searchParams.get('error') || '';

  // ── Check status state ──────────────────────────────────────────────────────
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: string | null;
    message: string;
    luckyNumber?: string;
  } | null>(null);

  // ── Report Issue state ──────────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false);
  const [esewaTransactionId, setEsewaTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState<{ success: boolean; referenceCode?: string; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCheckStatus = async () => {
    if (!orderId) {
      setCheckResult({ status: null, message: 'No Order ID found. Please enter your eSewa Transaction ID in the report form below.' });
      return;
    }
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await apiFetch('/purchases/check-status', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      if (res.status === 'APPROVED') {
        setCheckResult({ status: 'APPROVED', message: res.message, luckyNumber: res.luckyNumber });
      } else if (res.status === 'REJECTED') {
        setCheckResult({ status: 'REJECTED', message: res.message });
      } else {
        setCheckResult({ status: 'PENDING', message: res.message });
      }
    } catch (err: any) {
      setCheckResult({ status: null, message: err.message || 'Failed to check status. Please try again.' });
    } finally {
      setCheckLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esewaTransactionId.trim() || esewaTransactionId.trim().length < 3) {
      setReportResult({ success: false, message: 'Please enter a valid eSewa Transaction ID.' });
      return;
    }

    setReportLoading(true);
    setReportResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mero_token') : null;
      if (!token) {
        setReportResult({ success: false, message: 'You must be logged in to report a payment issue.' });
        setReportLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('esewaTransactionId', esewaTransactionId.trim());
      if (orderId) formData.append('orderId', orderId);
      if (message.trim()) formData.append('message', message.trim());
      if (screenshotFile) formData.append('screenshot', screenshotFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/purchases/report-issue`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setReportResult({
        success: true,
        referenceCode: data.referenceCode,
        message: data.message,
      });
    } catch (err: any) {
      setReportResult({ success: false, message: err.message || 'Failed to submit report. Please try again.' });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 space-y-4">

        {/* ── If payment was actually confirmed ── */}
        {checkResult?.status === 'APPROVED' ? (
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-green-500/30 rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(34,197,94,0.08)]">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-white">Payment Confirmed!</h2>
              <p className="text-green-400 text-sm mt-2">{checkResult.message}</p>

              {checkResult.luckyNumber && (
                <div className="mt-6 bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border border-[#f5d06f]/30 rounded-xl p-5">
                  <p className="text-[10px] text-[#f5d06f]/60 font-bold uppercase tracking-widest mb-2">Your Lucky Number</p>
                  <div className="text-5xl font-black font-mono text-[#f5d06f] tracking-[0.15em]">
                    {checkResult.luckyNumber}
                  </div>
                </div>
              )}
            </div>
            <Link href="/dashboard">
              <button className="w-full py-3 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity">
                Go to Dashboard →
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Main failure card */}
            <div className="bg-zinc-950 border border-red-500/25 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
              
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border-2 border-red-500/25 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold font-serif text-white">Payment Failed</h1>
                <p className="text-zinc-400 text-sm mt-2">
                  {errFromUrl || "We couldn't process or verify your payment."}
                </p>
              </div>

              {/* Order ID badge */}
              {orderId && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center space-x-2.5 mb-5">
                  <Hash className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Order Reference</p>
                    <p className="font-mono text-white text-xs font-bold">{orderId}</p>
                  </div>
                </div>
              )}

              {/* What to do section */}
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">What would you like to do?</p>

                {/* Check Status Button */}
                <button
                  onClick={handleCheckStatus}
                  disabled={checkLoading}
                  className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {checkLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Checking with eSewa...</span></>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /><span>Check Payment Status</span></>
                  )}
                </button>

                {/* Check result inline feedback */}
                {checkResult && checkResult.status !== 'APPROVED' && (
                  <div className={`rounded-xl p-3.5 border text-sm flex items-start space-x-2.5 ${
                    (checkResult.status as string) === 'REJECTED'
                      ? 'bg-red-950/30 border-red-500/30 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}>
                    {(checkResult.status as string) === 'PENDING' && <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                    {(checkResult.status as string) === 'REJECTED' && <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {!checkResult.status && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-[11px] leading-relaxed">{checkResult.message}</p>
                  </div>
                )}

                {/* Report Issue toggle */}
                <button
                  onClick={() => setReportOpen(!reportOpen)}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{reportOpen ? 'Close Report Form' : 'Report Payment Issue'}</span>
                </button>
              </div>
            </div>

            {/* ── REPORT ISSUE FORM (expandable) ── */}
            {reportOpen && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                
                {/* Form header */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Report Payment Issue</h3>
                    <p className="text-[10px] text-zinc-400">Our team will review within 24 hours</p>
                  </div>
                </div>

                {/* Success state */}
                {reportResult?.success ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base">Issue Reported Successfully</h4>
                      <p className="text-zinc-400 text-sm mt-1">{reportResult.message}</p>
                    </div>
                    {reportResult.referenceCode && (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 inline-block">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Your Reference Code</p>
                        <p className="font-mono text-[#f5d06f] font-black text-lg tracking-widest mt-1">{reportResult.referenceCode}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Save this for follow-up</p>
                      </div>
                    )}
                    <Link href="/dashboard">
                      <button className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-colors">
                        Back to Dashboard
                      </button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                    {reportResult && !reportResult.success && (
                      <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] px-3 py-2.5 rounded-lg flex items-start space-x-2">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{reportResult.message}</span>
                      </div>
                    )}

                    {/* eSewa Transaction ID */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-zinc-300 font-bold">
                        eSewa Transaction ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0007Q4K2G9"
                        value={esewaTransactionId}
                        onChange={e => setEsewaTransactionId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600"
                      />
                      <p className="text-[10px] text-zinc-500">Find this in your eSewa app under transaction history</p>
                    </div>

                    {/* Order ID (pre-filled if available) */}
                    {orderId && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-300 font-bold">Order Reference</label>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 flex items-center space-x-2">
                          <Hash className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="text-zinc-400 text-xs font-mono">{orderId}</span>
                          <span className="text-[9px] text-zinc-600 ml-auto">auto-filled</span>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-zinc-300 font-bold">Message <span className="text-zinc-500">(optional)</span></label>
                      <textarea
                        rows={3}
                        placeholder="Briefly describe what happened..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        maxLength={500}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-xs resize-none focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600"
                      />
                      <p className="text-[10px] text-zinc-600 text-right">{message.length}/500</p>
                    </div>

                    {/* Screenshot upload — ONLY available here, NOT in normal payment flow */}
                    <div className="space-y-2">
                      <label className="block text-[11px] text-zinc-300 font-bold">
                        Payment Screenshot <span className="text-zinc-500">(optional — max 5MB)</span>
                      </label>

                      {screenshotPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                          <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-cover" />
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="absolute top-2 right-2 w-7 h-7 bg-zinc-900/90 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-zinc-900/80 px-3 py-1.5">
                            <p className="text-[10px] text-zinc-300 font-medium truncate">{screenshotFile?.name}</p>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="screenshot-upload"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-amber-500/40 rounded-xl p-6 cursor-pointer transition-colors group"
                        >
                          <FileImage className="w-8 h-8 text-zinc-600 group-hover:text-amber-500/70 mb-2 transition-colors" />
                          <p className="text-xs font-bold text-zinc-500 group-hover:text-zinc-400">Click to upload screenshot</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">JPEG, PNG, WebP or PDF</p>
                          <input
                            id="screenshot-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            ref={fileRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Important note */}
                    <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-300/80 leading-relaxed">
                        Our team reviews all disputes within 24 hours. If your payment is verified, your Lucky Number will be assigned automatically.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={reportLoading || !esewaTransactionId.trim()}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
                    >
                      {reportLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
                      ) : (
                        <><Send className="w-4 h-4" /><span>Submit Issue Report</span></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Return home */}
            <Link href="/">
              <button className="w-full py-2.5 bg-transparent text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Homepage</span>
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f0c] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}
