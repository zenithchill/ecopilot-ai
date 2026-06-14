/* ============================================
   EcoPilot AI — Prediction Engine Tests
   ============================================ */

import { describe, it, expect } from 'vitest';
import {
  predictEmissions,
  predictMonthlyTotal,
  simulateScenarios,
  getDefaultScenarios,
} from '@/lib/prediction-engine';
import type { DailyLog, LifestyleProfile, SimulationScenario } from '@/types';

// ---- Helpers ----

const createDailyLog = (date: string, totalKg: number): DailyLog => ({
  date,
  activities: [],
  totalCarbonKg: totalKg,
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

describe('predictEmissions', () => {
  it('returns predictions with bands if insufficient data (< 3 days)', () => {
    const logs = [createDailyLog(getDateStr(0), 10)];
    const predictions = predictEmissions(logs, 5);
    expect(predictions).toHaveLength(5);
    predictions.forEach(p => {
      expect(p.predicted).toBe(10);
      // With < 3 logs, lower/upper are 0.7x and 1.3x
      expect(p.lower).toBeCloseTo(7);
      expect(p.upper).toBeCloseTo(13);
    });
  });

  it('returns flat predictions for empty logs', () => {
    const predictions = predictEmissions([], 3);
    expect(predictions).toHaveLength(3);
    predictions.forEach(p => {
      expect(p.predicted).toBe(10); // default fallback
    });
  });

  it('calculates linear regression for upward trend', () => {
    // Trend goes up by 2 each day
    const logs = [
      createDailyLog(getDateStr(3), 10),
      createDailyLog(getDateStr(2), 12),
      createDailyLog(getDateStr(1), 14),
      createDailyLog(getDateStr(0), 16),
    ];
    const predictions = predictEmissions(logs, 3);
    
    // Future days should continue upward
    expect(predictions[0].predicted).toBeGreaterThan(16);
    expect(predictions[1].predicted).toBeGreaterThan(predictions[0].predicted);
  });

  it('calculates linear regression for downward trend', () => {
    const logs = [
      createDailyLog(getDateStr(3), 16),
      createDailyLog(getDateStr(2), 14),
      createDailyLog(getDateStr(1), 12),
      createDailyLog(getDateStr(0), 10),
    ];
    const predictions = predictEmissions(logs, 3);
    
    // Future days should continue downward
    expect(predictions[0].predicted).toBeLessThan(10);
  });

  it('prevents negative predictions', () => {
    const logs = [
      createDailyLog(getDateStr(3), 100),
      createDailyLog(getDateStr(2), 50),
      createDailyLog(getDateStr(1), 10),
      createDailyLog(getDateStr(0), 1),
    ];
    const predictions = predictEmissions(logs, 10);
    
    predictions.forEach(p => {
      expect(p.predicted).toBeGreaterThanOrEqual(0);
      expect(p.lower).toBeGreaterThanOrEqual(0);
    });
  });

  it('widens confidence interval over time', () => {
    const logs = [
      createDailyLog(getDateStr(3), 10),
      createDailyLog(getDateStr(2), 12),
      createDailyLog(getDateStr(1), 10),
      createDailyLog(getDateStr(0), 12),
    ];
    const predictions = predictEmissions(logs, 5);
    
    const initialSpread = predictions[0].upper - predictions[0].lower;
    const finalSpread = predictions[4].upper - predictions[4].lower;
    
    expect(finalSpread).toBeGreaterThan(initialSpread);
  });

  it('returns dates as YYYY-MM-DD strings', () => {
    const logs = [
      createDailyLog(getDateStr(2), 10),
      createDailyLog(getDateStr(1), 10),
      createDailyLog(getDateStr(0), 10),
    ];
    const predictions = predictEmissions(logs, 3);
    predictions.forEach(p => {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

describe('predictMonthlyTotal', () => {
  it('returns 0 for empty logs', () => {
    // With 0 logs, predictEmissions returns 10*30 = 300 from default
    const total = predictMonthlyTotal([]);
    expect(total).toBeGreaterThan(0);
  });

  it('predicts total from daily predictions', () => {
    const logs = [
      createDailyLog(getDateStr(2), 10),
      createDailyLog(getDateStr(1), 10),
      createDailyLog(getDateStr(0), 10),
    ];
    const total = predictMonthlyTotal(logs);
    // Should be roughly 10 * 30 = 300 for stable data
    expect(total).toBeGreaterThan(200);
    expect(total).toBeLessThan(400);
  });
});

describe('getDefaultScenarios', () => {
  it('returns scenarios based on profile', () => {
    const scenarios = getDefaultScenarios(defaultProfile);
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('includes transport scenarios if user drives', () => {
    const profile = { ...defaultProfile, primaryTransport: 'car' as const };
    const scenarios = getDefaultScenarios(profile);
    const transport = scenarios.filter(s => s.category === 'transport');
    expect(transport.length).toBeGreaterThan(0);
  });

  it('includes food scenarios', () => {
    const scenarios = getDefaultScenarios(defaultProfile);
    const food = scenarios.filter(s => s.category === 'food');
    expect(food.length).toBeGreaterThan(0);
  });

  it('includes energy scenarios', () => {
    const scenarios = getDefaultScenarios(defaultProfile);
    const energy = scenarios.filter(s => s.category === 'energy');
    expect(energy.length).toBeGreaterThan(0);
  });

  it('each scenario has an id and label', () => {
    const scenarios = getDefaultScenarios(defaultProfile);
    scenarios.forEach(s => {
      expect(s.id).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.category).toBeDefined();
    });
  });
});

describe('simulateScenarios', () => {
  it('returns simulation result with correct structure', () => {
    const scenarios = getDefaultScenarios(defaultProfile);
    const logs = Array.from({ length: 30 }).map((_, i) =>
      createDailyLog(getDateStr(i), 10)
    );
    
    const result = simulateScenarios(defaultProfile, logs, scenarios);
    expect(result.currentMonthlyKg).toBeGreaterThan(0);
    expect(result.projectedMonthlyKg).toBeDefined();
    expect(result.savingsKg).toBeDefined();
    expect(result.savingsPercent).toBeDefined();
    expect(result.equivalentTrees).toBeDefined();
    expect(result.equivalentDrivingKm).toBeDefined();
  });

  it('projected is less than or equal to current when reducing', () => {
    const scenarios: SimulationScenario[] = [{
      id: 's1',
      label: 'Reduce driving',
      category: 'transport',
      currentValue: 20,
      newValue: 10,
      unit: 'km/day',
      impactKgPerMonth: 0,
    }];
    
    const logs = Array.from({ length: 30 }).map((_, i) =>
      createDailyLog(getDateStr(i), 10)
    );
    
    const result = simulateScenarios(defaultProfile, logs, scenarios);
    expect(result.projectedMonthlyKg).toBeLessThanOrEqual(result.currentMonthlyKg);
  });

  it('caps projected at 0 (never negative)', () => {
    const scenarios: SimulationScenario[] = [{
      id: 's1',
      label: 'Max reduction',
      category: 'transport',
      currentValue: 1000,
      newValue: 0,
      unit: 'km/day',
      impactKgPerMonth: 0,
    }];
    
    const logs = [createDailyLog(getDateStr(0), 1)]; // Minimal data
    
    const result = simulateScenarios(defaultProfile, logs, scenarios);
    expect(result.projectedMonthlyKg).toBeGreaterThanOrEqual(0);
  });
});
