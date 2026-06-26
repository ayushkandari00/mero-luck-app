'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';
import { 
  TrendingUp, Users, Coins, ShieldAlert,
  CheckCircle2, XCircle, RefreshCw, Calendar, Award,
  DollarSign, QrCode, Upload, Save, RotateCcw, ImageIcon,
  MessageSquare, AlertTriangle, Eye, ChevronDown, ChevronUp
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

  // ─── Settings State ────────────────────────────────────────────────────────
  const [tokenPrice, setTokenPrice] = useState('250');
  const [coinPrice, setCoinPrice] = useState('2500');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [settingsSaving, setSettingsSaving] = useState<string | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<{ key: string; msg: string; ok: boolean } | null>(null);

  // QR Upload
  const qrFileRef = useRef<HTMLInputElement>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrMsg, setQrMsg] = useState<{ msg: string; ok: boolean } | null>(null);

  // ─── Payment Disputes State ────────────────────────────────────────────────
  const [paymentIssues, setPaymentIssues] = useState<any[]>([]);
  const [issueResolving, setIssueResolving] = useState<string | null>(null);
  const [issueAdminNotes, setIssueAdminNotes] = useState<Record<string, string>>({});
  const [issueExpanded, setIssueExpanded] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [issueMsg, setIssueMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    // Safety check role
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchAdminData();
    fetchSettings();
  }, [isAuthenticated, user, router]);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch('/settings');
      if (data.token_price) setTokenPrice(data.token_price);
      if (data.coin_price) setCoinPrice(data.coin_price);
      if (data.payment_qr_url) setCurrentQrUrl(data.payment_qr_url);
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

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

      const issuesRes = await apiFetch('/admin/payment-issues');
      setPaymentIssues(issuesRes);
    } catch (e) {
      console.error('Failed to retrieve admin details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: 'token_price' | 'coin_price', value: string) => {
    setSettingsSaving(key);
    setSettingsMsg(null);
    try {
      await apiFetch(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      setSettingsMsg({ key, msg: 'Updated successfully!', ok: true });
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch (err: any) {
      setSettingsMsg({ key, msg: err.message || 'Update failed.', ok: false });
    } finally {
      setSettingsSaving(null);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setQrMsg(null);
  };

  const handleQrUpload = async () => {
    const file = qrFileRef.current?.files?.[0];
    if (!file) {
      setQrMsg({ msg: 'Please select an image file.', ok: false });
      return;
    }
    setQrUploading(true);
    setQrMsg(null);
    const formData = new FormData();
    formData.append('qr', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mero_token') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/settings/upload-qr`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrentQrUrl(data.qrUrl);
      setQrPreview(null);
      if (qrFileRef.current) qrFileRef.current.value = '';
      setQrMsg({ msg: 'QR code uploaded and updated successfully!', ok: true });
      setTimeout(() => setQrMsg(null), 4000);
    } catch (err: any) {
      setQrMsg({ msg: err.message || 'Upload failed.', ok: false });
    } finally {
      setQrUploading(false);
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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

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

      {/* ─── PRICE & QR MANAGEMENT ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Price Management */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-serif">Dynamic Price Management</h3>
              <p className="text-[10px] text-zinc-400">Changes reflect instantly across checkout, homepage &amp; order pages</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Token Price */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Digital Lucky Token Price</p>
                  <p className="text-[10px] text-zinc-400">Current: <span className="text-[#0b6b3a] font-bold">₹{tokenPrice}</span></p>
                </div>
                <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-zinc-500 text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={tokenPrice}
                    onChange={(e) => setTokenPrice(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <button
                  onClick={() => handleUpdateSetting('token_price', tokenPrice)}
                  disabled={settingsSaving === 'token_price'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b6b3a] hover:bg-[#0e8a47] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {settingsSaving === 'token_price' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  <span>Save</span>
                </button>
              </div>
              {settingsMsg?.key === 'token_price' && (
                <p className={`text-[10px] font-bold ${settingsMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{settingsMsg.msg}</p>
              )}
            </div>

            {/* Coin Price */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Physical Lucky Coin Price</p>
                  <p className="text-[10px] text-zinc-400">Current: <span className="text-[#0b6b3a] font-bold">₹{coinPrice}</span></p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-zinc-500 text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={coinPrice}
                    onChange={(e) => setCoinPrice(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <button
                  onClick={() => handleUpdateSetting('coin_price', coinPrice)}
                  disabled={settingsSaving === 'coin_price'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b6b3a] hover:bg-[#0e8a47] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {settingsSaving === 'coin_price' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  <span>Save</span>
                </button>
              </div>
              {settingsMsg?.key === 'coin_price' && (
                <p className={`text-[10px] font-bold ${settingsMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{settingsMsg.msg}</p>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Management */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-serif">Payment QR Code Manager</h3>
              <p className="text-[10px] text-zinc-400">Upload a new QR to replace the one shown at checkout</p>
            </div>
          </div>

          {/* Current QR */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">Current QR Code</p>
            {currentQrUrl ? (
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-white border-2 border-zinc-200 rounded-xl p-1 flex items-center justify-center">
                  <img
                    src={`${API_BASE}${currentQrUrl}`}
                    alt="Current Payment QR"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold text-zinc-800">QR Code Active</p>
                  <p className="text-[10px] text-zinc-400 font-mono break-all">{currentQrUrl}</p>
                  <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>SHOWING AT CHECKOUT</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-zinc-400">
                <div className="w-16 h-16 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-600">No QR uploaded yet</p>
                  <p className="text-[10px] text-zinc-400">eSewa auto-generated QR is shown by default</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Upload New QR Code</p>
            
            {/* Drop Zone */}
            <label
              htmlFor="qr-upload"
              className="block border-2 border-dashed border-zinc-300 hover:border-[#d4af37] rounded-xl p-5 text-center cursor-pointer transition-colors group"
            >
              <Upload className="w-6 h-6 text-zinc-400 group-hover:text-[#d4af37] mx-auto mb-2 transition-colors" />
              <p className="text-xs font-bold text-zinc-600 group-hover:text-zinc-800">Click to select QR image</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG, WebP — Max 2MB</p>
              <input
                id="qr-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                ref={qrFileRef}
                onChange={handleQrFileChange}
                className="hidden"
              />
            </label>

            {/* Preview */}
            {qrPreview && (
              <div className="flex items-center space-x-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                <div className="w-16 h-16 bg-white rounded-xl border border-zinc-200 p-1">
                  <img src={qrPreview} alt="QR Preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-800">Preview — Ready to upload</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">This will replace the current QR immediately</p>
                </div>
                <button onClick={() => { setQrPreview(null); if (qrFileRef.current) qrFileRef.current.value = ''; }}>
                  <RotateCcw className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
                </button>
              </div>
            )}

            <button
              onClick={handleQrUpload}
              disabled={qrUploading || !qrPreview}
              className="w-full py-2.5 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
            >
              {qrUploading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Uploading...</span></>
              ) : (
                <><Upload className="w-3.5 h-3.5" /><span>Upload & Activate QR Code</span></>
              )}
            </button>

            {qrMsg && (
              <div className={`flex items-center space-x-2 p-2.5 rounded-lg border text-[11px] font-bold ${
                qrMsg.ok
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {qrMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{qrMsg.msg}</span>
              </div>
            )}
          </div>
        </div>
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

      {/* ─── PAYMENT DISPUTES SECTION ─────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-serif">Payment Disputes &amp; Issue Reports</h3>
              <p className="text-[10px] text-zinc-400">User-reported payment problems awaiting review</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
              {paymentIssues.filter(i => i.status === 'OPEN').length} OPEN
            </span>
            <button onClick={fetchAdminData} className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {paymentIssues.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-500">No payment disputes reported</p>
              <p className="text-[11px] text-zinc-400 mt-1">All payments are processing normally</p>
            </div>
          ) : (
            paymentIssues.map((issue) => (
              <div key={issue.id} className="p-5">
                {/* Issue row header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        issue.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                        issue.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{issue.status}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">Ref: {issue.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[9px] text-zinc-400">{new Date(issue.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">User</p>
                        <p className="text-xs font-bold text-zinc-800 truncate">
                          {issue.user?.profile?.firstName || 'Anonymous'} &bull; {issue.user?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">eSewa TXN ID</p>
                        <p className="text-xs font-mono font-bold text-zinc-800">{issue.esewaTransactionId}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Linked Order</p>
                        <p className="text-xs font-mono text-zinc-600">{issue.transaction?.orderId || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expand / collapse */}
                  <button
                    onClick={() => setIssueExpanded(issueExpanded === issue.id ? null : issue.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
                  >
                    {issueExpanded === issue.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded detail panel */}
                {issueExpanded === issue.id && (
                  <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Screenshot */}
                      <div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Payment Screenshot</p>
                        {issue.screenshotUrl ? (
                          <div
                            className="relative rounded-xl overflow-hidden border border-zinc-200 cursor-pointer group"
                            onClick={() => setLightboxImg(`${API_BASE}${issue.screenshotUrl}`)}
                          >
                            <img
                              src={`${API_BASE}${issue.screenshotUrl}`}
                              alt="Payment screenshot"
                              className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center">
                            <p className="text-[10px] text-zinc-400">No screenshot uploaded</p>
                          </div>
                        )}
                      </div>

                      {/* User message + linked transaction info */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">User Message</p>
                          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 min-h-[4rem]">
                            <p className="text-xs text-zinc-700 leading-relaxed">
                              {issue.message || <span className="text-zinc-400 italic">No message provided</span>}
                            </p>
                          </div>
                        </div>
                        {issue.transaction && (
                          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[10px] space-y-1">
                            <p className="font-bold text-zinc-500 uppercase tracking-wider mb-1">Linked Transaction</p>
                            <div className="flex justify-between"><span className="text-zinc-400">Order:</span><span className="font-mono text-zinc-700">{issue.transaction.orderId}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Amount:</span><span className="font-bold text-zinc-700">₹{issue.transaction.amount}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Type:</span><span className="text-zinc-700">{issue.transaction.type?.replace('_', ' ')}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Status:</span>
                              <span className={`font-bold ${
                                issue.transaction.status === 'APPROVED' ? 'text-green-600' :
                                issue.transaction.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                              }`}>{issue.transaction.status}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Note + Action Buttons */}
                    {issue.status === 'OPEN' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Admin Note (optional)</label>
                          <textarea
                            rows={2}
                            placeholder="Reason for approval/rejection..."
                            value={issueAdminNotes[issue.id] || ''}
                            onChange={e => setIssueAdminNotes(prev => ({ ...prev, [issue.id]: e.target.value }))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 resize-none focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        {issueMsg?.id === issue.id && issueMsg && (
                          <div className={`flex items-center space-x-2 p-2.5 rounded-lg border text-[11px] font-bold ${
                            issueMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {issueMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{issueMsg.msg}</span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              setIssueResolving(issue.id + '-APPROVE');
                              setIssueMsg(null);
                              try {
                                const res = await apiFetch(`/admin/payment-issues/${issue.id}/resolve`, {
                                  method: 'POST',
                                  body: JSON.stringify({ action: 'APPROVE', adminNote: issueAdminNotes[issue.id] || '' }),
                                });
                                setIssueMsg({ id: issue.id, msg: res.message + (res.luckyNumber ? ` Lucky Number: ${res.luckyNumber}` : ''), ok: true });
                                fetchAdminData();
                              } catch (err: any) {
                                setIssueMsg({ id: issue.id, msg: err.message || 'Failed to approve.', ok: false });
                              } finally {
                                setIssueResolving(null);
                              }
                            }}
                            disabled={issueResolving !== null}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            {issueResolving === issue.id + '-APPROVE' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>Approve &amp; Assign Ticket</span>
                          </button>
                          <button
                            onClick={async () => {
                              setIssueResolving(issue.id + '-REJECT');
                              setIssueMsg(null);
                              try {
                                const res = await apiFetch(`/admin/payment-issues/${issue.id}/resolve`, {
                                  method: 'POST',
                                  body: JSON.stringify({ action: 'REJECT', adminNote: issueAdminNotes[issue.id] || '' }),
                                });
                                setIssueMsg({ id: issue.id, msg: res.message, ok: true });
                                fetchAdminData();
                              } catch (err: any) {
                                setIssueMsg({ id: issue.id, msg: err.message || 'Failed to reject.', ok: false });
                              } finally {
                                setIssueResolving(null);
                              }
                            }}
                            disabled={issueResolving !== null}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                          >
                            {issueResolving === issue.id + '-REJECT' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resolved state — show admin note */}
                    {issue.status !== 'OPEN' && issue.adminNote && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Admin Note</p>
                        <p className="text-xs text-zinc-700">{issue.adminNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Screenshot Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm font-bold"
            >
              ✕ Close
            </button>
            <img src={lightboxImg} alt="Payment screenshot" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}
