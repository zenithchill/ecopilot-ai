'use client';

import React, { useMemo } from 'react';
import { CarbonScoreRing } from '@/components/dashboard/CarbonScore';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { WeeklyTrend } from '@/components/dashboard/WeeklyTrend';
import { InsightsList } from '@/components/dashboard/Insights';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { useUserStore } from '@/stores/user-store';
import { useActivityStore } from '@/stores/activity-store';
import { calculateCarbonScore } from '@/lib/carbon-engine';
import { generateInsights } from '@/lib/insights-engine';
import { getGreeting } from '@/lib/utils';
import { ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { logs, loadSampleData, clearAllLogs } = useActivityStore();

  // Compute derived state
  const score = useMemo(() => {
    if (!profile) return null;
    return calculateCarbonScore(logs, profile.lifestyle);
  }, [logs, profile]);

  const insights = useMemo(() => {
    if (!profile) return [];
    return generateInsights(logs, profile.lifestyle);
  }, [logs, profile]);

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {getGreeting()}, {profile.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here&apos;s your sustainability summary for today.
          </p>
        </div>
        
        {/* Development Helper Tools - Hidden in production normally, but good for demo */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadSampleData}>
            Load Sample Data
          </Button>
          <Button variant="danger" size="sm" onClick={clearAllLogs}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Score & Quick Log) */}
        <div className="lg:col-span-4 space-y-6">
          <CarbonScoreRing score={score} />
          <StreakCard />
        </div>

        {/* Right Column (Trend & Quick Log) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <QuickLog />
          <div className="flex-1">
            <WeeklyTrend logs={logs} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">EcoPilot Insights</h2>
            <Link href="/assistant" className="text-sm font-medium text-eco-600 dark:text-eco-400 hover:text-eco-700 flex items-center gap-1">
              Ask AI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <InsightsList insights={insights} />
        </div>

        {/* Category Breakdown Mini */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Monthly Breakdown</h2>
            <Link href="/analytics" className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
              Full Report <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            {score?.breakdown.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data to show yet.</p>
            ) : (
              <div className="space-y-4">
                {score?.breakdown.slice(0, 4).map(cat => (
                  <div key={cat.category} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                      {cat.category === 'transport' ? '🚗' : cat.category === 'food' ? '🍽️' : cat.category === 'energy' ? '⚡' : '🛍️'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="capitalize text-slate-700 dark:text-slate-300">{cat.category}</span>
                        <span className="text-slate-900 dark:text-white">{cat.percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs text-slate-500">
                      {Math.round(cat.carbonKg)} kg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
