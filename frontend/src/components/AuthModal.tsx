'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, ShieldCheck, Mail, Lock, Phone, User, Award } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function AuthModal() {
  const { loginModalOpen, setLoginModal, setAuth } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Login / Register Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // OTP Form states
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  if (!loginModalOpen) return null;

  const handleClose = () => {
    setLoginModal(false);
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setFirstName('');
    setLastName('');
    setReferralCode('');
    setOtpCode('');
    setOtpSentMsg('');
    setErrorMsg('');
    setMode('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      // ─── SECURITY M3: Store token first so apiFetch can attach it on /users/me
      localStorage.setItem('mero_token', res.accessToken);
      localStorage.setItem('mero_refresh_token', res.refreshToken);
      const userData = await apiFetch('/users/me');
      setAuth(userData, res.accessToken, res.refreshToken);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          phoneNumber,
          firstName,
          lastName,
          referralCode: referralCode || undefined,
        }),
      });

      // ─── SECURITY M3: Store token first so apiFetch can attach it on /users/me
      localStorage.setItem('mero_token', res.accessToken);
      localStorage.setItem('mero_refresh_token', res.refreshToken);
      const userData = await apiFetch('/users/me');
      setAuth(userData, res.accessToken, res.refreshToken);

      setMode('otp');
      const otpRes = await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
      setOtpSentMsg(otpRes.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });
      
      // Verification was successful, refresh user state
      const userRes = await apiFetch('/users/me');
      setAuth(userRes, localStorage.getItem('mero_token')!, localStorage.getItem('mero_refresh_token')!);
      alert('Phone & KYC Verified successfully!');
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginMock = async () => {
    // ─── SECURITY C3: Google OAuth mock is disabled — backend returns 503.
    // This button now informs the user instead of sending fake credentials.
    setErrorMsg('Google login is not yet available. Please use email/password to sign in.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0b0f0c] border border-amber-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/10 bg-zinc-950">
          <div>
            <h3 className="text-base font-bold text-gold-gradient font-serif uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-[#f5d06f]" />
              <span>Mero Luck Registry</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Authentic credentials required</p>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-2.5 rounded-lg text-[11px] text-center">
              {errorMsg}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Registry Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="relative flex py-1 items-center justify-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Or</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Mock Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLoginMock}
                className="w-full py-2 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fillRule="evenodd" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-[10px] text-center text-zinc-400">
                Don't have a registry account?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-[#f5d06f] hover:underline font-bold">
                  Create Registry Account
                </button>
              </p>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ayush"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Phone Number (For OTP Verification)</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    placeholder="9800000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Referral Code (Optional)</label>
                <div className="relative">
                  <Award className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="MERO-XXXX"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                <span className="text-[14px]">🎁</span>
                <span className="text-[9px] text-zinc-300">
                  New registers instantly receive Rs. 100 Welcome Bonus and unique referral code.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-[10px] text-center text-zinc-400">
                Already registered?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-[#f5d06f] hover:underline font-bold">
                  Sign In
                </button>
              </p>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-[#0b6b3a]/10 border border-[#0b6b3a]/30 p-4 rounded-xl text-center space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">SMS Verification Code Sent</h4>
                <p className="text-[10px] text-zinc-300">
                  {otpSentMsg || 'We sent a verification SMS code to your phone.'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 text-center font-bold uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 text-center text-white font-mono text-base tracking-widest focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Complete KYC'}
              </button>

              <p className="text-[10px] text-center text-zinc-400">
                Verification logs are outputted to the backend console terminal server logs.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
