'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { QUICK_LOG_ACTIVITIES } from '@/lib/constants';
import { useActivityStore } from '@/stores/activity-store';
import { useGamificationStore } from '@/stores/gamification-store';

export const QuickLog: React.FC = () => {
  const { addActivity, logs } = useActivityStore();
  const { addPoints, updateStreak, checkBadgeEligibility } = useGamificationStore();
  const [loggedIds, setLoggedIds] = useState<Record<string, boolean>>({});

  const handleQuickLog = (activity: typeof QUICK_LOG_ACTIVITIES[0]) => {
    // Prevent double logging accidentally
    if (loggedIds[activity.id]) return;

    addActivity(
      activity.category,
      activity.type,
      activity.label,
      activity.defaultAmount,
      activity.unit
    );

    // Gamification
    addPoints(10);
    updateStreak();
    checkBadgeEligibility(logs.reduce((sum, l) => sum + l.activities.length, 0) + 1, 0);

    // UI Feedback
    setLoggedIds(prev => ({ ...prev, [activity.id]: true }));
    setTimeout(() => {
      setLoggedIds(prev => ({ ...prev, [activity.id]: false }));
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Log</h3>
        <span className="text-xs text-eco-600 dark:text-eco-400 font-medium bg-eco-50 dark:bg-eco-900/20 px-2 py-1 rounded-full">
          +10 pts
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_LOG_ACTIVITIES.slice(0, 6).map((activity) => {
          const isLogged = loggedIds[activity.id];
          
          return (
            <button
              key={activity.id}
              onClick={() => handleQuickLog(activity)}
              disabled={isLogged}
              className={`
                relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300
                ${isLogged 
                  ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-eco-300 dark:hover:border-eco-700 hover:bg-slate-50 dark:hover:bg-surface-800'
                }
              `}
            >
              <div className="flex justify-between w-full mb-2">
                <span className="text-xl">{activity.icon}</span>
                <AnimatePresence mode="wait">
                  {isLogged ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-5 h-5 rounded-full bg-eco-500 text-white flex items-center justify-center"
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-eco-500 group-hover:border-eco-500"
                    >
                      <Plus className="w-3 h-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-sm font-medium ${isLogged ? 'text-eco-700 dark:text-eco-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {activity.label}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {activity.defaultAmount} {activity.unit}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
