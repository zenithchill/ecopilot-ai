'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { CarbonScore } from '@/types';
import { Leaf } from 'lucide-react';

interface CarbonScoreProps {
  score: CarbonScore | null;
}

export const CarbonScoreRing: React.FC<CarbonScoreProps> = ({ score }) => {
  const [mounted, setMounted] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (score) {
      // Animate score from 0 to value
      const timer = setTimeout(() => setCurrentScore(score.score), 100);
      return () => clearTimeout(timer);
    }
  }, [score]);

  if (!mounted || !score) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64 bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
        <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-surface-800" />
      </div>
    );
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Background glow based on grade */}
      <div 
        className="absolute inset-0 opacity-10 blur-2xl"
        style={{ backgroundColor: score.grade.startsWith('A') ? '#10b981' : score.grade.startsWith('B') ? '#34d399' : score.grade.startsWith('C') ? '#f59e0b' : '#ef4444' }}
      />
      
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 z-10">Carbon Score</h3>
      
      <div className="relative flex items-center justify-center mb-4 z-10">
        <svg className="transform -rotate-90 w-40 h-40">
          {/* Track */}
          <circle
            className="text-slate-100 dark:text-surface-800"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
          {/* Progress */}
          <motion.circle
            className="text-eco-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-display font-bold text-slate-900 dark:text-white">
            {Math.round(currentScore)}
          </span>
          <span className="text-sm font-bold mt-1" style={{ color: score.grade.startsWith('A') ? '#10b981' : score.grade.startsWith('B') ? '#34d399' : score.grade.startsWith('C') ? '#f59e0b' : '#ef4444' }}>
            Grade {score.grade}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm z-10">
        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Leaf className="w-4 h-4 text-eco-500" />
          {score.comparisonPercent > 0 ? (
            <span className="text-eco-600 dark:text-eco-400 font-medium">Top {Math.max(1, 50 - score.comparisonPercent / 2)}%</span>
          ) : (
            <span>Needs improvement</span>
          )}
        </span>
      </div>
    </div>
  );
};
