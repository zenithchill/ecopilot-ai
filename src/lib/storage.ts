/* ============================================
   EcoPilot AI — Storage Layer
   localStorage + IndexedDB wrapper
   ============================================ */

import type { DailyLog, Activity } from '@/types';
import { generateId } from './utils';

// ---- Constants ----
const STORAGE_PREFIX = 'ecopilot_';
const DEMO_DAYS_COUNT = 30;
const COMMUTE_KM_MIN = 12;
const COMMUTE_KM_VARIANCE = 8;
const WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

/**
 * Safely retrieve an item from localStorage, resilient to SSR environments
 * and malformed JSON parsing errors.
 *
 * @param key      - The storage key (prefix is automatically appended)
 * @param fallback - Default value returned if the key doesn't exist or parsing fails
 * @returns The parsed object or fallback
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely store an item in localStorage, handling SSR environments and
 * potential quota-exceeded errors.
 *
 * @param key   - The storage key (prefix is automatically appended)
 * @param value - The data payload to serialize and store
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.warn('EcoPilot Storage write failed (Quota Exceeded?):', error);
  }
}

/**
 * Safely remove an item from localStorage.
 *
 * @param key - The storage key to remove
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Clear all data associated with the EcoPilot application, leaving
 * other applications' localStorage data intact.
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Export all EcoPilot user data as a formatted JSON string.
 * Used for data portability (Download Data feature).
 *
 * @returns Pretty-printed JSON string of all app data
 */
export function exportAllData(): string {
  if (typeof window === 'undefined') return '{}';

  const data: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const bareKey = key.replace(STORAGE_PREFIX, '');
      const rawValue = localStorage.getItem(key) ?? '';

      try {
        data[bareKey] = JSON.parse(rawValue);
      } catch {
        data[bareKey] = rawValue;
      }
    }
  }

  return JSON.stringify(data, null, 2);
}

/* ============================================
   Sample Data Generator (For Hackathon Demo)
   ============================================ */

/** Helper: check if a Date is a weekend */
function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.includes(date.getDay());
}

/** Helper: Generate mock transport activity */
function mockTransportActivity(date: Date, _dateStr: string): Activity {
  const isCar = Math.random() > 0.3;
  const transportType = isCar ? 'car_petrol' : 'bus';
  const km = COMMUTE_KM_MIN + Math.random() * COMMUTE_KM_VARIANCE;
  const carbonFactor = isCar ? 0.192 : 0.089;

  const activityTime = new Date(date);
  activityTime.setHours(8, 30);

  return {
    id: generateId(),
    category: 'transport',
    type: transportType,
    label: isCar ? 'Drive to work' : 'Bus commute',
    amount: Math.round(km * 10) / 10,
    unit: 'km',
    carbonKg: Math.round(km * carbonFactor * 100) / 100,
    timestamp: activityTime.toISOString(),
  };
}

/** Helper: Generate mock food activity */
function mockFoodActivity(date: Date, mealIndex: number): Activity {
  const rand = Math.random();
  let type = 'vegetarian_meal';
  let label = 'Vegetarian meal';
  let factor = 0.86;

  if (rand < 0.25) {
    type = 'chicken_meal'; label = 'Chicken meal'; factor = 1.82;
  } else if (rand < 0.35) {
    type = 'beef_meal'; label = 'Beef meal'; factor = 6.61;
  } else if (rand < 0.5) {
    type = 'vegan_meal'; label = 'Vegan meal'; factor = 0.43;
  }

  const activityTime = new Date(date);
  activityTime.setHours(12 + mealIndex * 4, 0);

  return {
    id: generateId(),
    category: 'food',
    type,
    label,
    amount: 1,
    unit: 'serving',
    carbonKg: Math.round(factor * 100) / 100,
    timestamp: activityTime.toISOString(),
  };
}

/**
 * Generate 30 days of realistic sample activity data for demonstration purposes.
 * Simulates weekend/weekday behavioral differences.
 *
 * @returns Array of fully populated DailyLog objects
 */
export function generateSampleData(): DailyLog[] {
  const logs: DailyLog[] = [];
  const now = new Date();

  for (let i = DEMO_DAYS_COUNT - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const weekend = isWeekend(date);
    const activities: Activity[] = [];

    // 1. Transport (weekdays mostly)
    if (!weekend) {
      activities.push(mockTransportActivity(date, dateStr));
    }

    // 2. Food (2 meals weekday, 3 meals weekend)
    const mealsCount = weekend ? 3 : 2;
    for (let m = 0; m < mealsCount; m++) {
      activities.push(mockFoodActivity(date, m));
    }

    // 3. Energy (higher on weekends)
    const kwh = 6 + Math.random() * 6 + (weekend ? 3 : 0);
    const energyTime = new Date(date);
    energyTime.setHours(20, 0);
    activities.push({
      id: generateId(),
      category: 'energy',
      type: 'electricity',
      label: 'Home electricity',
      amount: Math.round(kwh * 10) / 10,
      unit: 'kWh',
      carbonKg: Math.round(kwh * 0.233 * 100) / 100,
      timestamp: energyTime.toISOString(),
    });

    // 4. Water
    const showerMins = 5 + Math.random() * 10;
    const waterTime = new Date(date);
    waterTime.setHours(7, 0);
    activities.push({
      id: generateId(),
      category: 'water',
      type: 'shower',
      label: 'Shower',
      amount: Math.round(showerMins),
      unit: 'min',
      carbonKg: Math.round(showerMins * 0.042 * 100) / 100,
      timestamp: waterTime.toISOString(),
    });

    // 5. Waste (intermittent)
    if (Math.random() > 0.5) {
      const wasteKg = 0.5 + Math.random() * 1.5;
      const isRecycling = Math.random() > 0.4;
      const wasteTime = new Date(date);
      wasteTime.setHours(19, 0);
      activities.push({
        id: generateId(),
        category: 'waste',
        type: isRecycling ? 'recycling' : 'general_waste',
        label: isRecycling ? 'Recycling' : 'Trash',
        amount: Math.round(wasteKg * 10) / 10,
        unit: 'kg',
        carbonKg: Math.round(wasteKg * (isRecycling ? 0.021 : 0.587) * 100) / 100,
        timestamp: wasteTime.toISOString(),
      });
    }

    // 6. Shopping (rare)
    if (Math.random() > 0.85) {
      const shopTime = new Date(date);
      shopTime.setHours(21, 0);
      activities.push({
        id: generateId(),
        category: 'shopping',
        type: 'online_order',
        label: 'Online order',
        amount: 1,
        unit: 'item',
        carbonKg: 0.5,
        timestamp: shopTime.toISOString(),
      });
    }

    // Sum totals and commit log
    const totalCarbonKg = Math.round(activities.reduce((sum, act) => sum + act.carbonKg, 0) * 100) / 100;
    logs.push({ date: dateStr, activities, totalCarbonKg });
  }

  return logs;
}
