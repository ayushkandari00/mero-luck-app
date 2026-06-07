'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Sparkles, Coins, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  user: string;
  number: string;
  type: 'token' | 'coin';
  timestamp: Date;
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Standard connection
    const socket: Socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Realtime feed socket connected');
    });

    socket.on('new-purchase-activity', (data: any) => {
      const newAct: Activity = {
        id: Math.random().toString(),
        user: data.user,
        number: data.number,
        type: data.type,
        timestamp: new Date(data.timestamp),
      };
      
      setActivities((prev) => [newAct, ...prev.slice(0, 4)]);
    });

    // Populate initial dummy items
    const initialActivities: Activity[] = [
      { id: '1', user: 'Bibek K.', number: '568794', type: 'coin', timestamp: new Date(Date.now() - 12000) },
      { id: '2', user: 'Sandip T.', number: '149230', type: 'token', timestamp: new Date(Date.now() - 25000) },
      { id: '3', user: 'Priyanka D.', number: '993410', type: 'token', timestamp: new Date(Date.now() - 48000) },
    ];
    setActivities(initialActivities);

    // Simulated event generator in case socket fails or for quick local checks
    const interval = setInterval(() => {
      const luckyNumbers = ['149230', '568794', '204938', '993410', '481230', '823491'];
      const mockNames = ['Aayush S.', 'Bibek K.', 'Sandip T.', 'Priyanka D.', 'Niranjan R.', 'Samir M.', 'Rachana P.'];
      const newAct: Activity = {
        id: Math.random().toString(),
        user: mockNames[Math.floor(Math.random() * mockNames.length)],
        number: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
        type: Math.random() > 0.45 ? 'token' : 'coin',
        timestamp: new Date(),
      };
      setActivities((prev) => [newAct, ...prev.slice(0, 4)]);
    }, 15000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-[#0b0f0c] border border-amber-500/20 rounded-xl p-4 shadow-[0_4px_30px_rgba(11,15,12,0.6)] overflow-hidden">
      <div className="flex items-center space-x-2 mb-4 border-b border-amber-500/10 pb-2">
        <Sparkles className="w-4 h-4 text-[#f5d06f] animate-pulse" />
        <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Live Activity Feed</h3>
        <span className="bg-red-500 w-2 h-2 rounded-full animate-ping ml-auto" />
        <span className="text-[10px] text-zinc-400 font-bold uppercase">Live</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/50 p-2.5 rounded-lg text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-full ${activity.type === 'coin' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                  {activity.type === 'coin' ? <Coins className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="font-semibold text-[#f5d06f]">{activity.user}</span>
                  <p className="text-[10px] text-zinc-400">
                    Purchased {activity.type === 'coin' ? 'Physical Coin' : 'Lucky Token'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-[#0b6b3a]/30 border border-[#0b6b3a]/40 text-green-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                  #{activity.number}
                </span>
                <p className="text-[9px] text-zinc-500 mt-0.5">
                  {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
