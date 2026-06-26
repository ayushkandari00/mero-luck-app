'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, ShieldCheck, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  // Password strength indicator
  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(newPassword);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,138,71,0.2)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#f5d06f]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#111714] border border-amber-500/20 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15)]">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b6b3a]/60 to-transparent border-b border-amber-500/15 px-8 py-6 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#f5d06f]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-serif">Reset Password</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Mero Luck Registry</p>
            </div>
          </div>

          <div className="p-8">
            {/* Success State */}
            {success ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-white font-bold text-lg">Password Reset Successful!</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                >
                  <span>Go to Homepage & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Invalid token state */}
                {!token ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-red-300 text-sm">{errorMsg}</p>
                    <button
                      onClick={() => router.push('/')}
                      className="text-[#f5d06f] text-xs hover:underline"
                    >
                      ← Back to homepage
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                      <h2 className="text-white font-bold text-sm">Set Your New Password</h2>
                      <p className="text-zinc-400 text-[11px]">Choose a strong password for your Mero Luck account.</p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-3 rounded-lg text-[11px] flex items-start space-x-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-zinc-400 font-medium">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                          type={showPw ? 'text' : 'password'}
                          required
                          placeholder="Minimum 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-white text-xs focus:outline-none focus:border-[#d4af37] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Strength bar */}
                      {newPassword.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex space-x-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  i < strength ? strengthColors[strength - 1] : 'bg-zinc-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[10px] font-bold ${
                            strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-400' : strength === 3 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {strengthLabels[strength - 1] || ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-zinc-400 font-medium">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full bg-zinc-950 border rounded-xl pl-9 pr-10 py-2.5 text-white text-xs focus:outline-none transition-colors ${
                            confirmPassword && confirmPassword !== newPassword
                              ? 'border-red-500/50 focus:border-red-500'
                              : confirmPassword && confirmPassword === newPassword
                              ? 'border-green-500/50 focus:border-green-500'
                              : 'border-zinc-800 focus:border-[#d4af37]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-[10px] text-red-400">Passwords do not match</p>
                      )}
                    </div>

                    {/* Requirements */}
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-1.5">
                      {[
                        { label: 'At least 8 characters', met: newPassword.length >= 8 },
                        { label: 'Contains a letter', met: /[a-zA-Z]/.test(newPassword) },
                        { label: 'Contains a number', met: /[0-9]/.test(newPassword) },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-400' : 'bg-zinc-600'}`} />
                          <span className={`text-[10px] ${req.met ? 'text-green-400' : 'text-zinc-500'}`}>{req.label}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !token}
                      className="w-full py-3 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
                    </button>

                    <p className="text-[10px] text-center text-zinc-500">
                      Remember your password?{' '}
                      <button type="button" onClick={() => router.push('/')} className="text-[#f5d06f] hover:underline">
                        Back to homepage
                      </button>
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f0c] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
