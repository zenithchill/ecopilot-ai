/* ============================================
   EcoPilot AI — Carbon Engine Tests
   ============================================ */

import { describe, it, expect } from 'vitest';
import {
  calculateActivityCarbon,
  calculateDailyFootprint,
  calculateWeeklyTotal,
  calculateMonthlyTotal,
  calculateCategoryBreakdown,
  identifyRiskAreas,
  calculateCarbonScore,
  getDailyTrend,
} from '@/lib/carbon-engine';
import { TRANSPORT_EMISSIONS, FOOD_EMISSIONS, ENERGY_EMISSIONS, SHOPPING_EMISSIONS, WASTE_EMISSIONS } from '@/lib/constants';
import type { Activity, DailyLog, LifestyleProfile } from '@/types';

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

describe('calculateActivityCarbon', () => {
  it('calculates transport emissions correctly', () => {
    const result = calculateActivityCarbon('transport', 'car_petrol', 10);
    expect(result).toBeCloseTo(10 * TRANSPORT_EMISSIONS.car_petrol);
  });

  it('returns 0 for zero-emission transport', () => {
    expect(calculateActivityCarbon('transport', 'bicycle', 100)).toBe(0);
    expect(calculateActivityCarbon('transport', 'walking', 50)).toBe(0);
  });

  it('calculates food emissions correctly', () => {
    const result = calculateActivityCarbon('food', 'beef_meal', 1);
    expect(result).toBeCloseTo(FOOD_EMISSIONS.beef_meal);
  });

  it('calculates energy emissions correctly', () => {
    const result = calculateActivityCarbon('energy', 'electricity', 10);
    expect(result).toBeCloseTo(10 * ENERGY_EMISSIONS.electricity_kwh);
  });

  it('calculates shopping emissions correctly', () => {
    const result = calculateActivityCarbon('shopping', 'clothing_item', 1);
    expect(result).toBeCloseTo(SHOPPING_EMISSIONS.clothing_item);
  });

  it('calculates waste emissions with _kg suffix', () => {
    const result = calculateActivityCarbon('waste', 'general_waste_kg', 1);
    expect(result).toBeCloseTo(WASTE_EMISSIONS.general_waste_kg);
  });

  it('calculates waste emissions without _kg suffix', () => {
    const result = calculateActivityCarbon('waste', 'general_waste', 1);
    expect(result).toBeCloseTo(WASTE_EMISSIONS.general_waste_kg);
  });

  it('calculates water/shower emissions', () => {
    const result = calculateActivityCarbon('water', 'shower', 10);
    expect(result).toBeCloseTo(10 * ENERGY_EMISSIONS.shower_minute);
  });

  it('calculates water/liter emissions', () => {
    const result = calculateActivityCarbon('water', 'water_usage', 100);
    expect(result).toBeCloseTo(100 * ENERGY_EMISSIONS.water_liter);
  });

  it('returns 0 for unknown category', () => {
    expect(calculateActivityCarbon('unknown' as import('@/types').ActivityCategory, 'test', 10)).toBe(0);
  });

  it('returns 0 for unknown type within valid category', () => {
    expect(calculateActivityCarbon('transport', 'spaceship', 10)).toBe(0);
  });

  it('handles zero amount', () => {
    expect(calculateActivityCarbon('transport', 'car_petrol', 0)).toBe(0);
  });
});

describe('calculateDailyFootprint', () => {
  it('sums up carbon from all activities', () => {
    const activities = [
      createActivity({ carbonKg: 1.5 }),
      createActivity({ carbonKg: 2.5 }),
      createActivity({ carbonKg: 0.3 }),
    ];
    expect(calculateDailyFootprint(activities)).toBeCloseTo(4.3);
  });

  it('returns 0 for empty activities', () => {
    expect(calculateDailyFootprint([])).toBe(0);
  });
});

describe('calculateWeeklyTotal', () => {
  it('sums logs from the last 7 days', () => {
    const logs = [
      createDailyLog(getDateStr(1), [createActivity({ carbonKg: 5 })]),
      createDailyLog(getDateStr(3), [createActivity({ carbonKg: 3 })]),
      createDailyLog(getDateStr(10), [createActivity({ carbonKg: 100 })]), // outside 7-day window
    ];
    expect(calculateWeeklyTotal(logs)).toBeCloseTo(8);
  });

  it('returns 0 for empty logs', () => {
    expect(calculateWeeklyTotal([])).toBe(0);
  });
});

describe('calculateMonthlyTotal', () => {
  it('sums logs from the last 30 days', () => {
    const logs = [
      createDailyLog(getDateStr(1), [createActivity({ carbonKg: 5 })]),
      createDailyLog(getDateStr(15), [createActivity({ carbonKg: 10 })]),
      createDailyLog(getDateStr(45), [createActivity({ carbonKg: 100 })]), // outside 30-day window
    ];
    expect(calculateMonthlyTotal(logs)).toBeCloseTo(15);
  });
});

describe('calculateCategoryBreakdown', () => {
  it('returns breakdown sorted by carbonKg descending', () => {
    const logs = [
      createDailyLog(getDateStr(1), [
        createActivity({ category: 'transport', carbonKg: 10 }),
        createActivity({ category: 'food', carbonKg: 5 }),
        createActivity({ category: 'energy', carbonKg: 3 }),
      ]),
    ];
    const breakdown = calculateCategoryBreakdown(logs, 30);
    expect(breakdown[0].category).toBe('transport');
    expect(breakdown[0].carbonKg).toBeGreaterThan(breakdown[1].carbonKg);
  });

  it('calculates percentages correctly', () => {
    const logs = [
      createDailyLog(getDateStr(1), [
        createActivity({ category: 'transport', carbonKg: 50 }),
        createActivity({ category: 'food', carbonKg: 50 }),
      ]),
    ];
    const breakdown = calculateCategoryBreakdown(logs, 30);
    const transport = breakdown.find(b => b.category === 'transport');
    const food = breakdown.find(b => b.category === 'food');
    expect(transport?.percentage).toBe(50);
    expect(food?.percentage).toBe(50);
  });

  it('handles empty logs', () => {
    const breakdown = calculateCategoryBreakdown([], 30);
    expect(breakdown).toHaveLength(6); // all 6 categories returned
    breakdown.forEach(b => {
      expect(b.carbonKg).toBe(0);
      expect(b.percentage).toBe(0);
    });
  });

  it('assigns correct colors to categories', () => {
    const logs = [
      createDailyLog(getDateStr(1), [
        createActivity({ category: 'transport', carbonKg: 1 }),
      ]),
    ];
    const breakdown = calculateCategoryBreakdown(logs, 30);
    const transport = breakdown.find(b => b.category === 'transport');
    expect(transport?.color).toBe('#3b82f6');
  });
});

describe('identifyRiskAreas', () => {
  it('flags high percentage categories', () => {
    const breakdown = [
      { category: 'transport' as const, carbonKg: 50, percentage: 45, trend: 'stable' as const, color: '#3b82f6' },
      { category: 'food' as const, carbonKg: 20, percentage: 20, trend: 'stable' as const, color: '#10b981' },
    ];
    const risks = identifyRiskAreas(breakdown, defaultProfile);
    const highRisk = risks.find(r => r.category === 'transport' && r.severity === 'high');
    expect(highRisk).toBeDefined();
    expect(highRisk!.potentialSavingKg).toBeGreaterThan(0);
  });

  it('flags rising medium categories', () => {
    const breakdown = [
      { category: 'food' as const, carbonKg: 30, percentage: 30, trend: 'up' as const, color: '#10b981' },
    ];
    const risks = identifyRiskAreas(breakdown, defaultProfile);
    const mediumRisk = risks.find(r => r.category === 'food' && r.severity === 'medium');
    expect(mediumRisk).toBeDefined();
  });

  it('flags long car commutes', () => {
    const profile = { ...defaultProfile, primaryTransport: 'car' as const, dailyCommuteKm: 30 };
    const risks = identifyRiskAreas([], profile);
    const commuteRisk = risks.find(r => r.message.includes('commute'));
    expect(commuteRisk).toBeDefined();
  });

  it('flags high meat consumption', () => {
    const profile = { ...defaultProfile, meatMealsPerWeek: 14 };
    const risks = identifyRiskAreas([], profile);
    const meatRisk = risks.find(r => r.message.includes('meat'));
    expect(meatRisk).toBeDefined();
  });

  it('sorts by severity (high first)', () => {
    const breakdown = [
      { category: 'transport' as const, carbonKg: 50, percentage: 45, trend: 'stable' as const, color: '#3b82f6' },
      { category: 'food' as const, carbonKg: 30, percentage: 30, trend: 'up' as const, color: '#10b981' },
    ];
    const profile = { ...defaultProfile, meatMealsPerWeek: 14 };
    const risks = identifyRiskAreas(breakdown, profile);
    if (risks.length >= 2) {
      expect(risks[0].severity === 'high' || risks[0].severity === 'medium').toBe(true);
    }
  });
});

describe('calculateCarbonScore', () => {
  it('returns a score between 0 and 100', () => {
    const score = calculateCarbonScore([], defaultProfile, 'world');
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it('returns a valid grade', () => {
    const validGrades = ['A+', 'A', 'B', 'C', 'D', 'F'];
    const score = calculateCarbonScore([], defaultProfile, 'world');
    expect(validGrades).toContain(score.grade);
  });

  it('applies renewable energy bonus', () => {
    const baseScore = calculateCarbonScore([], defaultProfile, 'world');
    const ecoProfile = { ...defaultProfile, hasRenewableEnergy: true };
    const ecoScore = calculateCarbonScore([], ecoProfile, 'world');
    expect(ecoScore.score).toBeGreaterThanOrEqual(baseScore.score);
  });

  it('applies vegan diet bonus', () => {
    const baseScore = calculateCarbonScore([], defaultProfile, 'world');
    const veganProfile = { ...defaultProfile, dietType: 'vegan' as const };
    const veganScore = calculateCarbonScore([], veganProfile, 'world');
    expect(veganScore.score).toBeGreaterThanOrEqual(baseScore.score);
  });

  it('applies green transport bonus', () => {
    const baseScore = calculateCarbonScore([], defaultProfile, 'world');
    const bikeProfile = { ...defaultProfile, primaryTransport: 'bicycle' as const };
    const bikeScore = calculateCarbonScore([], bikeProfile, 'world');
    expect(bikeScore.score).toBeGreaterThanOrEqual(baseScore.score);
  });

  it('provides breakdown array', () => {
    const score = calculateCarbonScore([], defaultProfile, 'world');
    expect(Array.isArray(score.breakdown)).toBe(true);
  });

  it('provides risk areas array', () => {
    const score = calculateCarbonScore([], defaultProfile, 'world');
    expect(Array.isArray(score.riskAreas)).toBe(true);
  });

  it('calculates improvement forecast', () => {
    const score = calculateCarbonScore([], defaultProfile, 'world');
    expect(score.improvementForecast).toBeGreaterThanOrEqual(score.score);
  });

  it('uses national average when country provided', () => {
    const scoreUS = calculateCarbonScore([], defaultProfile, 'usa');
    const scoreIN = calculateCarbonScore([], defaultProfile, 'india');
    // US has higher national avg, so same profile should score differently
    expect(scoreUS.nationalAverageKg).not.toBe(scoreIN.nationalAverageKg);
  });
});

describe('getDailyTrend', () => {
  it('returns correct number of entries', () => {
    const trend = getDailyTrend([], 7);
    expect(trend).toHaveLength(7);
  });

  it('fills gaps with 0', () => {
    const trend = getDailyTrend([], 7);
    trend.forEach(t => {
      expect(t.total).toBe(0);
    });
  });

  it('populates data from existing logs', () => {
    const today = getDateStr(0);
    const logs: DailyLog[] = [
      createDailyLog(today, [createActivity({ carbonKg: 5 })]),
    ];
    const trend = getDailyTrend(logs, 7);
    const todayEntry = trend.find(t => t.date === today);
    expect(todayEntry?.total).toBe(5);
  });

  it('returns dates sorted chronologically', () => {
    const trend = getDailyTrend([], 7);
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i].date >= trend[i - 1].date).toBe(true);
    }
  });
});
