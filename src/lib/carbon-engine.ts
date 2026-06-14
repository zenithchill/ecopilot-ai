/* ============================================
   EcoPilot AI — Carbon Calculation Engine
   ============================================ */

import {
  TRANSPORT_EMISSIONS, FOOD_EMISSIONS, ENERGY_EMISSIONS,
  SHOPPING_EMISSIONS, WASTE_EMISSIONS, NATIONAL_AVERAGES, SCORE_GRADES,
} from './constants';
import type {
  Activity, ActivityCategory, DailyLog, CarbonScore,
  CategoryBreakdown, RiskArea, LifestyleProfile,
} from '@/types';
import { clamp } from './utils';

/** Calculate CO₂ emissions for a single activity */
export function calculateActivityCarbon(category: ActivityCategory, type: string, amount: number): number {
  switch (category) {
    case 'transport': return amount * (TRANSPORT_EMISSIONS[type] ?? 0);
    case 'food': return amount * (FOOD_EMISSIONS[type] ?? 0);
    case 'energy': {
      const factors: Record<string, number> = {
        electricity: ENERGY_EMISSIONS.electricity_kwh,
        natural_gas: ENERGY_EMISSIONS.natural_gas_kwh,
        heating_oil: ENERGY_EMISSIONS.heating_oil_kwh,
        wood: ENERGY_EMISSIONS.wood_kwh,
        heat_pump: ENERGY_EMISSIONS.heat_pump_kwh,
        solar: ENERGY_EMISSIONS.solar_kwh,
      };
      return amount * (factors[type] ?? 0);
    }
    case 'shopping': return amount * (SHOPPING_EMISSIONS[type] ?? 0);
    case 'waste': {
      const key = type.endsWith('_kg') ? type : `${type}_kg`;
      return amount * (WASTE_EMISSIONS[key] ?? WASTE_EMISSIONS.general_waste_kg);
    }
    case 'water':
      if (type === 'shower') return amount * ENERGY_EMISSIONS.shower_minute;
      return amount * ENERGY_EMISSIONS.water_liter;
    default: return 0;
  }
}

/** Calculate total daily carbon footprint */
export function calculateDailyFootprint(activities: Activity[]): number {
  return activities.reduce((total, act) => total + act.carbonKg, 0);
}

/** Aggregate daily logs into weekly totals */
export function calculateWeeklyTotal(logs: DailyLog[]): number {
  const d = new Date(); d.setDate(d.getDate() - 7);
  const cutoff = d.toISOString().split('T')[0];
  return logs.filter(l => l.date >= cutoff).reduce((t, l) => t + l.totalCarbonKg, 0);
}

/** Aggregate daily logs into monthly totals */
export function calculateMonthlyTotal(logs: DailyLog[]): number {
  const d = new Date(); d.setDate(d.getDate() - 30);
  const cutoff = d.toISOString().split('T')[0];
  return logs.filter(l => l.date >= cutoff).reduce((t, l) => t + l.totalCarbonKg, 0);
}

/** Calculate category breakdown from recent logs */
export function calculateCategoryBreakdown(logs: DailyLog[], days: number = 30): CategoryBreakdown[] {
  const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];
  const recentLogs = logs.filter(l => l.date >= cutoff);
  const halfPoint = new Date(); halfPoint.setDate(halfPoint.getDate() - Math.floor(days / 2));
  const halfCutoff = halfPoint.toISOString().split('T')[0];
  const categories: ActivityCategory[] = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];
  const colors: Record<string, string> = { transport: '#3b82f6', energy: '#f59e0b', food: '#10b981', shopping: '#8b5cf6', waste: '#ef4444', water: '#06b6d4' };
  const totalCarbon = recentLogs.reduce((s, l) => s + l.totalCarbonKg, 0);

  return categories.map(cat => {
    const catCarbon = recentLogs.reduce((s, l) => s + l.activities.filter(a => a.category === cat).reduce((s2, a) => s2 + a.carbonKg, 0), 0);
    const firstHalf = recentLogs.filter(l => l.date < halfCutoff).reduce((s, l) => s + l.activities.filter(a => a.category === cat).reduce((s2, a) => s2 + a.carbonKg, 0), 0);
    const secondHalf = recentLogs.filter(l => l.date >= halfCutoff).reduce((s, l) => s + l.activities.filter(a => a.category === cat).reduce((s2, a) => s2 + a.carbonKg, 0), 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (firstHalf > 0) { const c = ((secondHalf - firstHalf) / firstHalf) * 100; if (c > 10) trend = 'up'; else if (c < -10) trend = 'down'; }
    return { category: cat, carbonKg: Math.round(catCarbon * 100) / 100, percentage: totalCarbon > 0 ? Math.round((catCarbon / totalCarbon) * 100) : 0, trend, color: colors[cat] };
  }).sort((a, b) => b.carbonKg - a.carbonKg);
}

/** Identify risk areas */
export function identifyRiskAreas(breakdown: CategoryBreakdown[], profile: LifestyleProfile): RiskArea[] {
  const risks: RiskArea[] = [];
  for (const cat of breakdown) {
    if (cat.percentage > 40) risks.push({ category: cat.category, severity: 'high', message: `${cat.category} accounts for ${cat.percentage}% of your emissions`, potentialSavingKg: cat.carbonKg * 0.3 });
    else if (cat.percentage > 25 && cat.trend === 'up') risks.push({ category: cat.category, severity: 'medium', message: `${cat.category} emissions are rising`, potentialSavingKg: cat.carbonKg * 0.2 });
  }
  if (profile.primaryTransport === 'car' && profile.dailyCommuteKm > 20) risks.push({ category: 'transport', severity: 'medium', message: 'Long car commute is a significant source', potentialSavingKg: profile.dailyCommuteKm * 0.192 * 20 * 0.5 });
  if (profile.meatMealsPerWeek > 7) risks.push({ category: 'food', severity: 'medium', message: 'High meat consumption increases food footprint', potentialSavingKg: (profile.meatMealsPerWeek - 3) * 4 * 4.3 });
  return risks.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.severity] - ({ high: 0, medium: 1, low: 2 })[b.severity]);
}

/** Estimate daily carbon from lifestyle profile (no activity logs) */
function estimateDailyFromProfile(profile: LifestyleProfile): number {
  let daily = 0;
  const tKey = profile.primaryTransport === 'car' ? `car_${profile.carType ?? 'petrol'}` : profile.primaryTransport === 'public_transit' ? 'bus' : profile.primaryTransport;
  daily += profile.dailyCommuteKm * (TRANSPORT_EMISSIONS[tKey] ?? 0);
  const meatPerDay = profile.meatMealsPerWeek / 7;
  daily += meatPerDay * (FOOD_EMISSIONS.chicken_meal + FOOD_EMISSIONS.beef_meal) / 2;
  const vegFactor = profile.dietType === 'vegan' ? FOOD_EMISSIONS.vegan_meal : FOOD_EMISSIONS.vegetarian_meal;
  daily += (3 - meatPerDay) * vegFactor;
  daily += (profile.electricityKwhPerMonth / 30) * ENERGY_EMISSIONS.electricity_kwh;
  if (profile.hasRenewableEnergy) daily *= 0.7;
  const wf = { low: 100, average: 150, high: 250 }[profile.waterUsage] ?? 150;
  daily += wf * ENERGY_EMISSIONS.water_liter;
  daily += ({ minimal: 0.5, moderate: 1.5, frequent: 3.0, excessive: 5.0 })[profile.shoppingFrequency] ?? 1.5;
  daily += ({ always: 0.3, usually: 0.5, sometimes: 0.8, rarely: 1.2, never: 1.5 })[profile.recyclingHabit] ?? 0.8;
  return daily;
}

/** Calculate overall sustainability score (0–100) */
export function calculateCarbonScore(logs: DailyLog[], profile: LifestyleProfile, country: string = 'world'): CarbonScore {
  const breakdown = calculateCategoryBreakdown(logs, 30);
  const monthlyTotal = calculateMonthlyTotal(logs);
  const weeklyTotal = calculateWeeklyTotal(logs);
  const daysWithData = logs.length;
  const dailyAverage = daysWithData > 0 ? monthlyTotal / Math.min(daysWithData, 30) : estimateDailyFromProfile(profile);
  const yearlyProjection = dailyAverage * 365;
  const nationalAvg = NATIONAL_AVERAGES[country] ?? NATIONAL_AVERAGES.world;
  const ratio = yearlyProjection / nationalAvg;
  let score = clamp(Math.round(100 - (ratio * 50)), 0, 100);
  if (profile.hasRenewableEnergy) score = Math.min(100, score + 5);
  if (profile.dietType === 'vegan') score = Math.min(100, score + 5);
  else if (profile.dietType === 'vegetarian') score = Math.min(100, score + 3);
  if (['bicycle', 'walking', 'public_transit'].includes(profile.primaryTransport)) score = Math.min(100, score + 3);
  if (profile.recyclingHabit === 'always') score = Math.min(100, score + 2);
  let grade: CarbonScore['grade'] = 'F';
  for (const [g, config] of Object.entries(SCORE_GRADES)) { if (score >= config.min) { grade = g as CarbonScore['grade']; break; } }
  const riskAreas = identifyRiskAreas(breakdown, profile);
  return { score, grade, dailyAverageKg: Math.round(dailyAverage * 100) / 100, weeklyTotalKg: Math.round(weeklyTotal * 100) / 100, monthlyTotalKg: Math.round(monthlyTotal * 100) / 100, yearlyProjectionKg: Math.round(yearlyProjection), nationalAverageKg: nationalAvg, comparisonPercent: Math.round(((nationalAvg - yearlyProjection) / nationalAvg) * 100), breakdown, riskAreas, improvementForecast: Math.min(100, Math.round(score + score * 0.08)) };
}

/** Get daily trend data for the last N days */
export function getDailyTrend(logs: DailyLog[], days: number = 30): Array<{ date: string; total: number }> {
  const result: Array<{ date: string; total: number }> = [];
  const logMap = new Map(logs.map(l => [l.date, l.totalCarbonKg]));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    result.push({ date: ds, total: logMap.get(ds) ?? 0 });
  }
  return result;
}
