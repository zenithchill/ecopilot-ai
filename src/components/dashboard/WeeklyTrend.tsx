'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DailyLog } from '@/types';
import { getDailyTrend } from '@/lib/carbon-engine';

interface WeeklyTrendProps {
  logs: DailyLog[];
}

export const WeeklyTrend: React.FC<WeeklyTrendProps> = ({ logs }) => {
  const trendData = getDailyTrend(logs, 7).map(d => {
    const dateObj = new Date(d.date);
    return {
      name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      total: d.total,
      date: d.date,
    };
  });

  const avgTotal = trendData.reduce((s, d) => s + d.total, 0) / 7;

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Trend</h3>
          <p className="text-sm text-slate-500">Last 7 days carbon emissions (kg CO₂)</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {Math.round(avgTotal * 7 * 10) / 10}
            <span className="text-sm font-normal text-slate-500 ml-1">kg</span>
          </p>
          <p className="text-xs text-slate-500">Total this week</p>
        </div>
      </div>

      <div className="flex-1 min-h-[150px] mt-auto">
        {trendData.every(d => d.total === 0) ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">No data logged this week</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900/90 backdrop-blur text-white p-2 rounded-lg text-xs shadow-xl border border-slate-700">
                        <p className="font-semibold mb-1">{payload[0].payload.name}</p>
                        <p>{payload[0].value} kg CO₂</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 4, 4]} maxBarSize={40}>
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.total > avgTotal * 1.5 ? '#ef4444' : entry.total > 0 ? '#10b981' : '#e2e8f0'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
