/* ============================================
   EcoPilot AI — Storage Layer
   localStorage + IndexedDB wrapper
   ============================================ */

import type { DailyLog } from '@/types';

const STORAGE_PREFIX = 'ecopilot_';

/** Safe localStorage get (SSR-compatible) */
export function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

/** Safe localStorage set */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

/** Remove a storage item */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PREFIX + key);
}

/** Clear all EcoPilot data */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/** Export all data as JSON for download */
export function exportAllData(): string {
  if (typeof window === 'undefined') return '{}';
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try { 
        data[key.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(key) ?? ''); 
      } catch { 
        data[key.replace(STORAGE_PREFIX, '')] = localStorage.getItem(key); 
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

/* ---- Sample Data Generator ---- */

/** Generate realistic sample data for demo purposes */
export function generateSampleData(): DailyLog[] {
  const logs: DailyLog[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const activities = [];
    const id = () => `${dateStr}-${Math.random().toString(36).slice(2, 8)}`;

    // Transport — commute on weekdays, leisure on weekends
    if (!isWeekend) {
      const transportType = Math.random() > 0.3 ? 'car_petrol' : 'bus';
      const km = 12 + Math.random() * 8;
      activities.push({
        id: id(), category: 'transport' as const, type: transportType, label: transportType === 'car_petrol' ? 'Drive to work' : 'Bus commute',
        amount: Math.round(km * 10) / 10, unit: 'km',
        carbonKg: Math.round(km * (transportType === 'car_petrol' ? 0.192 : 0.089) * 100) / 100,
        timestamp: new Date(date.setHours(8, 30)).toISOString(),
      });
    }

    // Food — 2-3 meals per day
    const meals = isWeekend ? 3 : 2;
    for (let m = 0; m < meals; m++) {
      const rand = Math.random();
      let type = 'vegetarian_meal', label = 'Vegetarian meal', factor = 0.86;
      if (rand < 0.25) { type = 'chicken_meal'; label = 'Chicken meal'; factor = 1.82; }
      else if (rand < 0.35) { type = 'beef_meal'; label = 'Beef meal'; factor = 6.61; }
      else if (rand < 0.5) { type = 'vegan_meal'; label = 'Vegan meal'; factor = 0.43; }
      activities.push({
        id: id(), category: 'food' as const, type, label, amount: 1, unit: 'serving',
        carbonKg: Math.round(factor * 100) / 100,
        timestamp: new Date(date.setHours(12 + m * 4, 0)).toISOString(),
      });
    }

    // Energy
    const kwh = 6 + Math.random() * 6 + (isWeekend ? 3 : 0);
    activities.push({
      id: id(), category: 'energy' as const, type: 'electricity', label: 'Home electricity',
      amount: Math.round(kwh * 10) / 10, unit: 'kWh',
      carbonKg: Math.round(kwh * 0.233 * 100) / 100,
      timestamp: new Date(date.setHours(20, 0)).toISOString(),
    });

    // Water (shower)
    const shower = 5 + Math.random() * 10;
    activities.push({
      id: id(), category: 'water' as const, type: 'shower', label: 'Shower',
      amount: Math.round(shower), unit: 'min',
      carbonKg: Math.round(shower * 0.042 * 100) / 100,
      timestamp: new Date(date.setHours(7, 0)).toISOString(),
    });

    // Occasional waste
    if (Math.random() > 0.5) {
      const wasteKg = 0.5 + Math.random() * 1.5;
      const isRecycling = Math.random() > 0.4;
      activities.push({
        id: id(), category: 'waste' as const,
        type: isRecycling ? 'recycling' : 'general_waste',
        label: isRecycling ? 'Recycling' : 'Trash',
        amount: Math.round(wasteKg * 10) / 10, unit: 'kg',
        carbonKg: Math.round(wasteKg * (isRecycling ? 0.021 : 0.587) * 100) / 100,
        timestamp: new Date(date.setHours(19, 0)).toISOString(),
      });
    }

    // Occasional shopping
    if (Math.random() > 0.85) {
      activities.push({
        id: id(), category: 'shopping' as const, type: 'online_order', label: 'Online order',
        amount: 1, unit: 'item', carbonKg: 0.5,
        timestamp: new Date(date.setHours(21, 0)).toISOString(),
      });
    }

    const totalCarbonKg = Math.round(activities.reduce((s, a) => s + a.carbonKg, 0) * 100) / 100;
    logs.push({ date: dateStr, activities, totalCarbonKg });
  }

  return logs;
}
