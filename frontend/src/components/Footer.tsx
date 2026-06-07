'use client';

import React from 'react';
import Link from 'next/link';

const LogoIcon = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-[0_2px_6px_rgba(11,107,58,0.4)]">
    {/* Outer Gold ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGradientFooter)" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldGradientFooter)" strokeWidth="1" strokeDasharray="3 2" />
    {/* Inner Green radial background */}
    <circle cx="50" cy="50" r="38" fill="url(#emeraldRadialFooter)" />
    
    {/* Four leaf clover SVG */}
    <path 
      d="M50 50 C44 33, 28 33, 37 50 C28 67, 44 67, 50 50 C56 67, 72 67, 63 50 C72 33, 56 33, 50 50 Z" 
      fill="url(#goldGradientFooter)" 
      stroke="#aa7c11" 
      strokeWidth="1"
    />
    <path 
      d="M50 48 L50 25 C40 25, 40 40, 50 48 Z M50 52 L50 75 C60 75, 60 60, 50 52 Z M48 50 L25 50 C25 60, 40 60, 48 50 Z M52 50 L75 50 C75 40, 60 40, 52 50 Z" 
      fill="url(#cloverGreenFooter)"
    />
    {/* Center sparkling dot */}
    <circle cx="50" cy="50" r="3" fill="#fff" />
    
    <defs>
      <radialGradient id="emeraldRadialFooter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0e8a47" />
        <stop offset="100%" stopColor="#0b6b3a" />
      </radialGradient>
      <linearGradient id="goldGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5d06f" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa7c11" />
      </linearGradient>
      <linearGradient id="cloverGreenFooter" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Footer() {
  return (
    <footer className="w-full bg-[#0b0f0c] border-t border-amber-500/10 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <LogoIcon />
            <span className="text-base font-black tracking-widest text-gold-gradient font-sans uppercase">MERO LUCK</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            World-class physical gold collectible coins and verified digital draw registry. Experience trust, elegance, and life-changing wins in a provably fair system.
          </p>
          <div className="flex space-x-3 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            <span>fb/meroluck</span>
            <span>in/meroluck</span>
            <span>www.meroluck.com</span>
          </div>
        </div>

        {/* Links: Platform */}
        <div>
          <h4 className="text-white font-bold font-serif uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-zinc-400">
            <li>
              <Link href="/live-purchase" className="hover:text-[#f5d06f] transition-colors">
                Live Stats Feed
              </Link>
            </li>
            <li>
              <Link href="/draws" className="hover:text-[#f5d06f] transition-colors">
                Active Draws
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-[#f5d06f] transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/#provably-fair" className="hover:text-[#f5d06f] transition-colors">
                Provably Fair System
              </Link>
            </li>
          </ul>
        </div>

        {/* Links: Legal & FAQ */}
        <div>
          <h4 className="text-white font-bold font-serif uppercase tracking-wider mb-4">Verification & Help</h4>
          <ul className="space-y-2.5 text-zinc-400">
            <li>
              <Link href="/#faq" className="hover:text-[#f5d06f] transition-colors">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link href="/draws#verify" className="hover:text-[#f5d06f] transition-colors">
                Winner Verification
              </Link>
            </li>
            <li>
              <span className="cursor-not-allowed opacity-60">Terms & Conditions</span>
            </li>
            <li>
              <span className="cursor-not-allowed opacity-60">Privacy Policy</span>
            </li>
          </ul>
        </div>

        {/* Next Mega Draw Countdown Preview */}
        <div className="bg-gradient-to-tr from-[#0b6b3a]/20 to-zinc-950 p-5 rounded-xl border border-amber-500/10 space-y-2">
          <h4 className="text-[#f5d06f] font-serif uppercase tracking-widest text-[10px] font-bold">Next Grand Prize Pool</h4>
          <div className="font-serif text-white font-black text-xl tracking-wider">
            Rs. 1,00,00,000
          </div>
          <p className="text-[10px] text-zinc-400">
            The next official draw occurs every 6 months. Live entries are logged transparently via cryptographic server seeds.
          </p>
          <div className="bg-[#f5d06f]/10 text-[#f5d06f] font-bold text-[9px] uppercase px-2 py-0.5 rounded text-center tracking-widest">
            Cryptographically Secured
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[10px] tracking-wider uppercase font-semibold">
        <p>© 2026 Mero Luck Lottery & Collectibles. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 flex items-center space-x-1.5">
          <span>Designed with luxury and precision</span>
          <span className="text-[#d4af37]">✦</span>
          <span>Nepal</span>
        </p>
      </div>
    </footer>
  );
}
