'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Insight } from '@/types';
import { AlertCircle, Lightbulb, Trophy, ArrowRight, X } from 'lucide-react';

interface InsightsProps {
  insights: Insight[];
  onDismiss?: (id: string) => void;
  onAction?: (insight: Insight) => void;
}

export const InsightsList: React.FC<InsightsProps> = ({ insights, onDismiss, onAction }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-surface-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <Lightbulb className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h4 className="text-slate-700 dark:text-slate-300 font-medium">No Insights Yet</h4>
        <p className="text-sm text-slate-500 mt-1">Log more activities to get personalized recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {insights.slice(0, 3).map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              relative p-5 rounded-2xl border overflow-hidden
              ${insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : ''}
              ${insight.type === 'recommendation' ? 'bg-ocean-50 dark:bg-ocean-900/10 border-ocean-200 dark:border-ocean-800/50' : ''}
              ${insight.type === 'achievement' ? 'bg-eco-50 dark:bg-eco-900/10 border-eco-200 dark:border-eco-800/50' : ''}
              ${insight.type === 'tip' ? 'bg-white dark:bg-surface-900 border-slate-200 dark:border-slate-800' : ''}
            `}
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {insight.type === 'warning' && <AlertCircle className="w-6 h-6 text-amber-500" />}
                {insight.type === 'recommendation' && <Lightbulb className="w-6 h-6 text-ocean-500" />}
                {insight.type === 'achievement' && <Trophy className="w-6 h-6 text-eco-500" />}
                {insight.type === 'tip' && <span className="text-2xl">{insight.icon}</span>}
              </div>
              
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold text-sm
                    ${insight.type === 'warning' ? 'text-amber-900 dark:text-amber-300' : ''}
                    ${insight.type === 'recommendation' ? 'text-ocean-900 dark:text-ocean-300' : ''}
                    ${insight.type === 'achievement' ? 'text-eco-900 dark:text-eco-300' : ''}
                    ${insight.type === 'tip' ? 'text-slate-900 dark:text-slate-100' : ''}
                  `}>
                    {insight.title}
                  </h4>
                  {insight.impactKg > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-slate-700 dark:text-slate-300">
                      -{Math.round(insight.impactKg)}kg CO₂
                    </span>
                  )}
                </div>
                
                <p className={`text-sm mb-3
                  ${insight.type === 'warning' ? 'text-amber-800 dark:text-amber-200/80' : ''}
                  ${insight.type === 'recommendation' ? 'text-ocean-800 dark:text-ocean-200/80' : ''}
                  ${insight.type === 'achievement' ? 'text-eco-800 dark:text-eco-200/80' : ''}
                  ${insight.type === 'tip' ? 'text-slate-600 dark:text-slate-400' : ''}
                `}>
                  {insight.message}
                </p>

                {insight.actionLabel && (
                  <button 
                    onClick={() => onAction && onAction(insight)}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white hover:underline decoration-2 underline-offset-2"
                  >
                    {insight.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {onDismiss && (
              <button 
                onClick={() => onDismiss(insight.id)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
