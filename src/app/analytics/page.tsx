'use client';

import React, { useState, useMemo } from 'react';
import { useActivityStore } from '@/stores/activity-store';
import { useUserStore } from '@/stores/user-store';
import { EmissionChart } from '@/components/analytics/EmissionChart';
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdown';
import { PredictionChart } from '@/components/analytics/PredictionChart';
import { calculateCategoryBreakdown, calculateCarbonScore, getDailyTrend } from '@/lib/carbon-engine';
import { predictEmissions } from '@/lib/prediction-engine';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AnalyticsPage() {
  const { logs } = useActivityStore();
  const { profile } = useUserStore();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const days = parseInt(period);
  
  const breakdown = useMemo(() => calculateCategoryBreakdown(logs, days), [logs, days]);
  
  const score = useMemo(() => {
    if (!profile) return null;
    return calculateCarbonScore(logs, profile.lifestyle);
  }, [logs, profile]);

  const predictions = useMemo(() => {
    // Generate historical data points
    const historical = getDailyTrend(logs, 14).map(d => ({
      date: d.date,
      actual: d.total,
      predicted: d.total, // For seamless line connection
      lower: d.total,
      upper: d.total,
    }));
    
    // Generate future predictions
    const future = predictEmissions(logs, 14);
    
    // Connect them
    if (historical.length > 0 && future.length > 0) {
      const lastHist = historical[historical.length - 1];
      future[0].actual = lastHist.actual; 
    }
    
    return [...historical, ...future];
  }, [logs]);

  const totalEmissions = logs.slice(-days).reduce((sum, log) => sum + log.totalCarbonKg, 0);

  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ecopilot_export_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Deep dive into your carbon footprint data.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-surface-800 p-1 rounded-xl">
            {(['7', '30', '90'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === p 
                    ? 'bg-white dark:bg-surface-900 text-eco-600 dark:text-eco-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={handleExport} title="Export Data">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Emissions" 
          value={`${Math.round(totalEmissions)}`} 
          unit="kg CO₂"
          subtitle={`Last ${days} days`}
          icon={<TrendingUp className="w-5 h-5 text-eco-500" />}
        />
        <StatCard 
          title="Daily Average" 
          value={`${Math.round((totalEmissions / days) * 10) / 10}`} 
          unit="kg CO₂/day"
          subtitle={`Last ${days} days`}
          icon={<Calendar className="w-5 h-5 text-ocean-500" />}
        />
        <StatCard 
          title="Yearly Projection" 
          value={`${score?.yearlyProjectionKg || 0}`} 
          unit="kg CO₂/yr"
          subtitle="Based on current habits"
          icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
        />
        <StatCard 
          title="Top Source" 
          value={`${breakdown[0]?.category || 'N/A'}`} 
          unit=""
          subtitle={`${breakdown[0]?.percentage || 0}% of total`}
          icon={<span className="text-xl">{breakdown[0]?.category === 'transport' ? '🚗' : breakdown[0]?.category === 'food' ? '🍽️' : breakdown[0]?.category === 'energy' ? '⚡' : '🛍️'}</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emission Trend Chart */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Emissions Over Time</h3>
          <div className="flex-1">
            <EmissionChart logs={logs} days={days} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Category Breakdown</h3>
          <div className="flex-1">
            <CategoryBreakdownChart breakdown={breakdown} />
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col min-h-[400px]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            AI Emission Forecast <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400">Beta</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">Predictive model forecasting your emissions for the next 14 days based on your historical patterns.</p>
        </div>
        <div className="flex-1">
          <PredictionChart data={predictions} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, subtitle, icon }: any) {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-surface-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-display font-bold text-slate-900 dark:text-white capitalize">{value}</span>
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
