'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { apiFetch } from '../../../utils/api';
import { Coins, IndianRupee, ShoppingBag, CheckCircle, Clock } from 'lucide-react';

export default function AdminNumberedCoins() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    apiFetch('/numbered-coins/stats')
      .then(res => {
        setStats(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load stats');
        setLoading(false);
      });
  }, [isAuthenticated, user, router]);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading coin dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Numbered Coins Dashboard</h1>
        <p className="text-zinc-400">Overview of the fixed supply 100,000 numbered coins system.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Coins className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Supply</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalCoins.toLocaleString()}</p>
          <p className="text-sm text-zinc-400 mt-1">Total Fixed Coins</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">{stats.percentageSold}%</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.soldCoins.toLocaleString()}</p>
          <p className="text-sm text-zinc-400 mt-1">Coins Sold</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded">Pending</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.reservedCoins.toLocaleString()}</p>
          <p className="text-sm text-zinc-400 mt-1">Reserved Coins</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <IndianRupee className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-white">₹{stats.revenueGenerated.toLocaleString()}</p>
          <p className="text-sm text-zinc-400 mt-1">Total Revenue Generated</p>
        </div>
      </div>

      {/* Progress Bar (Percentage Sold) */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
        <h3 className="text-lg font-bold text-white">Sales Progress</h3>
        <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-4 rounded-full transition-all duration-1000" 
            style={{ width: `${Math.max(Number(stats.percentageSold), 1)}%` }} // At least 1% for visual if 0
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Sold: {stats.soldCoins.toLocaleString()}</span>
          <span className="text-zinc-400">Remaining: {stats.availableCoins.toLocaleString()}</span>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">Recent Purchases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Coin Number</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {stats.recentPurchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No purchases yet</td>
                </tr>
              ) : (
                stats.recentPurchases.map((coin: any) => (
                  <tr key={coin.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-4 font-mono text-amber-500 font-bold">{coin.coinNumber}</td>
                    <td className="px-6 py-4 text-white">
                      {coin.user ? `${coin.user.profile?.firstName} ${coin.user.profile?.lastName}` : 'Unknown'}
                      <div className="text-xs text-zinc-500">{coin.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle className="w-3 h-3" /> Sold
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(coin.purchaseDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
