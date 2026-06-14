'use client';

import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamification-store';
import { Progress } from '@/components/ui/Progress';

export const StreakCard: React.FC = () => {
  const { state: { currentStreak, longestStreak, ecoPoints, levelTitle } } = useGamificationStore();

  const nextLevelPoints = Math.ceil((ecoPoints + 1) / 100) * 100;
  const progressToNext = ((ecoPoints % 100) / 100) * 100;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-surface-900 dark:to-surface-800 rounded-2xl shadow-sm p-6 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/5 blur-[50px] transform rotate-12 pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">Your Impact</h3>
          <p className="text-sm text-slate-400">{levelTitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/10">
          <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-500'}`} />
          <span className="font-bold font-display">{currentStreak} <span className="text-sm font-normal text-slate-300">day streak</span></span>
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2 text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-eco-400 to-ocean-400">
            {ecoPoints} <span className="text-sm font-medium text-slate-400">pts</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Best streak: {longestStreak}
          </div>
        </div>
        
        <Progress value={progressToNext} variant="gradient" size="sm" className="bg-white/10" />
        <p className="text-xs text-slate-400 mt-2 text-right">
          {nextLevelPoints - ecoPoints} pts to next level
        </p>
      </div>
    </div>
  );
};
