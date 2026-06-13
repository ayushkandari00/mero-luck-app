'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import GoldCoin from '../components/GoldCoin';
import LiveActivityFeed from '../components/LiveActivityFeed';
import { 
  Sparkles, ShieldCheck, HelpCircle, Gift, Trophy, ArrowRight,
  TrendingUp, Users, Calendar, Clock, CheckCircle2, ChevronDown, Check, Coins
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Home() {
  const { setLoginModal, setBuyModal, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<any>({
    prizePool: 10000000,
    entriesCount: 1342,
    participantsCount: 589,
    tokensSold: 890,
    coinsSold: 452,
    drawDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
  });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Accordion active index for FAQs
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Provably Fair check input
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Fetch live statistics
    apiFetch('/draws/live-stats')
      .then((res) => {
        if (res.hasActiveDraw) {
          setStats(res);
        }
      })
      .catch(console.error);
  }, []);

  // Update countdown
  useEffect(() => {
    const target = new Date(stats.drawDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.drawDate]);

  const handleBuyClick = (type: 'token' | 'coin') => {
    if (!isAuthenticated) {
      setLoginModal(true);
    } else {
      setBuyModal(type);
    }
  };

  const handleVerifyCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyNumber || verifyNumber.length !== 6) {
      setVerifyError('Please enter a valid 6-digit lucky number.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerificationResult(null);

    try {
      const res = await apiFetch(`/draws/verify-fairness/${verifyNumber}`);
      setVerificationResult(res);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Number not found in registry.');
    } finally {
      setVerifying(false);
    }
  };

  const faqs = [
    {
      q: "What is the difference between a Digital Lucky Token and a Physical Coin?",
      a: "A Digital Token (₹250) registers a unique 6-digit number to your account to participate in the draw. A Physical Coin (₹2,500) gives you the exact same draw entry, but you also receive a premium gold-plated custom collector coin shipped to your address. The physical coin has your unique Lucky Number engraved directly on its face and a QR verification code."
    },
    {
      q: "How are the draw winners selected?",
      a: "Winners are chosen through our Provably Fair System. The winning draw value is cryptographically computed by combining a pre-published Server Seed with a future public Blockchain Block Hash. The final hash is mapped to the entries register. This ensures no third-party (including our admins) can alter or manipulate the result."
    },
    {
      q: "How do I claim my prize if I win?",
      a: "When a draw completes, winners receive an automatic account notification and SMS alert. Physical cash prizes (e.g. Grand Prize of Rs. 60 Lakhs) are disbursed after direct KYC verification. Physical collector coins are delivered automatically using your registered shipping address."
    },
    {
      q: "How do I upload the payment receipt?",
      a: "When you request a coin or token, the system generates an order invoice along with bank/UPI details. Transfer the funds using any mobile banking app, capture a screenshot of the receipt, and upload it in the order window. Once approved by our team, your Lucky Number is generated."
    }
  ];

  return (
    <div className="w-full space-y-20 pb-20">
      
      {/* SECTION 1: HERO */}
      <section className="relative w-full min-h-[90vh] flex items-center bg-dark-emerald pt-16 pb-24 overflow-hidden border-b border-amber-500/20">
        
        {/* Background particle glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,138,71,0.25)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#f5d06f]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-[#0b6b3a]/30 border border-[#0b6b3a]/40 px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-[#f5d06f] animate-spin" />
              <span className="text-[10px] sm:text-xs text-white font-bold tracking-widest uppercase">
                Premium Lottery & Gold Collectibles
              </span>
            </div>

            <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight drop-shadow-md">
              Bhagya Chamkaune <br />
              <span className="text-gold-gradient">Sahi Mauka!</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Join Nepal's premier cryptographic prize registry. Purchase an official gold-themed physical collector coin engraved with a custom lucky number or buy a digital token to win up to <span className="text-[#f5d06f] font-bold">Rs. 1 Crore (1 Crore Samma Jitne Mauka!)</span>.
            </p>

            {/* Countdown widget */}
            <div className="bg-zinc-950/60 border border-amber-500/20 p-4 rounded-2xl max-w-md mx-auto lg:mx-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-2 text-center lg:text-left">
                Countdown to Mega Draw
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#0b0f0c] p-2 rounded-lg border border-zinc-850">
                  <div className="font-mono text-lg sm:text-xl font-black text-[#f5d06f]">{timeLeft.days}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Days</div>
                </div>
                <div className="bg-[#0b0f0c] p-2 rounded-lg border border-zinc-850">
                  <div className="font-mono text-lg sm:text-xl font-black text-[#f5d06f]">{timeLeft.hours}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Hrs</div>
                </div>
                <div className="bg-[#0b0f0c] p-2 rounded-lg border border-zinc-850">
                  <div className="font-mono text-lg sm:text-xl font-black text-[#f5d06f]">{timeLeft.minutes}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Min</div>
                </div>
                <div className="bg-[#0b0f0c] p-2 rounded-lg border border-zinc-850">
                  <div className="font-mono text-lg sm:text-xl font-black text-[#f5d06f]">{timeLeft.seconds}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Sec</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => handleBuyClick('coin')}
                className="w-full sm:w-auto px-8 py-3 bg-gold-gradient text-amber-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Buy Physical Coin (₹2500)</span>
              </button>
              <button
                onClick={() => handleBuyClick('token')}
                className="w-full sm:w-auto px-8 py-3 bg-[#0b6b3a] hover:bg-[#0e8a47] border border-amber-500/20 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Buy Digital Token (₹250)</span>
              </button>
            </div>
          </div>

          {/* Hero Right: Rotating Coin & Activity Feed */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-8">
            <GoldCoin number="568794" size="lg" autoRotate={false} />
            
            {/* Live activity ticker */}
            <div className="w-full max-w-sm">
              <LiveActivityFeed />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="font-serif font-black text-3xl text-[#0b6b3a]">
            How Mero Luck Works
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Four simple steps to secure your collectible physical gold coin and enter the transparent mega lottery draw.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Purchase Coin/Token',
              desc: 'Select either a premium physical gold coin or digital entry token and request order.',
            },
            {
              step: '02',
              title: 'Receive Lucky Number',
              desc: 'Once payment verification completes, a cryptographically unique 6-digit Lucky Number is assigned.',
            },
            {
              step: '03',
              title: 'Wait For Draw Date',
              desc: 'Track the countdown. The draw is generated transparently every 6 months using public blockchain hashes.',
            },
            {
              step: '04',
              title: 'Claim Reward Pool',
              desc: 'Verify draw outcomes cryptographically. Winners can disburse cash pool and bonus rewards instantly.',
            },
          ].map((item, idx) => (
            <div key={idx} className="relative bg-white border border-zinc-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="text-4xl font-serif font-black text-[#0b6b3a]/15 group-hover:text-[#0b6b3a]/25 transition-colors absolute top-4 right-4">
                {item.step}
              </div>
              <h3 className="font-serif font-bold text-sm text-zinc-900 mt-4 mb-2">
                {item.title}
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: LIVE DRAW STATISTICS */}
      <section className="w-full bg-[#0b0f0c] border-y border-amber-500/20 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(11,107,58,0.2)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 relative text-center">
          
          <div className="space-y-1">
            <TrendingUp className="w-6 h-6 text-[#f5d06f] mx-auto mb-2 animate-bounce" />
            <div className="text-xl sm:text-2xl font-black font-serif text-gold-gradient">
              Rs. {(stats.prizePool / 100000).toFixed(0)} Lakhs
            </div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Prize Pool</p>
          </div>

          <div className="space-y-1">
            <Users className="w-6 h-6 text-[#f5d06f] mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-black font-mono">
              {stats.participantsCount}+
            </div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Participants</p>
          </div>

          <div className="space-y-1">
            <Coins className="w-6 h-6 text-[#f5d06f] mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-black font-mono">
              {stats.coinsSold}+
            </div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Physical Coins Sold</p>
          </div>

          <div className="space-y-1">
            <Calendar className="w-6 h-6 text-[#f5d06f] mx-auto mb-2" />
            <div suppressHydrationWarning className="text-xs sm:text-sm font-bold font-serif text-white truncate max-w-full">
              {new Date(stats.drawDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">Official Draw Date</p>
          </div>

        </div>
      </section>

      {/* SECTION 4: PRIZES & WINNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="font-serif font-black text-3xl text-[#0b6b3a]">
            Luxury Rewards & Prizes
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Mero Luck draws distribute millions in prizes. Here is the active breakdown of our upcoming pool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Grand Prize */}
          <div className="bg-[#0b0f0c] border border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-[0_10px_30px_rgba(212,175,55,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-gold-gradient text-amber-950 font-bold text-[8px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Jackpot
            </div>
            <Trophy className="w-10 h-10 text-[#f5d06f] mx-auto animate-pulse" />
            <div>
              <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Grand Prize</h3>
              <p className="text-xl sm:text-2xl font-serif font-black text-gold-gradient mt-1">
                {stats.grandPrize || 'Rs. 60 Lakhs'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Awarded to the top single verified lucky number. Includes premium 24k Gold Engraved collector coin.
            </p>
          </div>

          {/* 2nd Prize */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 shadow-sm group">
            <Trophy className="w-10 h-10 text-zinc-400 mx-auto" />
            <div>
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">2nd Prize</h3>
              <p className="text-xl sm:text-2xl font-serif font-black text-[#0b6b3a] mt-1">
                {stats.secondPrize || 'Rs. 25 Lakhs'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Awarded to the second drawn lucky number, matching cryptographic hashes. Includes custom silver coin.
            </p>
          </div>

          {/* 3rd Prize */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 shadow-sm group">
            <Trophy className="w-10 h-10 text-amber-700/80 mx-auto" />
            <div>
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">3rd Prize</h3>
              <p className="text-xl sm:text-2xl font-serif font-black text-[#0b6b3a] mt-1">
                {stats.thirdPrize || 'Rs. 15 Lakhs'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Awarded to the third drawn lucky number. Verified and public trace enabled.
            </p>
          </div>

        </div>

        {/* Previous Winners Showcase */}
        <div className="bg-[#f8faf8] border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-zinc-200 pb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">Previous Draw Winners Showcase</h3>
              <p className="text-[11px] text-zinc-500">Verified collector payout history</p>
            </div>
            <span className="bg-[#0b6b3a]/10 text-[#0b6b3a] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
              Total Disbursed: Rs. 50 Lakhs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Winner Card 1 - Reference Coin Number */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
              <div className="scale-75 origin-left">
                <GoldCoin number="568794" size="sm" autoRotate={false} interactive={false} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950">Ayush Sharma</span>
                  <span className="bg-[#0b6b3a]/10 text-[#0b6b3a] text-[9px] font-bold px-2 py-0.5 rounded">
                    Rs. 30 Lakhs
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Draw: Inaugural Draw (Completed)</p>
                <div className="text-[10px] text-zinc-400 font-mono">Lucky Number: #568794</div>
                <div className="flex items-center space-x-1 text-green-600 text-[9px] font-bold mt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>PAYOUT DISBURSED</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
              <div className="scale-75 origin-left">
                <GoldCoin number="124891" size="sm" autoRotate={false} interactive={false} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950">Bibek Karki</span>
                  <span className="bg-[#0b6b3a]/10 text-[#0b6b3a] text-[9px] font-bold px-2 py-0.5 rounded">
                    Rs. 12.5 Lakhs
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Draw: Inaugural Draw (Completed)</p>
                <div className="text-[10px] text-zinc-400 font-mono">Lucky Number: #124891</div>
                <div className="flex items-center space-x-1 text-green-600 text-[9px] font-bold mt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>PAYOUT DISBURSED</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: PROVABLY FAIR SYSTEM */}
      <section id="provably-fair" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-[#0b0f0c] to-[#0b6b3a]/40 border border-amber-500/20 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#f5d06f]/5 rounded-full blur-[80px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
            
            <div className="space-y-5 text-white">
              <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#f5d06f]" />
                <span className="text-[10px] text-[#f5d06f] font-bold uppercase tracking-wider">100% Cryptographic Transparency</span>
              </div>
              
              <h2 className="font-serif font-black text-3xl leading-tight">
                Provably Fair Draw System
              </h2>
              
              <p className="text-xs text-zinc-300 leading-relaxed">
                Mero Luck uses an advanced public seed verification system. We publish the SHA-256 hash of our Server Seed prior to draw launches. When the draw date is reached, we append the block hash of a future public blockchain block. 
              </p>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Pre-published server seed hash ensures admins cannot alter seeds.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Live block hash source provides absolute random entropy outside our control.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Anyone can recalculate the winning numbers using public algorithms.</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Verification widget */}
            <div className="bg-zinc-950 border border-amber-500/15 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-white font-serif font-bold text-sm">Lucky Number Registry Lookup</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Verify that any 6-digit number is registered and inspect its cryptographic trace.</p>
              </div>

              <form onSubmit={handleVerifyCheck} className="flex space-x-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-Digit Number (e.g. 568794)"
                  value={verifyNumber}
                  onChange={(e) => setVerifyNumber(e.target.value)}
                  className="flex-1 bg-[#0b0f0c] border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs font-mono tracking-widest focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-2 bg-[#0b6b3a] hover:bg-[#0e8a47] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {verifying ? 'Checking...' : 'Verify'}
                </button>
              </form>

              {verifyError && (
                <p className="text-red-400 text-[10px]">{verifyError}</p>
              )}

              {verificationResult && (
                <div className="bg-[#0b0f0c] border border-zinc-850 p-3 rounded-lg space-y-2.5 text-[10px] text-zinc-400 font-mono">
                  <div className="text-green-400 font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>CRYPTOGRAPHIC REGISTRY CONFIRMED</span>
                  </div>
                  <div>
                    <p className="text-zinc-500">Lucky Number:</p>
                    <p className="text-white font-bold">#{verificationResult.luckyNumber.number}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Server Seed Hash:</p>
                    <p className="text-white truncate">{verificationResult.verificationDetails.serverSeedHash}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Draw Salt (SHA-256 Base):</p>
                    <p className="text-[#f5d06f] truncate">{verificationResult.verificationDetails.drawSalt}</p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="font-serif font-black text-3xl text-[#0b6b3a]">
            Collector Testimonials
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Hear from our physical coin owners and lucky ticket holders across the country.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Niranjan R.',
              role: 'Gold Coin Collector (Lalitpur)',
              quote: 'The quality of the physical gold coin is stunning! Heavy, polished, and the serial engraving is extremely clean. Winning Rs 1 Lakh on my first draw was the ultimate bonus.',
              avatar: 'N',
            },
            {
              name: 'Samir M.',
              role: 'Token Participant (Pokhara)',
              quote: 'Mero Luck is the first lottery platform in Nepal that feels modern and transparent. The provably fair verification is a game-changer. I checked my ticket code hash immediately.',
              avatar: 'S',
            },
            {
              name: 'Priyanka D.',
              role: 'Silver Coin Winner (Kathmandu)',
              quote: 'I purchased three physical coins for my family. The shipment arrived in luxury premium packaging. We love displaying the coins, and the draw countdown makes it so exciting!',
              avatar: 'P',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-zinc-150 p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
              <p className="text-zinc-600 text-xs italic leading-relaxed">
                "{item.quote}"
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-[#0b6b3a]/10 text-[#0b6b3a] font-bold text-xs flex items-center justify-center">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{item.name}</h4>
                  <p className="text-[10px] text-zinc-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-serif font-black text-3xl text-[#0b6b3a]">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm">
            Got questions about Mero Luck? We have answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-zinc-150 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-bold font-serif text-sm text-[#0b6b3a] hover:bg-zinc-50/50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${activeFaq === idx ? 'transform rotate-180' : ''}`} />
              </button>

              {activeFaq === idx && (
                <div className="px-6 pb-5 text-xs text-zinc-650 leading-relaxed border-t border-zinc-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
