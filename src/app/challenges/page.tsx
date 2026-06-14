'use client';

import React from 'react';
import { useGamificationStore } from '@/stores/gamification-store';
import { useActivityStore } from '@/stores/activity-store';
import { Progress } from '@/components/ui/Progress';
import { Trophy, CheckCircle, Lock, Target } from 'lucide-react';
import type { Challenge, Badge } from '@/types';

export default function ChallengesPage() {
  const { state: { activeChallenges, badges, levelTitle, ecoPoints, level }, earnBadge, updateChallengeProgress } = useGamificationStore();
  const { logs } = useActivityStore();

  // Sort badges: earned first, then by rarity
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    const rarityScore = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return rarityScore[a.rarity] - rarityScore[b.rarity];
  });

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Challenges & Rewards
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Complete tasks, earn badges, and level up your impact.
          </p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Current Level</p>
            <p className="font-bold text-eco-600 dark:text-eco-400">{levelTitle}</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Eco Points</p>
            <p className="font-bold text-slate-900 dark:text-white">{ecoPoints}</p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-eco-500" />
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Active Challenges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.map(challenge => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge} 
              onTestComplete={() => updateChallengeProgress(challenge.id, challenge.target)} 
            />
          ))}
        </div>
      </section>

      {/* Badge Collection */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Badge Collection</h2>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {badges.filter(b => b.earned).length} / {badges.length} Unlocked
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedBadges.map(badge => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ChallengeCard({ challenge, onTestComplete }: { challenge: Challenge, onTestComplete: () => void }) {
  const isCompleted = challenge.completed;
  
  return (
    <div className={`
      relative overflow-hidden p-5 rounded-2xl border transition-all
      ${isCompleted 
        ? 'bg-eco-50 dark:bg-eco-900/10 border-eco-200 dark:border-eco-800/50' 
        : 'bg-white dark:bg-surface-900 border-slate-200 dark:border-slate-800 shadow-sm'
      }
    `}>
      {isCompleted && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-eco-500/10 dark:bg-eco-500/20 rounded-bl-full flex justify-end items-start p-2">
          <CheckCircle className="w-5 h-5 text-eco-500" />
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-surface-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
          {challenge.icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1" title={challenge.title}>{challenge.title}</h3>
          <p className="text-sm text-eco-600 dark:text-eco-400 font-medium">+{challenge.rewardPoints} pts</p>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 min-h-[40px]">
        {challenge.description}
      </p>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>{challenge.current} {challenge.unit}</span>
          <span>{challenge.target} {challenge.unit}</span>
        </div>
        <Progress 
          value={challenge.current} 
          max={challenge.target} 
          variant={isCompleted ? 'eco' : 'ocean'} 
        />
      </div>

      {/* Demo button to force complete */}
      {!isCompleted && (
        <button 
          onClick={onTestComplete}
          className="mt-4 w-full py-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-surface-800 rounded-lg hover:bg-eco-100 hover:text-eco-700 dark:hover:bg-eco-900/30 dark:hover:text-eco-400 transition-colors"
        >
          Simulate Completion
        </button>
      )}
    </div>
  );
}

function BadgeItem({ badge }: { badge: Badge }) {
  const isEarned = badge.earned;
  
  const rarityColors = {
    common: 'text-slate-400 border-slate-200 dark:border-slate-800',
    rare: 'text-blue-400 border-blue-200 dark:border-blue-900/50',
    epic: 'text-purple-400 border-purple-200 dark:border-purple-900/50',
    legendary: 'text-amber-400 border-amber-200 dark:border-amber-900/50',
  };

  return (
    <div className={`
      flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 relative group
      ${isEarned 
        ? 'bg-white dark:bg-surface-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1' 
        : 'bg-slate-50/50 dark:bg-surface-800/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60 grayscale'
      }
    `}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner bg-slate-50 dark:bg-surface-800 border-2 ${isEarned ? rarityColors[badge.rarity] : 'border-transparent'}`}>
        {isEarned ? badge.icon : <Lock className="w-6 h-6 text-slate-400" />}
      </div>
      <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">{badge.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-2">{badge.description}</p>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none shadow-xl">
        <p className="font-semibold mb-1">{badge.title}</p>
        <p className="text-slate-300">{badge.requirement}</p>
        <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          {badge.rarity}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
