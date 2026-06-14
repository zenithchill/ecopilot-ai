/* ============================================
   EcoPilot AI — Insights Engine Tests
   ============================================ */

import { describe, it, expect } from 'vitest';
import {
  generateInsights,
  detectPatterns,
  rankByImpact,
  generateNotifications,
} from '@/lib/insights-engine';
import type { Activity, DailyLog, LifestyleProfile, Insight } from '@/types';

// ---- Helpers ----

const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'test-1',
  category: 'transport',
  type: 'car_petrol',
  label: 'Drive',
  amount: 10,
  unit: 'km',
  carbonKg: 1.92,
  timestamp: new Date().toISOString(),
  ...overrides,
});

const createDailyLog = (date: string, activities: Activity[] = []): DailyLog => ({
  date,
  activities,
  totalCarbonKg: activities.reduce((s, a) => s + a.carbonKg, 0),
});

const getDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const defaultProfile: LifestyleProfile = {
  primaryTransport: 'car',
  dailyCommuteKm: 15,
  carType: 'petrol',
  flightsPerYear: 2,
  dietType: 'omnivore',
  meatMealsPerWeek: 7,
  localFoodPercentage: 30,
  homeType: 'apartment',
  electricityKwhPerMonth: 250,
  heatingSource: 'natural_gas',
  hasRenewableEnergy: false,
  hasSolarPanels: false,
  shoppingFrequency: 'moderate',
  recyclingHabit: 'sometimes',
  waterUsage: 'average',
};

// ---- Tests ----

describe('detectPatterns', () => {
  it('returns empty array for insufficient data', () => {
    const result = detectPatterns([]);
    expect(result).toEqual([]);
    expect(detectPatterns([createDailyLog(getDateStr(0))])).toEqual([]);
  });

  it('detects daily_habit pattern for frequent activities', () => {
    // Generate 14 days of transport logs (each day multiple activities)
    const logs = Array.from({ length: 14 }).map((_, i) =>
      createDailyLog(getDateStr(i), [
        createActivity({ category: 'transport', carbonKg: 5 }),
        createActivity({ category: 'transport', carbonKg: 3 }),
      ])
    );
    const patterns = detectPatterns(logs);
    const transportPattern = patterns.find(p => p.category === 'transport');
    expect(transportPattern).toBeDefined();
  });

  it('detects frequent_high_emission pattern', () => {
    // Create logs where some activities have way higher carbon than average
    const logs = Array.from({ length: 14 }).map((_, i) => {
      const carbon = i % 2 === 0 ? 50 : 2; // alternating high/low to trigger avg check
      return createDailyLog(getDateStr(i), [
        createActivity({ category: 'food', carbonKg: carbon }),
      ]);
    });
    const patterns = detectPatterns(logs);
    const foodPattern = patterns.find(p => p.category === 'food' && p.pattern === 'frequent_high_emission');
    expect(foodPattern).toBeDefined();
  });
});

describe('generateInsights', () => {
  it('returns start tracking insight for empty logs', () => {
    const insights = generateInsights([], defaultProfile);
    expect(insights.length).toBe(1);
    expect(insights[0].title).toBe('Start Tracking');
  });

  it('generates transport insight for car commuters with logs', () => {
    const profile = { ...defaultProfile, primaryTransport: 'car' as const, dailyCommuteKm: 15 };
    // Need at least some logs to get past the empty check
    const logs = Array.from({ length: 14 }).map((_, i) =>
      createDailyLog(getDateStr(i), [
        createActivity({ category: 'transport', carbonKg: 3 }),
      ])
    );
    const insights = generateInsights(logs, profile);
    const transportInsight = insights.find(i => i.category === 'transport');
    expect(transportInsight).toBeDefined();
  });

  it('generates food insight for high meat diet', () => {
    const profile = { ...defaultProfile, meatMealsPerWeek: 10 };
    const logs = [createDailyLog(getDateStr(0), [createActivity({ carbonKg: 1 })])];
    const insights = generateInsights(logs, profile);
    const foodInsight = insights.find(i => i.category === 'food');
    expect(foodInsight).toBeDefined();
  });

  it('generates energy insight for high usage non-renewable users', () => {
    const profile = { ...defaultProfile, hasRenewableEnergy: false, electricityKwhPerMonth: 400 };
    const logs = [createDailyLog(getDateStr(0), [createActivity({ carbonKg: 1 })])];
    const insights = generateInsights(logs, profile);
    const energyInsight = insights.find(i => i.category === 'energy');
    expect(energyInsight).toBeDefined();
  });

  it('generates recycling tip for non-always recyclers', () => {
    const profile = { ...defaultProfile, recyclingHabit: 'sometimes' as const };
    const logs = [createDailyLog(getDateStr(0), [createActivity({ carbonKg: 1 })])];
    const insights = generateInsights(logs, profile);
    const recyclingTip = insights.find(i => i.category === 'waste');
    expect(recyclingTip).toBeDefined();
  });

  it('returns insights sorted by impact', () => {
    const profile = { ...defaultProfile, meatMealsPerWeek: 14, primaryTransport: 'car' as const, dailyCommuteKm: 20 };
    const logs = Array.from({ length: 14 }).map((_, i) =>
      createDailyLog(getDateStr(i), [createActivity({ carbonKg: 5 })])
    );
    const insights = generateInsights(logs, profile);
    expect(insights.length).toBeGreaterThan(0);
    // First insight should be higher priority
    if (insights.length >= 2) {
      const priorityScore: Record<string, number> = { high: 0, medium: 1, low: 2 };
      expect(priorityScore[insights[0].priority]).toBeLessThanOrEqual(priorityScore[insights[1].priority]);
    }
  });
});

describe('rankByImpact', () => {
  it('ranks higher priority items first', () => {
    const insights: Insight[] = [
      { id: '1', type: 'tip', priority: 'low', category: 'waste', title: 'A', message: '', impactKg: 50, effort: 'easy', cost: 'free', icon: '' },
      { id: '2', type: 'warning', priority: 'high', category: 'transport', title: 'B', message: '', impactKg: 10, effort: 'moderate', cost: 'free', icon: '' },
    ];
    const ranked = rankByImpact(insights);
    expect(ranked[0].id).toBe('2'); // high priority first
  });

  it('factors in impact/effort ratio for same priority', () => {
    const insights: Insight[] = [
      { id: '1', type: 'recommendation', priority: 'medium', category: 'food', title: 'A', message: '', impactKg: 10, effort: 'hard', cost: 'free', icon: '' },
      { id: '2', type: 'recommendation', priority: 'medium', category: 'transport', title: 'B', message: '', impactKg: 10, effort: 'easy', cost: 'free', icon: '' },
    ];
    const ranked = rankByImpact(insights);
    expect(ranked[0].id).toBe('2'); // easier effort = better ratio
  });

  it('returns empty array for empty input', () => {
    expect(rankByImpact([])).toEqual([]);
  });
});

describe('generateNotifications', () => {
  it('generates welcome notification for new users', () => {
    const notifications = generateNotifications([], defaultProfile);
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toMatch(/Welcome/i);
  });

  it('detects emission spikes', () => {
    const logs = [
      createDailyLog(getDateStr(1), [createActivity({ carbonKg: 5 })]),
      createDailyLog(getDateStr(0), [createActivity({ carbonKg: 50 })]), // 10x spike
    ];
    const notifications = generateNotifications(logs, defaultProfile);
    const spikeNotif = notifications.find(n => n.title.includes('Spike'));
    expect(spikeNotif).toBeDefined();
  });

  it('detects lower emissions', () => {
    const logs = [
      createDailyLog(getDateStr(1), [createActivity({ carbonKg: 50 })]),
      createDailyLog(getDateStr(0), [createActivity({ carbonKg: 10 })]), // significant drop
    ];
    const notifications = generateNotifications(logs, defaultProfile);
    const positiveNotif = notifications.find(n => n.title.includes('Lower'));
    expect(positiveNotif).toBeDefined();
  });

  it('generates milestone notification at 7 days', () => {
    const logs = Array.from({ length: 7 }).map((_, i) =>
      createDailyLog(getDateStr(i), [createActivity({ carbonKg: 5 })])
    );
    const notifications = generateNotifications(logs, defaultProfile);
    const milestone = notifications.find(n => n.title.includes('Week'));
    expect(milestone).toBeDefined();
  });
});
