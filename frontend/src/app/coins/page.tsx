'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ShoppingCart, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

type Coin = {
  id: string;
  coinNumber: string;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  user?: { email: string; profile: { firstName: string; lastName: string } };
};

export default function NumberedCoinsMarketplace() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD' | 'RESERVED'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '100', // Load 100 at a time for grid
      });
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const res = await apiFetch(`/numbered-coins?${queryParams.toString()}`);
      setCoins(res.coins);
      setTotalPages(res.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch coins', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const handlePurchase = async () => {
    if (!selectedCoin) return;
    setPurchaseLoading(true);
    try {
      const res = await apiFetch('/numbered-coins/purchase', {
        method: 'POST',
        body: JSON.stringify({ coinNumber: selectedCoin.coinNumber }),
      });
      setPurchaseSuccess(res);
      // Update local state
      setCoins(prev => prev.map(c => c.id === selectedCoin.id ? { ...c, status: 'RESERVED' } : c));
    } catch (error: any) {
      alert(error.message || 'Failed to purchase coin');
    } finally {
      setPurchaseLoading(false);
      setSelectedCoin(null);
    }
  };

  return (
    <div className="bg-[#0b0f0c] min-h-screen text-white pb-20 border-b border-amber-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,138,71,0.15)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 relative">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold font-serif text-gold-gradient">
            Premium Numbered Coins
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Browse and secure your unique 6-digit lucky coin. Fixed supply of 100,000 exclusively minted coins.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-amber-500/20 p-4 rounded-xl">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search exact number (e.g. 000157)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'] as const).map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === status 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                    : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {loading && coins.length === 0 ? (
             <div className="col-span-full py-20 text-center text-zinc-500">Loading premium collection...</div>
          ) : coins.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500">No coins found matching your criteria.</div>
          ) : (
            coins.map(coin => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => coin.status === 'AVAILABLE' && setSelectedCoin(coin)}
                className={`
                  relative aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all cursor-pointer group
                  ${coin.status === 'AVAILABLE' ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-700/10 hover:shadow-[0_0_20px_rgba(245,208,111,0.3)] hover:scale-105' : ''}
                  ${coin.status === 'SOLD' ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed grayscale' : ''}
                  ${coin.status === 'RESERVED' ? 'border-blue-500/30 bg-blue-900/10 cursor-not-allowed' : ''}
                `}
              >
                <div className={`text-lg font-mono font-black tracking-widest ${
                  coin.status === 'AVAILABLE' ? 'text-amber-400' : 'text-zinc-500'
                }`}>
                  {coin.coinNumber}
                </div>
                
                {coin.status === 'SOLD' && (
                  <div className="absolute -bottom-2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> SOLD
                  </div>
                )}
                {coin.status === 'RESERVED' && (
                  <div className="absolute -bottom-2 bg-blue-900/50 border border-blue-500/50 text-blue-300 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> RESERVED
                  </div>
                )}
                {coin.status === 'AVAILABLE' && (
                  <div className="absolute -bottom-2 bg-green-500/20 border border-green-500/50 text-green-400 text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    BUY NOW
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="p-2 bg-zinc-900 rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-zinc-400 text-sm">Page {page} of {totalPages.toLocaleString()}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="p-2 bg-zinc-900 rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedCoin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-amber-500/30 p-8 rounded-2xl max-w-md w-full space-y-6"
            >
              <h3 className="text-2xl font-serif text-gold-gradient text-center">Secure Your Coin</h3>
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,208,111,0.2)]">
                  <span className="text-2xl font-mono font-black text-amber-400">{selectedCoin.coinNumber}</span>
                </div>
              </div>
              <div className="space-y-3 text-center">
                <p className="text-zinc-300">You are about to purchase the exclusive numbered coin <strong>{selectedCoin.coinNumber}</strong>.</p>
                <p className="text-sm text-zinc-500">Price: <strong className="text-green-400 font-mono text-lg">₹1,000</strong></p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedCoin(null)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePurchase}
                  disabled={purchaseLoading}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition flex justify-center items-center gap-2"
                >
                  {purchaseLoading ? 'Processing...' : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Confirm
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {purchaseSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-zinc-950 border border-green-500/30 p-8 rounded-2xl max-w-md w-full space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Coin Reserved!</h3>
              <p className="text-zinc-400 text-sm">
                {purchaseSuccess.message}
              </p>
              <div className="bg-zinc-900 p-4 rounded-lg text-left space-y-2">
                <p className="text-xs text-zinc-500 uppercase">Payment Details</p>
                <p className="text-sm"><span className="text-zinc-400">UPI:</span> {purchaseSuccess.paymentDetails.upiId}</p>
                <p className="text-sm"><span className="text-zinc-400">Acc:</span> {purchaseSuccess.paymentDetails.accountNumber}</p>
              </div>
              <button 
                onClick={() => setPurchaseSuccess(null)}
                className="w-full py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-bold transition"
              >
                Okay, I will pay
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
