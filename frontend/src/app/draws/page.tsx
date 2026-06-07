'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import GoldCoin from '../../components/GoldCoin';
import { 
  Trophy, Calendar, Award, CheckCircle2, ShieldCheck, 
  HelpCircle, ArrowUpRight, Search, Check
} from 'lucide-react';

export default function DrawsPage() {
  const [upcomingDraws, setUpcomingDraws] = useState<any[]>([]);
  const [pastDraws, setPastDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Provably Fair check input
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const upcoming = await apiFetch('/draws/upcoming');
        setUpcomingDraws(upcoming);

        const past = await apiFetch('/draws/past');
        setPastDraws(past);
      } catch (err) {
        console.error('Failed to load draws list', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#0b6b3a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Opening Draw Registries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-3xl font-bold font-serif text-[#0b6b3a]">
          Mero Luck Official Draws Registry
        </h2>
        <p className="text-xs text-zinc-500">
          Verify active draw pool structures, list upcoming draw times, and review verified past winners.
        </p>
      </div>

      {/* Upcoming Draws Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
          <Calendar className="w-5 h-5 text-[#0b6b3a]" />
          <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">Upcoming Official Draws</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {upcomingDraws.length === 0 ? (
            <p className="text-zinc-500 text-xs">No active draws scheduled at this time.</p>
          ) : (
            upcomingDraws.map((draw) => (
              <div key={draw.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[#0b6b3a]/10 text-[#0b6b3a] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ACTIVE
                </div>
                
                <div>
                  <h4 className="text-base font-bold font-serif text-[#0b6b3a]">{draw.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Draw Date: {new Date(draw.drawDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Prize Pool</span>
                    <p className="font-bold text-[#0b6b3a] text-sm mt-0.5">₹{draw.prizePool.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">Grand Prize</span>
                    <p className="font-bold text-zinc-800 truncate mt-0.5">{draw.grandPrize}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-zinc-700 text-[11px] uppercase tracking-wider">Prize Breakdown</h5>
                  <div className="flex justify-between text-[11px] border-b border-zinc-100 pb-1.5 text-zinc-650">
                    <span>Grand Prize (60%):</span>
                    <span className="font-bold text-zinc-800">{draw.grandPrize}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-zinc-100 pb-1.5 text-zinc-650">
                    <span>2nd Prize (25%):</span>
                    <span className="font-bold text-zinc-800">{draw.secondPrize}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-650">
                    <span>3rd Prize (15%):</span>
                    <span className="font-bold text-zinc-800">{draw.thirdPrize}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Completed Draws & Winner Lists */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
          <Trophy className="w-5 h-5 text-[#0b6b3a]" />
          <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">Completed Past Draws</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pastDraws.length === 0 ? (
            <p className="text-zinc-500 text-xs">No completed draws recorded.</p>
          ) : (
            pastDraws.map((draw) => (
              <div key={draw.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6 relative">
                <div className="absolute top-0 right-0 bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  COMPLETED
                </div>

                <div>
                  <h4 className="text-base font-bold font-serif text-zinc-950">{draw.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Completed on: {new Date(draw.drawDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-zinc-50 p-4 rounded-xl space-y-3">
                  <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Official Winners List</h5>
                  
                  <div className="space-y-2">
                    {draw.winners.map((winner: any) => (
                      <div key={winner.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded border border-zinc-150">
                        <div>
                          <p className="font-bold text-zinc-850">
                            {winner.user.profile?.firstName ? `${winner.user.profile.firstName} ${winner.user.profile.lastName || ''}` : 'Registry Participant'}
                          </p>
                          <p className="text-[9px] text-zinc-400 uppercase mt-0.5">Category: {winner.prizeCategory} PRIZE</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#0b6b3a]">₹{winner.prizeAmount.toLocaleString()}</p>
                          <span className="text-[8px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200 mt-1 inline-block">
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification Provably Fair widget */}
      <div id="verify" className="bg-gradient-to-tr from-[#0b0f0c] to-[#0b6b3a]/40 border border-amber-500/20 rounded-3xl p-8 sm:p-10 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] text-[#f5d06f] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Provably Fair Verification Desk</span>
            </div>
            <h3 className="text-2xl font-bold font-serif">Verify Winner Authenticity</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Every lucky coin and digital entry contains a unique cryptographic record. Enter your 6-digit lucky number to lookup its transaction history, ownership details, and verified hash combinations.
            </p>
          </div>

          {/* Form */}
          <div className="lg:col-span-5 bg-zinc-950 border border-amber-500/10 p-6 rounded-2xl space-y-4">
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
              <div className="bg-[#0b0f0c] border border-zinc-850 p-4 rounded-xl space-y-3 text-[10px] text-zinc-400 font-mono">
                <div className="text-green-400 font-bold flex items-center space-x-1 text-xs border-b border-zinc-850 pb-1.5">
                  <Check className="w-4 h-4" />
                  <span>REGISTRY RECORD FOUND</span>
                </div>
                <div>
                  <p className="text-zinc-500">Owner Email:</p>
                  <p className="text-white font-bold">{verificationResult.luckyNumber.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Owner Name:</p>
                  <p className="text-white font-bold">
                    {verificationResult.luckyNumber.user?.profile?.firstName 
                      ? `${verificationResult.luckyNumber.user.profile.firstName} ${verificationResult.luckyNumber.user.profile.lastName || ''}`
                      : 'Registry Participant'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Ownership Type:</p>
                  <p className="text-white font-bold">
                    {verificationResult.luckyNumber.coin ? 'Physical Coin Edition' : 'Digital Token Entry'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Verification Outcome Hash:</p>
                  <p className="text-[#f5d06f] truncate">{verificationResult.verificationDetails.outcomeHash}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
