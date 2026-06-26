'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Trophy, Hash, Receipt, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import Link from 'next/link';

// ── Confetti particle system ──────────────────────────────────────────────────
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; angle: number; spin: number }[] = [];
    const colors = ['#f5d06f', '#d4af37', '#4ade80', '#34d399', '#fbbf24', '#ffffff', '#a78bfa'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.05; // gravity

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
        ctx.restore();

        if (p.y > canvas.height + 20) {
          particles.splice(i, 1);
        }
      });

      if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// ── Main payment success content ──────────────────────────────────────────────
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const data = searchParams.get('data');
  const isTest = searchParams.get('test') === 'true';

  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading');
  const [transaction, setTransaction] = useState<any>(null);
  const [luckyNumber, setLuckyNumber] = useState<string | null>(null);
  const [esewaCode, setEsewaCode] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    // ── TEST MODE ──
    if (isTest && process.env.NODE_ENV === 'development') {
      setStatus('success');
      setLuckyNumber('847293');
      setTransaction({ orderId: 'ORD-TKN-TEST123', amount: 250, type: 'TOKEN_PURCHASE' });
      setEsewaCode('0007Q4K2');
      setShowConfetti(true);
      return;
    }

    if (!data) {
      setStatus('pending');
      setErrMsg('No payment data received. If you completed payment, use the button below to check your status.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiFetch('/purchases/verify-esewa', {
          method: 'POST',
          body: JSON.stringify({ data }),
        });
        setTransaction(res.transaction);
        setLuckyNumber(res.luckyNumber || null);
        setEsewaCode(res.esewaTransactionCode || null);
        setStatus('success');
        setShowConfetti(true);
      } catch (err: any) {
        setErrMsg(err.message || 'Verification failed.');
        setStatus('pending');
      }
    };

    verify();
  }, [data, isTest]);

  const orderId = transaction?.orderId || searchParams.get('q') || '';

  const ticketTypeLabel = (type?: string) => {
    if (type === 'COIN_PURCHASE') return 'Physical Lucky Coin';
    if (type === 'NUMBERED_COIN_PURCHASE') return 'Premium Numbered Coin';
    return 'Digital Lucky Token';
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {showConfetti && <ConfettiCanvas />}

      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f5d06f]/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 space-y-4">

        {/* ── LOADING ── */}
        {status === 'loading' && (
          <div className="bg-zinc-950 border border-green-500/20 rounded-2xl p-12 text-center space-y-5 shadow-[0_0_60px_rgba(34,197,94,0.08)]">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-green-500/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-white">Verifying with eSewa</h2>
              <p className="text-zinc-400 text-sm mt-1">Confirming your transaction securely...</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-green-500/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-zinc-950 border border-green-500/30 rounded-2xl p-8 text-center shadow-[0_0_60px_rgba(34,197,94,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.07)_0%,transparent_70%)]" />

              <div className="relative">
                {/* Pulsing success icon */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping opacity-40" />
                  <div className="absolute inset-2 rounded-full bg-green-500/15 animate-ping opacity-60" style={{ animationDelay: '0.1s' }} />
                  <div className="relative w-full h-full rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </div>
                </div>

                <h1 className="text-3xl font-black font-serif text-white mb-2">Payment Successful!</h1>
                <p className="text-green-400 text-sm font-medium">Your eSewa transaction was verified and your ticket is ready</p>
              </div>
            </div>

            {/* Lucky Number Card — the star of the show */}
            {luckyNumber && (
              <div className="bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border-2 border-[#f5d06f]/40 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(245,208,111,0.15)]">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Trophy className="w-4 h-4 text-[#f5d06f]" />
                  <p className="text-[11px] text-[#f5d06f]/70 font-bold uppercase tracking-[3px]">Your Lucky Number</p>
                  <Trophy className="w-4 h-4 text-[#f5d06f]" />
                </div>
                <div className="text-6xl font-black font-mono text-[#f5d06f] tracking-[0.15em] drop-shadow-[0_0_20px_rgba(245,208,111,0.5)]">
                  {luckyNumber}
                </div>
                <p className="text-zinc-400 text-[11px] mt-3">This number is your entry into the Mero Luck Mega Draw</p>
                <button
                  onClick={() => copy(luckyNumber, 'lucky')}
                  className="mt-3 inline-flex items-center space-x-1.5 text-[10px] text-[#f5d06f]/60 hover:text-[#f5d06f] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied === 'lucky' ? 'Copied!' : 'Copy number'}</span>
                </button>
              </div>
            )}

            {/* Transaction Details */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Transaction Details</p>

              {[
                { label: 'Order ID', value: transaction?.orderId, key: 'order', icon: <Hash className="w-3 h-3" /> },
                { label: 'eSewa Code', value: esewaCode, key: 'esewa', icon: <Receipt className="w-3 h-3" /> },
                { label: 'Amount Paid', value: transaction?.amount ? `₹${transaction.amount.toLocaleString()}` : null, key: 'amount', noClip: true },
                { label: 'Ticket Type', value: ticketTypeLabel(transaction?.type), key: 'type', noClip: true },
                { label: 'Status', value: null, key: 'status', noClip: true },
              ].filter(r => r.value !== null && r.value !== undefined || r.key === 'status').map((row) => (
                <div key={row.key} className="flex items-center justify-between border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-1.5">
                    {row.icon && <span className="text-zinc-600">{row.icon}</span>}
                    <span className="text-[11px] text-zinc-400">{row.label}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {row.key === 'status' ? (
                      <span className="px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-full">
                        ✓ VERIFIED
                      </span>
                    ) : (
                      <>
                        <span className="font-mono text-white text-xs font-bold">{row.value}</span>
                        {!row.noClip && row.value && (
                          <button onClick={() => copy(row.value!, row.key)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Draw Entry Badge */}
            <div className="bg-[#0b6b3a]/15 border border-[#0b6b3a]/30 rounded-xl p-4 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-green-300">Draw Entry Confirmed</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Your lucky number is now entered into the next Mero Luck Mega Draw</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex space-x-3">
              <Link href="/dashboard" className="flex-1">
                <button className="w-full py-3 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center space-x-2">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/" className="flex-1">
                <button className="w-full py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors">
                  Return Home
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── PENDING / VERIFICATION FAILED ── */}
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(251,191,36,0.06)]">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-white">Payment Pending</h2>
              <p className="text-amber-400/80 text-sm mt-2">We couldn't automatically verify your payment.</p>
              {errMsg && (
                <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-300 text-left">
                  {errMsg}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Link href={`/payment/failure${orderId ? `?q=${encodeURIComponent(orderId)}` : ''}`} className="flex-1">
                <button className="w-full py-3 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-500/20 transition-colors">
                  Check Status & Report Issue
                </button>
              </Link>
              <Link href="/" className="flex-1">
                <button className="w-full py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors">
                  Return Home
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f0c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
