'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface GoldCoinProps {
  number?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  autoRotate?: boolean;
  interactive?: boolean;
}

export default function GoldCoin({
  number = '568794',
  size = 'md',
  autoRotate = false,
  interactive = true,
}: GoldCoinProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-24 h-24 text-[10px]',
    md: 'w-48 h-48 text-xs',
    lg: 'w-72 h-72 text-sm',
    xl: 'w-96 h-96 text-lg',
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="coin-container flex items-center justify-center">
      <div
        className={`
          relative rounded-full select-none
          ${currentSize}
          ${autoRotate ? 'animate-spin-y' : ''}
          ${interactive ? 'hover:scale-105 transition-transform duration-500 cursor-pointer shadow-[0_0_50px_rgba(212,175,55,0.4)]' : 'shadow-[0_0_30px_rgba(212,175,55,0.25)]'}
        `}
        suppressHydrationWarning
        style={{
          // Use explicit backgroundImage (not background shorthand) to avoid SSR/client hydration mismatch
          backgroundImage: 'radial-gradient(circle, #fcefa6 0%, #d4af37 40%, #aa7c11 80%, #704f05 100%)',
          backgroundColor: '#d4af37',
          border: '8px double #aa7c11',
        }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Outer Circular Rim Details */}
        <div className="absolute inset-2 rounded-full border border-amber-600/30 flex flex-col items-center justify-between p-4 bg-transparent">
          
          {/* Top Lock Graphic */}
          <div className="flex flex-col items-center mt-2">
            <div className="bg-[#aa7c11] text-[#fcefa6] p-1.5 rounded-md shadow-inner border border-[#d4af37]">
              <Lock className="w-5 h-5" />
            </div>
            {/* Flourish lines */}
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-4 h-[1px] bg-amber-800/40" />
              <span className="text-[9px] uppercase tracking-wider text-amber-900/60 font-semibold">AUTHENTIC</span>
              <span className="w-4 h-[1px] bg-amber-800/40" />
            </div>
          </div>

          {/* Middle Text: MERO LUCK */}
          <div className="text-center w-full my-auto flex flex-col items-center justify-center">
            <div className="w-full h-[1px] bg-amber-800/30 mb-1" />
            <h3 
              className="font-serif font-black tracking-widest text-amber-950/90 select-none uppercase drop-shadow-sm"
              style={{
                fontSize: size === 'xl' ? '2rem' : size === 'lg' ? '1.5rem' : '1.1rem',
                fontFamily: 'Georgia, serif'
              }}
            >
              MERO LUCK
            </h3>
            <div className="w-full h-[1px] bg-amber-800/30 mt-1" />
          </div>

          {/* Bottom Engraved Number */}
          <div className="mb-2 text-center flex flex-col items-center">
            {/* Flourish decoration */}
            <div className="text-amber-800/70 font-semibold mb-1" style={{ fontSize: '10px' }}>
              ❦ ──── ❦
            </div>
            
            <div 
              className="font-serif tracking-widest font-bold text-amber-950/90 drop-shadow-md bg-amber-950/10 px-3 py-1 rounded"
              style={{
                fontSize: size === 'xl' ? '2.5rem' : size === 'lg' ? '1.8rem' : '1.3rem',
                fontFamily: 'Georgia, serif',
                textShadow: '1px 1px 0px rgba(255,255,255,0.4), -1px -1px 0px rgba(0,0,0,0.4)'
              }}
            >
              {number}
            </div>
            
            <div className="text-amber-900/50 font-bold text-[8px] mt-1 tracking-wider uppercase">
              REGISTERED COIN
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
