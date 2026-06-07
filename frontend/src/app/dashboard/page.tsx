'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import GoldCoin from '../../components/GoldCoin';
import { apiFetch } from '../../utils/api';
import { 
  Coins, Ticket, Award, Trophy, User, ShieldAlert,
  MapPin, CheckCircle2, ChevronRight, RefreshCw, UploadCloud
} from 'lucide-react';

export default function UserDashboard() {
  const { user, isAuthenticated, setLoginModal, updateUser } = useAuthStore();
  const router = useRouter();
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'coins' | 'profile'>('overview');
  const [stats, setStats] = useState<any>({
    ownedCoins: 0,
    ownedTokens: 0,
    activeEntries: 0,
    totalWins: 0,
    rewardsEarned: 0,
  });
  
  const [coinsList, setCoinsList] = useState<any[]>([]);
  const [tokensList, setTokensList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Profile edit states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      setLoginModal(true);
    }
  }, [isAuthenticated, router, setLoginModal]);

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;
    setLoadingStats(true);
    try {
      const profileData = await apiFetch('/users/me');
      setFirstName(profileData.profile?.firstName || '');
      setLastName(profileData.profile?.lastName || '');
      setPhoneNumber(profileData.phoneNumber || '');
      setStreet(profileData.address?.street || '');
      setCity(profileData.address?.city || '');
      setState(profileData.address?.state || '');
      setPostalCode(profileData.address?.postalCode || '');

      const statsRes = await apiFetch('/users/dashboard-stats');
      setStats(statsRes);

      const coinsRes = await apiFetch('/users/coins');
      setCoinsList(coinsRes);

      const tokensRes = await apiFetch('/users/tokens');
      setTokensList(tokensRes);

      const txRes = await apiFetch('/purchases');
      setTransactionsList(txRes);

      const notifRes = await apiFetch('/users/notifications');
      setNotifications(notifRes);
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/users/me', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          street,
          city,
          state,
          postalCode,
        }),
      });
      updateUser(res.user);
      alert('Profile updated successfully!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await apiFetch('/users/notifications/read', { method: 'POST' });
      // Refresh notifications list
      const notifRes = await apiFetch('/users/notifications');
      setNotifications(notifRes);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingStats) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0b6b3a] animate-spin" />
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Verifying Registry Keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="bg-dark-emerald border border-amber-500/20 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5d06f]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-[#0e8a47] border border-[#f5d06f]/30 flex items-center justify-center font-serif font-black text-xl text-white shadow-inner">
            {user?.profile?.firstName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-gold-gradient">
              {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : 'Registry Participant'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">User ID: {user?.id.substring(0, 8)}...</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                user?.profile?.kycStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                KYC: {user?.profile?.kycStatus || 'PENDING'}
              </span>
              <span className="text-[9px] font-bold text-zinc-400">
                Ref Code: <span className="font-mono text-[#f5d06f]">{user?.profile?.referralCode}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Quick stats summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
          {[
            { label: 'Owned Coins', val: stats.ownedCoins, icon: Coins, color: 'text-amber-400' },
            { label: 'Owned Tokens', val: stats.ownedTokens, icon: Ticket, color: 'text-green-400' },
            { label: 'Active Entries', val: stats.activeEntries, icon: Trophy, color: 'text-[#f5d06f]' },
            { label: 'Rewards Earned', val: `₹${stats.rewardsEarned}`, icon: Award, color: 'text-[#f5d06f]' },
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-950/50 border border-zinc-850 p-3 rounded-xl text-center">
              <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
              <div className="font-mono font-black text-sm text-white">{item.val}</div>
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column navigation tabs */}
        <div className="lg:col-span-3 bg-white border border-zinc-150 rounded-2xl p-4 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
              activeTab === 'overview' ? 'bg-[#0b6b3a]/10 text-[#0b6b3a]' : 'text-zinc-650 hover:bg-zinc-50'
            }`}
          >
            <Trophy className="w-4.5 h-4.5" />
            <span>Account Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tokens')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
              activeTab === 'tokens' ? 'bg-[#0b6b3a]/10 text-[#0b6b3a]' : 'text-zinc-650 hover:bg-zinc-50'
            }`}
          >
            <Ticket className="w-4.5 h-4.5" />
            <span>My Lucky Tokens ({tokensList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coins')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
              activeTab === 'coins' ? 'bg-[#0b6b3a]/10 text-[#0b6b3a]' : 'text-zinc-650 hover:bg-zinc-50'
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span>My Physical Coins ({coinsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
              activeTab === 'profile' ? 'bg-[#0b6b3a]/10 text-[#0b6b3a]' : 'text-zinc-650 hover:bg-zinc-50'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            <span>Registry Profile & KYC</span>
          </button>
        </div>

        {/* Right Column Content display */}
        <div className="lg:col-span-9 bg-white border border-zinc-150 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">Account Overview</h3>
                <p className="text-[11px] text-zinc-500">Registry transactions and audit updates</p>
              </div>

              {/* Notification feed widget */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Registry Alerts</h4>
                  <button onClick={markNotificationsRead} className="text-[10px] text-[#0b6b3a] hover:underline font-bold">
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-zinc-400 text-xs text-center py-4">No recent registry alerts.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-lg text-xs border ${
                        notif.read ? 'bg-zinc-50/50 border-zinc-100 text-zinc-600' : 'bg-green-50/30 border-green-150 text-[#0b6b3a] font-medium'
                      }`}>
                        {notif.message}
                        <span className="block text-[9px] text-zinc-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Transactions billing trace log */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Order Billing Trace Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-400">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Item Type</th>
                        <th className="pb-2">Price Amount</th>
                        <th className="pb-2">Registry Status</th>
                        <th className="pb-2">Date Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-zinc-400">No order logs registered.</td>
                        </tr>
                      ) : (
                        transactionsList.map((tx) => (
                          <tr key={tx.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                            <td className="py-2.5 font-mono font-bold">{tx.orderId}</td>
                            <td className="py-2.5">
                              {tx.type === 'COIN_PURCHASE' ? 'Physical Coin' : 'Digital Token'}
                            </td>
                            <td className="py-2.5 font-bold">₹{tx.amount}</td>
                            <td className="py-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                tx.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                tx.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-zinc-400">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">My Lucky Tokens</h3>
                <p className="text-[11px] text-zinc-500 font-medium">Digital draw registries assigned to your account</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tokensList.length === 0 ? (
                  <div className="col-span-full border border-dashed border-zinc-200 p-8 text-center rounded-xl">
                    <Ticket className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-zinc-500 text-xs">No active digital tokens registered.</p>
                  </div>
                ) : (
                  tokensList.map((token) => (
                    <div key={token.id} className="border border-zinc-200/80 rounded-xl p-4 bg-gradient-to-tr from-zinc-50 to-white relative overflow-hidden group">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Token ID: #{token.id.substring(0, 6)}</span>
                        <span className="text-[9px] font-black uppercase bg-[#0b6b3a]/10 text-[#0b6b3a] px-2 py-0.5 rounded">
                          ACTIVE DRAW
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-400">Lucky Number:</p>
                          <p className="text-lg font-serif font-black text-[#0b6b3a] tracking-wider mt-0.5">
                            #{token.luckyNumber.number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-zinc-400">Registered on:</p>
                          <p className="text-[10px] text-zinc-600 font-medium">{new Date(token.purchaseDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">My Physical Collectible Coins</h3>
                <p className="text-[11px] text-zinc-500">Premium gold coins and authenticity registry certificates</p>
              </div>

              <div className="space-y-6">
                {coinsList.length === 0 ? (
                  <div className="border border-dashed border-zinc-200 p-8 text-center rounded-xl">
                    <Coins className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-zinc-500 text-xs">No physical collector coins registered to this account.</p>
                  </div>
                ) : (
                  coinsList.map((coin) => (
                    <div key={coin.id} className="border border-zinc-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col md:flex-row items-center gap-6">
                      
                      {/* Left: Render coin representation */}
                      <div className="scale-90 flex-shrink-0">
                        <GoldCoin number={coin.luckyNumber.number} size="sm" autoRotate={false} interactive={false} />
                      </div>

                      {/* Right: Coin details */}
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-2 gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900">Mero Luck Gold Coin Edition</h4>
                            <p className="text-[10px] text-zinc-400">Serial Number: {coin.serialNumber}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border text-center ${
                            coin.shippingStatus === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            Shipping: {coin.shippingStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] text-zinc-400">Registered Lucky Number:</p>
                            <p className="text-sm font-serif font-black text-[#0b6b3a] tracking-widest mt-0.5">
                              #{coin.luckyNumber.number}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400">Ownership Authenticity:</p>
                            <p className="text-[11px] text-green-600 font-bold flex items-center space-x-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>VERIFIED OWNER</span>
                            </p>
                          </div>
                        </div>

                        <div className="bg-[#0b6b3a]/5 border border-[#0b6b3a]/10 p-3 rounded-lg flex items-center justify-between text-[11px] text-zinc-600 gap-4">
                          <span>Verify this coin's trace hash on the homepage cryptographic registry lookup.</span>
                          <button 
                            onClick={() => {
                              router.push('/#provably-fair');
                            }} 
                            className="bg-[#0b6b3a] text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-[#0e8a47] shrink-0"
                          >
                            Verify Trace
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#0b6b3a]">Registry Credentials & KYC</h3>
                <p className="text-[11px] text-zinc-500">Secure and update your account details and delivery addresses</p>
              </div>

              {/* KYC and Phone Verification */}
              {user?.profile?.kycStatus !== 'APPROVED' && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">SMS Authentication Required</h4>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Your phone number registry trace is not verified. Complete the SMS verification OTP lookup to finalize authentication approval.
                    </p>
                    <button
                      onClick={() => setLoginModal(true)} // Opens auth modal, user can toggle to OTP verification or register
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1 rounded mt-2 transition-colors"
                    >
                      Verify Phone OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Profile details form */}
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Ayush"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sharma"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Email (Immutable)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full bg-zinc-100 border border-zinc-250 rounded-lg px-3 py-2 text-xs text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="9800000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Shipping address info */}
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-[#0b6b3a]" />
                    <span>Default Delivery Address</span>
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Street Address</label>
                      <input
                        type="text"
                        placeholder="e.g. 12 Lalitpur Marg"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[11px] text-zinc-400 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="Kathmandu"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">State</label>
                        <input
                          type="text"
                          placeholder="Bagmati"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  {loading ? 'Saving details...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
