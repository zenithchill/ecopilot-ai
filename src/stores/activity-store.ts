/* ============================================
   EcoPilot AI — Activity Store (Zustand)
   ============================================ */
'use client';

import { create } from 'zustand';
import type { Activity, DailyLog, ActivityCategory } from '@/types';
import { getStorageItem, setStorageItem, generateSampleData } from '@/lib/storage';
import { calculateActivityCarbon } from '@/lib/carbon-engine';
import { generateId, getToday } from '@/lib/utils';

interface ActivityState {
  logs: DailyLog[];
  isHydrated: boolean;
  // Actions
  hydrate: () => void;
  addActivity: (category: ActivityCategory, type: string, label: string, amount: number, unit: string, notes?: string) => void;
  removeActivity: (date: string, activityId: string) => void;
  loadSampleData: () => void;
  clearAllLogs: () => void;
  getTodayLog: () => DailyLog | undefined;
  getRecentLogs: (days: number) => DailyLog[];
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  logs: [],
  isHydrated: false,

  hydrate: () => {
    const stored = getStorageItem<DailyLog[]>('activity_logs', []);
    set({ logs: stored, isHydrated: true });
  },

  addActivity: (category, type, label, amount, unit, notes) => {
    const carbonKg = calculateActivityCarbon(category, type, amount);
    const activity: Activity = {
      id: generateId(),
      category,
      type,
      label,
      amount,
      unit,
      carbonKg: Math.round(carbonKg * 1000) / 1000,
      timestamp: new Date().toISOString(),
      notes,
    };

    const today = getToday();
    const logs = [...get().logs];
    const todayIndex = logs.findIndex(l => l.date === today);

    if (todayIndex >= 0) {
      logs[todayIndex] = {
        ...logs[todayIndex],
        activities: [...logs[todayIndex].activities, activity],
        totalCarbonKg: Math.round((logs[todayIndex].totalCarbonKg + activity.carbonKg) * 1000) / 1000,
      };
    } else {
      logs.push({
        date: today,
        activities: [activity],
        totalCarbonKg: activity.carbonKg,
      });
    }

    // Sort by date
    logs.sort((a, b) => a.date.localeCompare(b.date));
    setStorageItem('activity_logs', logs);
    set({ logs });
  },

  removeActivity: (date, activityId) => {
    const logs = get().logs.map(log => {
      if (log.date !== date) return log;
      const activities = log.activities.filter(a => a.id !== activityId);
      return {
        ...log,
        activities,
        totalCarbonKg: Math.round(activities.reduce((s, a) => s + a.carbonKg, 0) * 1000) / 1000,
      };
    }).filter(log => log.activities.length > 0);
    setStorageItem('activity_logs', logs);
    set({ logs });
  },

  loadSampleData: () => {
    const sampleLogs = generateSampleData();
    setStorageItem('activity_logs', sampleLogs);
    set({ logs: sampleLogs });
  },

  clearAllLogs: () => {
    setStorageItem('activity_logs', []);
    set({ logs: [] });
  },

  getTodayLog: () => {
    return get().logs.find(l => l.date === getToday());
  },

  getRecentLogs: (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return get().logs.filter(l => l.date >= cutoffStr);
  },
}));
