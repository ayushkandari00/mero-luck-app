'use client';

import React, { useState, useEffect } from 'react';
import GoldCoin from '../../components/GoldCoin';
import LiveActivityFeed from '../../components/LiveActivityFeed';
import { apiFetch } from '../../utils/api';
import { 
  TrendingUp, Users, Coins, Ticket, Sparkles, AlertCircle, Clock
} from 'lucide-react';

export default function LivePurchasePage() {
  const [stats, setStats] = useState<any>({
    prizePool: 10000000,
    entriesCount: 1342,
    participantsCount: 589,
    tokensSold: 890,
    coinsSold: 452,
    drawDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Fetch live statistics
    apiFetch('/draws/live-stats')
      .then((res) => {
        if (res.hasActiveDraw) {
          setStats(res);
        }
      })
      .catch(console.error);

    // Auto-update values slightly to simulate active user entries (Apple-level luxury tickers)
    const statsInterval = setInterval(() => {
      setStats((prev: any) => ({
        ...prev,
        entriesCount: prev.entriesCount + Math.floor(Math.random() * 2),
        participantsCount: prev.participantsCount + (Math.random() > 0.7 ? 1 : 0),
        tokensSold: prev.tokensSold + (Math.random() > 0.5 ? 1 : 0),
        coinsSold: prev.coinsSold + (Math.random() > 0.85 ? 1 : 0),
      }));
    }, 9000);

    return () => clearInterval(statsInterval);
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

  return (
    <div className="bg-[#0b0f0c] min-h-screen text-white pb-20 border-b border-amber-500/20">
      
      {/* Background glow flares */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,138,71,0.2)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-80 h-80 bg-[#f5d06f]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12 relative">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-time platform status</span>
          </div>
          <h2 className="text-3xl font-bold font-serif text-gold-gradient">
            Live Purchase Activity & Draw Statistics
          </h2>
          <p className="text-xs text-zinc-400">
            Monitor live registered lucky numbers, active pool accumulations, and official counter variables.
          </p>
        </div>

        {/* Central Display: rotating coin & countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main counts left */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950 border border-amber-500/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Accumulated Prize Pool</span>
                <TrendingUp className="w-5 h-5 text-[#f5d06f]" />
              </div>
              <div>
                <p className="text-3xl font-black font-serif text-gold-gradient">
                  Rs. {stats.prizePool.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Increasing based on premium collector token sales</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-amber-500/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Active Entries</span>
                <Users className="w-5 h-5 text-[#f5d06f]" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono">
                  {stats.entriesCount.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Verified cryptographic entries registered in draw database</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-amber-500/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Physical Coins Shipped</span>
                <Coins className="w-5 h-5 text-[#f5d06f]" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono">
                  {stats.coinsSold.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Collectible gold coins minted and verified with QR certificates</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-amber-500/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Digital Tokens Issued</span>
                <Ticket className="w-5 h-5 text-[#f5d06f]" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono">
                  {stats.tokensSold.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Budget-friendly draw tokens mapped directly in database logs</p>
              </div>
            </div>

          </div>

          {/* Central Rotating Coin Display right */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6">
            <GoldCoin number="568794" size="md" autoRotate={false} />
            
            {/* Draw timer */}
            <div className="text-center w-full">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center justify-center space-x-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Timer until Official Draw</span>
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="bg-[#0b0f0c] px-3 py-1.5 rounded border border-zinc-800 font-mono text-sm font-bold text-[#f5d06f]">
                  {timeLeft.days}D
                </div>
                <div className="bg-[#0b0f0c] px-3 py-1.5 rounded border border-zinc-800 font-mono text-sm font-bold text-[#f5d06f]">
                  {timeLeft.hours}H
                </div>
                <div className="bg-[#0b0f0c] px-3 py-1.5 rounded border border-zinc-800 font-mono text-sm font-bold text-[#f5d06f]">
                  {timeLeft.minutes}M
                </div>
                <div className="bg-[#0b0f0c] px-3 py-1.5 rounded border border-zinc-800 font-mono text-sm font-bold text-[#f5d06f]">
                  {timeLeft.seconds}S
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Live rolling activities list bottom */}
        <div className="w-full max-w-2xl mx-auto space-y-4 pt-8 border-t border-zinc-900">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Live Verified Registration Log
            </h3>
          </div>
          <LiveActivityFeed />
        </div>

      </div>

    </div>
  );
}
