'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Bell, User, LogOut, ShieldAlert, Award } from 'lucide-react';
import { apiFetch } from '../utils/api';

const LogoIcon = () => (
  <svg viewBox="0 0 100 100" className="w-9 h-9 drop-shadow-[0_2px_8px_rgba(11,107,58,0.45)] group-hover:scale-105 transition-transform duration-300">
    {/* Outer Gold ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGradient)" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldGradient)" strokeWidth="1" strokeDasharray="3 2" />
    {/* Inner Green radial background */}
    <circle cx="50" cy="50" r="38" fill="url(#emeraldRadial)" />
    
    {/* Four leaf clover SVG */}
    <path 
      d="M50 50 C44 33, 28 33, 37 50 C28 67, 44 67, 50 50 C56 67, 72 67, 63 50 C72 33, 56 33, 50 50 Z" 
      fill="url(#goldGradient)" 
      stroke="#aa7c11" 
      strokeWidth="1"
    />
    <path 
      d="M50 48 L50 25 C40 25, 40 40, 50 48 Z M50 52 L50 75 C60 75, 60 60, 50 52 Z M48 50 L25 50 C25 60, 40 60, 48 50 Z M52 50 L75 50 C75 40, 60 40, 52 50 Z" 
      fill="url(#cloverGreen)"
    />
    {/* Center sparkling dot */}
    <circle cx="50" cy="50" r="3" fill="#fff" />
    
    <defs>
      <radialGradient id="emeraldRadial" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0e8a47" />
        <stop offset="100%" stopColor="#0b6b3a" />
      </radialGradient>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5d06f" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa7c11" />
      </linearGradient>
      <linearGradient id="cloverGreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, setLoginModal } = useAuthStore();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch unread notifications count
      apiFetch('/users/notifications')
        .then((res) => {
          const unread = res.filter((n: any) => !n.read).length;
          setUnreadNotifications(unread);
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f0c]/90 backdrop-blur-md border-b border-amber-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <Link href="/" className="flex items-center space-x-3 group">
          <LogoIcon />
          <div>
            <span className="text-base font-black tracking-widest text-gold-gradient font-sans uppercase block leading-none">MERO LUCK</span>
            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mt-1">LOTTERY & COINS</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === '/' ? 'text-[#f5d06f]' : 'text-zinc-300 hover:text-white'}`}>
            Home
          </Link>
          <Link href="/live-purchase" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === '/live-purchase' ? 'text-[#f5d06f]' : 'text-zinc-300 hover:text-white'}`}>
            Live Purchases
          </Link>
          <Link href="/draws" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === '/draws' ? 'text-[#f5d06f]' : 'text-zinc-300 hover:text-white'}`}>
            Draws
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname.startsWith('/dashboard') ? 'text-[#f5d06f]' : 'text-zinc-300 hover:text-white'}`}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link href="/admin" className={`text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/30 px-2 py-0.5 rounded flex items-center space-x-1 hover:bg-red-500/10 transition-colors`}>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Desk</span>
            </Link>
          )}
        </nav>

        {/* Account controls */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex items-center space-x-3">
                
                {/* Rewards Indicator */}
                <div className="hidden sm:flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5 text-[#f5d06f]" />
                  <span className="text-[10px] text-[#f5d06f] font-bold">Rewards verified</span>
                </div>

                {/* Notifications icon */}
                <button className="relative p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>

                {/* User dropdown toggle */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1 pr-3 rounded-full hover:border-[#d4af37] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0b6b3a] flex items-center justify-center text-white text-xs font-bold border border-[#f5d06f]/20">
                    {user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-white font-medium max-w-[80px] truncate">
                    {user?.profile?.firstName || 'User'}
                  </span>
                </button>
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b0f0c] border border-amber-500/20 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Signed In As</p>
                    <p className="text-xs text-white truncate font-medium">{user?.email}</p>
                  </div>

                  <Link href="/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900/60">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>My Dashboard</span>
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setShowDropdown(false)} className="flex items-center space-x-2 px-4 py-2 text-xs text-red-300 hover:text-red-100 hover:bg-zinc-900/60">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span>Admin Board</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900/60 text-left border-t border-zinc-850 mt-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLoginModal(true)}
              className="px-4 py-1.5 bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
