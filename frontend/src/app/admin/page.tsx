'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';
import { 
  TrendingUp, Users, Coins, Ticket, ShieldAlert,
  CheckCircle2, XCircle, RefreshCw, Calendar, Award
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Admin stats
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    prizePool: 0,
    coinsSold: 0,
    tokensSold: 0,
    pendingKyc: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create Draw Form state
  const [drawTitle, setDrawTitle] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [prizePool, setPrizePool] = useState(10000000);
  const [grandPrize, setGrandPrize] = useState('Rs. 60 Lakhs');
  const [secondPrize, setSecondPrize] = useState('Rs. 25 Lakhs');
  const [thirdPrize, setThirdPrize] = useState('Rs. 15 Lakhs');

  useEffect(() => {
    // Safety check role
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchAdminData();
  }, [isAuthenticated, user, router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiFetch('/admin/dashboard-stats');
      setStats(statsRes);

      const txRes = await apiFetch('/admin/transactions');
      setTransactions(txRes);

      const usersRes = await apiFetch('/admin/users');
      setUsersList(usersRes);

      const upcomingDraws = await apiFetch('/draws/upcoming');
      setDraws(upcomingDraws);
    } catch (e) {
      console.error('Failed to retrieve admin details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (txId: string) => {
    if (!confirm('Are you sure you want to approve this payment receipt? This will assign a unique Lucky Number and create a draw entry.')) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/approve-payment/${txId}`, { method: 'POST' });
      alert(res.message);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPayment = async (txId: string) => {
    if (!confirm('Are you sure you want to reject this payment receipt?')) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/reject-payment/${txId}`, { method: 'POST' });
      alert(res.message);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKycStatus = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    try {
      await apiFetch(`/admin/users/${userId}/kyc`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      alert(`KYC status updated to ${status}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/admin/draws', {
        method: 'POST',
        body: JSON.stringify({
          title: drawTitle,
          drawDate,
          prizePool,
          grandPrize,
          secondPrize,
          thirdPrize,
        }),
      });
      alert('Draw scheduled and published successfully!');
      setDrawTitle('');
      setDrawDate('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create draw.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickWinners = async (drawId: string) => {
    if (!confirm('Warning: This will close the draw, select winners cryptographically using Server Seeds, and disburse cash prize allocations. Continue?')) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/admin/draws/${drawId}/pick-winners`, { method: 'POST' });
      alert(res.message);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to pick winners.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-red-500">
            Initializing Administrator Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Admin Title Banner */}
      <div className="bg-zinc-950 border-2 border-red-500/30 rounded-2xl p-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-red-400">Mero Luck Admin Command Center</h2>
            <p className="text-[10px] text-zinc-400">Registry adjustments, transaction auditing, and winner disburse actions</p>
          </div>
        </div>
        <button onClick={fetchAdminData} className="p-2 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Analytics widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Registry Revenue', val: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
          { label: 'Pending Payments', val: stats.pendingPayments, icon: ShieldAlert, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Coins Distributed', val: stats.coinsSold, icon: Coins, color: 'text-amber-600 bg-amber-600/10' },
          { label: 'Total Registered Users', val: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">{item.label}</span>
              <span className="text-xl font-serif font-black text-zinc-900 mt-1 block">{item.val}</span>
            </div>
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main split sections: Left payments check, Right Draw creator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Transaction Proof Approvals (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-serif">Pending Payments Receipt Approvals</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Audit transaction snapshots and assign corresponding ticket variables</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">User Details</th>
                  <th className="pb-2">Item / Amount</th>
                  <th className="pb-2">Payment Receipt</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t => t.status === 'PENDING').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-zinc-400 font-medium">No pending receipts to verify.</td>
                  </tr>
                ) : (
                  transactions.filter(t => t.status === 'PENDING').map((tx) => (
                    <tr key={tx.id} className="border-b border-zinc-150 last:border-0 hover:bg-zinc-50/50">
                      <td className="py-3 font-mono font-bold text-zinc-900">{tx.orderId}</td>
                      <td className="py-3">
                        <p className="font-bold text-zinc-800">{tx.user.profile?.firstName || 'Participant'}</p>
                        <p className="text-[10px] text-zinc-400">{tx.user.email}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-medium">{tx.type === 'COIN_PURCHASE' ? 'Physical Coin' : 'Lucky Token'}</p>
                        <p className="text-[#0b6b3a] font-bold">₹{tx.amount}</p>
                      </td>
                      <td className="py-3">
                        {tx.paymentProofUrl ? (
                          <a 
                            href={`http://localhost:5000${tx.paymentProofUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-amber-600 hover:underline font-bold flex items-center space-x-1"
                          >
                            <span>View Proof</span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic">No receipt file</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprovePayment(tx.id)}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPayment(tx.id)}
                          disabled={submitting}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Draw Scheduler (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-serif">Schedule Mega Draw</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Publish a new draw registry structure</p>
          </div>

          <form onSubmit={handleCreateDraw} className="space-y-4">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Draw Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Mero Luck Mega Draw #2"
                value={drawTitle}
                onChange={(e) => setDrawTitle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Draw Date</label>
              <input
                type="datetime-local"
                required
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Prize Pool (Rs)</label>
                <input
                  type="number"
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Grand Prize</label>
                <input
                  type="text"
                  required
                  value={grandPrize}
                  onChange={(e) => setGrandPrize(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#0b6b3a] hover:bg-[#0e8a47] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Publish Draw
            </button>
          </form>
        </div>

      </div>

      {/* Bottom section: Draw Winner Picking & User List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Draw Management list (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-serif">Active Draws Winner Picker</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Select winning tickets cryptographically to complete draw events</p>
          </div>

          <div className="space-y-4">
            {draws.length === 0 ? (
              <p className="text-zinc-550 text-xs italic">No active scheduled draws scheduled.</p>
            ) : (
              draws.map((draw) => (
                <div key={draw.id} className="border border-zinc-250 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-800">{draw.title}</h4>
                    <p className="text-[10px] text-zinc-400">Date: {new Date(draw.drawDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Pool: ₹{draw.prizePool.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handlePickWinners(draw.id)}
                    disabled={submitting}
                    className="bg-[#0b6b3a] hover:bg-[#0e8a47] text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Pick Winners
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User registry list (col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-serif">Registry Participants & KYC Desk</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Verify participant KYC authenticity and approve accounts</p>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400">
                  <th className="pb-2">User Details</th>
                  <th className="pb-2">KYC Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr key={usr.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                    <td className="py-2.5">
                      <p className="font-bold text-zinc-800">{usr.profile?.firstName ? `${usr.profile.firstName} ${usr.profile.lastName || ''}` : 'Participant'}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{usr.email}</p>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        usr.profile?.kycStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {usr.profile?.kycStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right space-x-1.5">
                      {usr.profile?.kycStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleKycStatus(usr.id, 'APPROVED')}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Approve KYC
                        </button>
                      )}
                      {usr.profile?.kycStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleKycStatus(usr.id, 'REJECTED')}
                          disabled={submitting}
                          className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
