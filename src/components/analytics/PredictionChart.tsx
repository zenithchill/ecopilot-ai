'use client';

import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PredictionDataPoint } from '@/types';

interface PredictionChartProps {
  data: PredictionDataPoint[];
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    // Only show actual line if it exists
    actualVal: d.actual !== undefined ? d.actual : null,
  }));

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-surface-900 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 min-w-[150px]">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                    
                    {payload.find(p => p.dataKey === 'actualVal') && (
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />Actual:</span>
                        <span className="font-semibold">{payload.find(p => p.dataKey === 'actualVal')?.value} kg</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-eco-500" />Predicted:</span>
                      <span className="font-semibold text-eco-600 dark:text-eco-400">{payload.find(p => p.dataKey === 'predicted')?.value} kg</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Range:</span>
                      <span>{payload.find(p => p.dataKey === 'lower')?.value} - {payload.find(p => p.dataKey === 'upper')?.value} kg</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Confidence interval band */}
          <Area 
            type="monotone" 
            dataKey="upper" 
            stroke="none" 
            fill="#34d399" 
            fillOpacity={0.1} 
          />
          <Area 
            type="monotone" 
            dataKey="lower" 
            stroke="none" 
            fill="var(--color-surface)" // Match background to "cut out" the bottom
            fillOpacity={1} 
          />
          {/* Actual line (if historical mixed in) */}
          <Line 
            type="monotone" 
            dataKey="actualVal" 
            stroke="currentColor" 
            className="text-slate-900 dark:text-white"
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6 }}
          />
          {/* Predicted line */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#10b981" 
            strokeWidth={3} 
            strokeDasharray="5 5"
            dot={false} 
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
