/* ============================================
   EcoPilot AI — Prediction Engine
   Trend forecasting & "what-if" simulations
   ============================================ */

import type { DailyLog, SimulationResult, SimulationScenario, PredictionDataPoint, LifestyleProfile } from '@/types';
import { calculateActivityCarbon, calculateMonthlyTotal } from './carbon-engine';
import { generateId } from './utils';

/**
 * Simple linear regression for trend prediction.
 * Returns slope (daily change rate) and intercept.
 */
function linearRegression(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of data) {
    sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope: isFinite(slope) ? slope : 0, intercept: isFinite(intercept) ? intercept : 0 };
}

/** Predict future daily emissions for the next N days */
export function predictEmissions(logs: DailyLog[], futureDays: number = 30): PredictionDataPoint[] {
  const results: PredictionDataPoint[] = [];
  if (logs.length < 3) {
    // Not enough data — return flat prediction based on last known value
    const lastValue = logs.length > 0 ? logs[logs.length - 1].totalCarbonKg : 10;
    for (let i = 0; i < futureDays; i++) {
      const d = new Date(); d.setDate(d.getDate() + i + 1);
      results.push({ date: d.toISOString().split('T')[0], predicted: lastValue, lower: lastValue * 0.7, upper: lastValue * 1.3 });
    }
    return results;
  }

  // Use last 30 days for regression
  const recent = logs.slice(-30);
  const data = recent.map((l, i) => ({ x: i, y: l.totalCarbonKg }));
  const { slope, intercept } = linearRegression(data);

  // Calculate standard deviation for confidence bands
  const predicted = data.map(d => intercept + slope * d.x);
  const residuals = data.map((d, i) => d.y - predicted[i]);
  const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);

  const lastX = data.length - 1;
  for (let i = 1; i <= futureDays; i++) {
    const x = lastX + i;
    const pred = Math.max(0, intercept + slope * x);
    const uncertainty = stdDev * Math.sqrt(1 + i / data.length); // Growing uncertainty
    const d = new Date(); d.setDate(d.getDate() + i);
    results.push({
      date: d.toISOString().split('T')[0],
      predicted: Math.round(pred * 100) / 100,
      lower: Math.max(0, Math.round((pred - 1.96 * uncertainty) * 100) / 100),
      upper: Math.round((pred + 1.96 * uncertainty) * 100) / 100,
    });
  }

  return results;
}

/** Calculate monthly predicted total from prediction data */
export function predictMonthlyTotal(logs: DailyLog[]): number {
  const predictions = predictEmissions(logs, 30);
  return predictions.reduce((s, p) => s + p.predicted, 0);
}

/** Simulate "what-if" scenarios */
export function simulateScenarios(profile: LifestyleProfile, logs: DailyLog[], scenarios: SimulationScenario[]): SimulationResult {
  const currentMonthly = calculateMonthlyTotal(logs) || estimateMonthlyFromProfile(profile);
  let projectedMonthly = currentMonthly;

  for (const scenario of scenarios) {
    const currentDailyImpact = calculateActivityCarbon(scenario.category, getTypeForCategory(scenario.category, profile), scenario.currentValue);
    const newDailyImpact = calculateActivityCarbon(scenario.category, getTypeForCategory(scenario.category, profile), scenario.newValue);
    const dailySaving = currentDailyImpact - newDailyImpact;
    scenario.impactKgPerMonth = Math.round(dailySaving * 30 * 100) / 100;
    projectedMonthly -= scenario.impactKgPerMonth;
  }

  projectedMonthly = Math.max(0, projectedMonthly);
  const savingsKg = currentMonthly - projectedMonthly;
  const savingsPercent = currentMonthly > 0 ? (savingsKg / currentMonthly) * 100 : 0;

  return {
    currentMonthlyKg: Math.round(currentMonthly * 100) / 100,
    projectedMonthlyKg: Math.round(projectedMonthly * 100) / 100,
    savingsKg: Math.round(savingsKg * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
    equivalentTrees: Math.round(savingsKg * 12 / 22 * 10) / 10, // annual trees
    equivalentDrivingKm: Math.round(savingsKg * 5.2),
    scenarios,
  };
}

/** Get default simulation scenarios based on user profile */
export function getDefaultScenarios(profile: LifestyleProfile): SimulationScenario[] {
  const scenarios: SimulationScenario[] = [];

  if (profile.primaryTransport === 'car') {
    scenarios.push({ id: generateId(), label: 'Switch to public transit', category: 'transport', currentValue: profile.dailyCommuteKm, newValue: profile.dailyCommuteKm, unit: 'km/day (by bus instead)', impactKgPerMonth: 0 });
    scenarios.push({ id: generateId(), label: 'Reduce driving distance', category: 'transport', currentValue: profile.dailyCommuteKm, newValue: Math.round(profile.dailyCommuteKm * 0.5), unit: 'km/day', impactKgPerMonth: 0 });
  }

  scenarios.push({ id: generateId(), label: 'Reduce meat meals', category: 'food', currentValue: profile.meatMealsPerWeek, newValue: Math.max(0, profile.meatMealsPerWeek - 3), unit: 'meals/week', impactKgPerMonth: 0 });
  scenarios.push({ id: generateId(), label: 'Go vegetarian', category: 'food', currentValue: profile.meatMealsPerWeek, newValue: 0, unit: 'meals/week', impactKgPerMonth: 0 });
  scenarios.push({ id: generateId(), label: 'Reduce electricity', category: 'energy', currentValue: profile.electricityKwhPerMonth, newValue: Math.round(profile.electricityKwhPerMonth * 0.8), unit: 'kWh/month', impactKgPerMonth: 0 });
  scenarios.push({ id: generateId(), label: 'Switch to renewable energy', category: 'energy', currentValue: profile.electricityKwhPerMonth, newValue: Math.round(profile.electricityKwhPerMonth * 0.1), unit: 'kWh/month (net)', impactKgPerMonth: 0 });

  return scenarios;
}

/** Helper: estimate monthly total from profile */
function estimateMonthlyFromProfile(profile: LifestyleProfile): number {
  let daily = 0;
  const tKey = profile.primaryTransport === 'car' ? 'car_petrol' : 'bus';
  daily += calculateActivityCarbon('transport', tKey, profile.dailyCommuteKm);
  daily += calculateActivityCarbon('food', 'chicken_meal', profile.meatMealsPerWeek / 7);
  daily += calculateActivityCarbon('food', 'vegetarian_meal', 3 - profile.meatMealsPerWeek / 7);
  daily += calculateActivityCarbon('energy', 'electricity', profile.electricityKwhPerMonth / 30);
  return daily * 30;
}

/** Helper: get emission type key for a given category */
function getTypeForCategory(category: string, profile: LifestyleProfile): string {
  switch (category) {
    case 'transport': return profile.primaryTransport === 'car' ? `car_${profile.carType ?? 'petrol'}` : 'bus';
    case 'food': return 'chicken_meal';
    case 'energy': return 'electricity';
    default: return 'general_waste';
  }
}
