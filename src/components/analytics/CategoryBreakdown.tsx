'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { CategoryBreakdown } from '@/types';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface CategoryBreakdownChartProps {
  breakdown: CategoryBreakdown[];
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ breakdown }) => {
  // Filter out zero values for the chart
  const data = breakdown.filter(cat => cat.carbonKg > 0);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-surface-800/30">
        <p className="text-slate-400">No category data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[300px] gap-6">
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="carbonKg"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-surface-900 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{data.category}</p>
                        <p className="text-xs text-slate-500">{data.carbonKg} kg ({data.percentage}%)</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        {data.map((item) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {CATEGORY_CONFIG[item.category]?.icon} {item.category}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.percentage}%</span>
              <p className="text-xs text-slate-500">{item.carbonKg} kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
