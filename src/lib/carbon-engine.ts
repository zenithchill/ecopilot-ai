/* ============================================
   EcoPilot AI — Carbon Calculation Engine
   ============================================
   Core engine for computing CO₂ emissions from
   daily activities. All emission factors are
   sourced from EPA, DEFRA, and IPCC AR6 data.
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

// ---- Named Constants (eliminate magic numbers) ----

/** Percentage threshold above which a category is flagged as "high" risk */
const HIGH_RISK_PERCENTAGE_THRESHOLD = 40;
/** Percentage threshold (with rising trend) for "medium" risk */
const MEDIUM_RISK_PERCENTAGE_THRESHOLD = 25;
/** Savings potential for high-risk categories (30%) */
const HIGH_RISK_SAVINGS_FACTOR = 0.3;
/** Savings potential for medium-risk categories (20%) */
const MEDIUM_RISK_SAVINGS_FACTOR = 0.2;
/** Threshold for long car commute in km */
const LONG_COMMUTE_KM_THRESHOLD = 20;
/** Threshold for high meat consumption in meals per week */
const HIGH_MEAT_MEALS_THRESHOLD = 7;
/** Target meat meals per week for reduction recommendation */
const TARGET_MEAT_MEALS_PER_WEEK = 3;
/** Weeks in a month (approximate) */
const WEEKS_PER_MONTH = 4.3;
/** Working days per month (approximate) */
const WORKING_DAYS_PER_MONTH = 20;
/** Renewable energy score bonus */
const RENEWABLE_ENERGY_BONUS = 5;
/** Vegan diet score bonus */
const VEGAN_DIET_BONUS = 5;
/** Vegetarian diet score bonus */
const VEGETARIAN_DIET_BONUS = 3;
/** Green transport score bonus */
const GREEN_TRANSPORT_BONUS = 3;
/** Recycling score bonus */
const RECYCLING_BONUS = 2;
/** Improvement forecast multiplier (8% projected improvement) */
const IMPROVEMENT_FORECAST_RATE = 0.08;
/** Trend threshold percentage for "up" / "down" classification */
const TREND_THRESHOLD_PERCENT = 10;
/** Renewable energy daily reduction factor */
const RENEWABLE_ENERGY_REDUCTION = 0.7;

/** All tracked activity categories */
const ALL_CATEGORIES: ActivityCategory[] = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];

/** Category display colors */
const CATEGORY_COLORS: Record<string, string> = {
  transport: '#3b82f6',
  energy: '#f59e0b',
  food: '#10b981',
  shopping: '#8b5cf6',
  waste: '#ef4444',
  water: '#06b6d4',
};

/** Green transport modes that earn a score bonus */
const GREEN_TRANSPORT_MODES = ['bicycle', 'walking', 'public_transit'];

// ---- Helper Functions ----

/**
 * Get a date string (YYYY-MM-DD) for N days ago from today.
 * @param daysAgo - Number of days to look back
 * @returns ISO date string (date portion only)
 */
function getDateCutoff(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Sum carbon emissions from activities matching a given category within a set of logs.
 */
function sumCarbonByCategory(logs: DailyLog[], category: ActivityCategory): number {
  return logs.reduce((total, log) => {
    const categoryTotal = log.activities
      .filter(activity => activity.category === category)
      .reduce((sum, activity) => sum + activity.carbonKg, 0);
    return total + categoryTotal;
  }, 0);
}

// ---- Core Calculation Functions ----

/**
 * Calculate CO₂ emissions for a single activity.
 *
 * Uses category-specific emission factor lookups from EPA/DEFRA/IPCC data.
 *
 * @param category - The activity category (e.g., 'transport', 'food')
 * @param type     - The specific type within that category (e.g., 'car_petrol')
 * @param amount   - The quantity in the category's standard unit
 * @returns CO₂ emissions in kilograms
 */
export function calculateActivityCarbon(category: ActivityCategory, type: string, amount: number): number {
  switch (category) {
    case 'transport':
      return amount * (TRANSPORT_EMISSIONS[type] ?? 0);

    case 'food':
      return amount * (FOOD_EMISSIONS[type] ?? 0);

    case 'energy': {
      const energyFactors: Record<string, number> = {
        electricity: ENERGY_EMISSIONS.electricity_kwh,
        natural_gas: ENERGY_EMISSIONS.natural_gas_kwh,
        heating_oil: ENERGY_EMISSIONS.heating_oil_kwh,
        wood: ENERGY_EMISSIONS.wood_kwh,
        heat_pump: ENERGY_EMISSIONS.heat_pump_kwh,
        solar: ENERGY_EMISSIONS.solar_kwh,
      };
      return amount * (energyFactors[type] ?? 0);
    }

    case 'shopping':
      return amount * (SHOPPING_EMISSIONS[type] ?? 0);

    case 'waste': {
      const normalizedKey = type.endsWith('_kg') ? type : `${type}_kg`;
      return amount * (WASTE_EMISSIONS[normalizedKey] ?? WASTE_EMISSIONS.general_waste_kg);
    }

    case 'water':
      if (type === 'shower') return amount * ENERGY_EMISSIONS.shower_minute;
      return amount * ENERGY_EMISSIONS.water_liter;

    default:
      return 0;
  }
}

/**
 * Calculate total daily carbon footprint from a list of activities.
 * @param activities - Array of activities for a single day
 * @returns Total CO₂ emissions in kilograms
 */
export function calculateDailyFootprint(activities: Activity[]): number {
  return activities.reduce((total, activity) => total + activity.carbonKg, 0);
}

/**
 * Aggregate daily logs into weekly totals for the last 7 days.
 * @param logs - Array of daily logs
 * @returns Total CO₂ emissions over the last 7 days in kilograms
 */
export function calculateWeeklyTotal(logs: DailyLog[]): number {
  const cutoff = getDateCutoff(7);
  return logs
    .filter(log => log.date >= cutoff)
    .reduce((total, log) => total + log.totalCarbonKg, 0);
}

/**
 * Aggregate daily logs into monthly totals for the last 30 days.
 * @param logs - Array of daily logs
 * @returns Total CO₂ emissions over the last 30 days in kilograms
 */
export function calculateMonthlyTotal(logs: DailyLog[]): number {
  const cutoff = getDateCutoff(30);
  return logs
    .filter(log => log.date >= cutoff)
    .reduce((total, log) => total + log.totalCarbonKg, 0);
}

/**
 * Calculate category breakdown and trend analysis from recent logs.
 *
 * Splits the analysis window in half to detect whether each category's
 * emissions are trending up, down, or stable.
 *
 * @param logs - Array of daily logs
 * @param days - Number of days to analyze (default: 30)
 * @returns Sorted array of category breakdowns with percentages and trends
 */
export function calculateCategoryBreakdown(logs: DailyLog[], days: number = 30): CategoryBreakdown[] {
  const cutoff = getDateCutoff(days);
  const recentLogs = logs.filter(log => log.date >= cutoff);

  const halfCutoff = getDateCutoff(Math.floor(days / 2));
  const totalCarbon = recentLogs.reduce((sum, log) => sum + log.totalCarbonKg, 0);

  return ALL_CATEGORIES.map(category => {
    const categoryCarbon = sumCarbonByCategory(recentLogs, category);

    // Split into first half / second half for trend detection
    const firstHalfLogs = recentLogs.filter(log => log.date < halfCutoff);
    const secondHalfLogs = recentLogs.filter(log => log.date >= halfCutoff);
    const firstHalfCarbon = sumCarbonByCategory(firstHalfLogs, category);
    const secondHalfCarbon = sumCarbonByCategory(secondHalfLogs, category);

    // Determine trend direction
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (firstHalfCarbon > 0) {
      const changePercent = ((secondHalfCarbon - firstHalfCarbon) / firstHalfCarbon) * 100;
      if (changePercent > TREND_THRESHOLD_PERCENT) trend = 'up';
      else if (changePercent < -TREND_THRESHOLD_PERCENT) trend = 'down';
    }

    return {
      category,
      carbonKg: Math.round(categoryCarbon * 100) / 100,
      percentage: totalCarbon > 0 ? Math.round((categoryCarbon / totalCarbon) * 100) : 0,
      trend,
      color: CATEGORY_COLORS[category],
    };
  }).sort((a, b) => b.carbonKg - a.carbonKg);
}

/**
 * Identify risk areas and potential savings based on category breakdown and user profile.
 *
 * Flags categories that dominate the user's footprint (>40%) or are rising (>25% and trending up),
 * and checks lifestyle-specific risk factors like long commutes and high meat consumption.
 *
 * @param breakdown - The calculated category breakdown
 * @param profile   - The user's lifestyle profile
 * @returns Array of identified risk areas sorted by severity (high → medium → low)
 */
export function identifyRiskAreas(breakdown: CategoryBreakdown[], profile: LifestyleProfile): RiskArea[] {
  const risks: RiskArea[] = [];
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Check each category for disproportionate emissions
  for (const category of breakdown) {
    if (category.percentage > HIGH_RISK_PERCENTAGE_THRESHOLD) {
      risks.push({
        category: category.category,
        severity: 'high',
        message: `${category.category} accounts for ${category.percentage}% of your emissions`,
        potentialSavingKg: category.carbonKg * HIGH_RISK_SAVINGS_FACTOR,
      });
    } else if (category.percentage > MEDIUM_RISK_PERCENTAGE_THRESHOLD && category.trend === 'up') {
      risks.push({
        category: category.category,
        severity: 'medium',
        message: `${category.category} emissions are rising`,
        potentialSavingKg: category.carbonKg * MEDIUM_RISK_SAVINGS_FACTOR,
      });
    }
  }

  // Lifestyle-specific risk: long car commute
  if (profile.primaryTransport === 'car' && profile.dailyCommuteKm > LONG_COMMUTE_KM_THRESHOLD) {
    const monthlySaving = profile.dailyCommuteKm * TRANSPORT_EMISSIONS.car_petrol * WORKING_DAYS_PER_MONTH * 0.5;
    risks.push({
      category: 'transport',
      severity: 'medium',
      message: 'Long car commute is a significant source',
      potentialSavingKg: monthlySaving,
    });
  }

  // Lifestyle-specific risk: high meat consumption
  if (profile.meatMealsPerWeek > HIGH_MEAT_MEALS_THRESHOLD) {
    const excessMeals = profile.meatMealsPerWeek - TARGET_MEAT_MEALS_PER_WEEK;
    const avgMeatEmission = (FOOD_EMISSIONS.beef_meal + FOOD_EMISSIONS.chicken_meal) / 2;
    const monthlySaving = excessMeals * avgMeatEmission * WEEKS_PER_MONTH;
    risks.push({
      category: 'food',
      severity: 'medium',
      message: 'High meat consumption increases food footprint',
      potentialSavingKg: monthlySaving,
    });
  }

  return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Estimate daily carbon footprint purely from a lifestyle profile.
 * Used as a fallback when no activity logs exist yet.
 *
 * @param profile - The user's lifestyle profile
 * @returns Estimated daily CO₂ emissions in kilograms
 */
function estimateDailyFromProfile(profile: LifestyleProfile): number {
  let dailyEstimate = 0;

  // Transport estimate
  const transportKey = profile.primaryTransport === 'car'
    ? `car_${profile.carType ?? 'petrol'}`
    : profile.primaryTransport === 'public_transit'
      ? 'bus'
      : profile.primaryTransport;
  dailyEstimate += profile.dailyCommuteKm * (TRANSPORT_EMISSIONS[transportKey] ?? 0);

  // Food estimate
  const meatMealsPerDay = profile.meatMealsPerWeek / 7;
  const avgMeatEmission = (FOOD_EMISSIONS.chicken_meal + FOOD_EMISSIONS.beef_meal) / 2;
  dailyEstimate += meatMealsPerDay * avgMeatEmission;

  const vegFactor = profile.dietType === 'vegan'
    ? FOOD_EMISSIONS.vegan_meal
    : FOOD_EMISSIONS.vegetarian_meal;
  const nonMeatMeals = Math.max(0, 3 - meatMealsPerDay);
  dailyEstimate += nonMeatMeals * vegFactor;

  // Energy estimate
  const dailyElectricity = profile.electricityKwhPerMonth / 30;
  dailyEstimate += dailyElectricity * ENERGY_EMISSIONS.electricity_kwh;

  // Renewable energy discount
  if (profile.hasRenewableEnergy) {
    dailyEstimate *= RENEWABLE_ENERGY_REDUCTION;
  }

  // Water estimate
  const waterLitersPerDay: Record<string, number> = { low: 100, average: 150, high: 250 };
  const waterUsage = waterLitersPerDay[profile.waterUsage] ?? 150;
  dailyEstimate += waterUsage * ENERGY_EMISSIONS.water_liter;

  // Shopping estimate
  const shoppingDaily: Record<string, number> = { minimal: 0.5, moderate: 1.5, frequent: 3.0, excessive: 5.0 };
  dailyEstimate += shoppingDaily[profile.shoppingFrequency] ?? 1.5;

  // Waste estimate (based on recycling habits)
  const wasteDaily: Record<string, number> = { always: 0.3, usually: 0.5, sometimes: 0.8, rarely: 1.2, never: 1.5 };
  dailyEstimate += wasteDaily[profile.recyclingHabit] ?? 0.8;

  return dailyEstimate;
}

/**
 * Calculate an overall sustainability score (0–100) and generate a comprehensive report.
 *
 * The score compares the user's projected yearly emissions against their country's
 * national average, then applies bonuses for sustainable lifestyle choices.
 *
 * @param logs    - Array of daily activity logs
 * @param profile - The user's lifestyle profile
 * @param country - ISO country code for national average comparison (default: 'world')
 * @returns A comprehensive CarbonScore report
 */
export function calculateCarbonScore(logs: DailyLog[], profile: LifestyleProfile, country: string = 'world'): CarbonScore {
  const breakdown = calculateCategoryBreakdown(logs, 30);
  const monthlyTotal = calculateMonthlyTotal(logs);
  const weeklyTotal = calculateWeeklyTotal(logs);

  // Calculate daily average
  const daysWithData = logs.length;
  const dailyAverage = daysWithData > 0
    ? monthlyTotal / Math.min(daysWithData, 30)
    : estimateDailyFromProfile(profile);
  const yearlyProjection = dailyAverage * 365;

  // Compare against national average
  const nationalAvg = NATIONAL_AVERAGES[country] ?? NATIONAL_AVERAGES.world;
  const ratio = yearlyProjection / nationalAvg;
  let score = clamp(Math.round(100 - (ratio * 50)), 0, 100);

  // Apply lifestyle bonuses
  if (profile.hasRenewableEnergy) score = Math.min(100, score + RENEWABLE_ENERGY_BONUS);
  if (profile.dietType === 'vegan') score = Math.min(100, score + VEGAN_DIET_BONUS);
  else if (profile.dietType === 'vegetarian') score = Math.min(100, score + VEGETARIAN_DIET_BONUS);
  if (GREEN_TRANSPORT_MODES.includes(profile.primaryTransport)) score = Math.min(100, score + GREEN_TRANSPORT_BONUS);
  if (profile.recyclingHabit === 'always') score = Math.min(100, score + RECYCLING_BONUS);

  // Determine letter grade
  let grade: CarbonScore['grade'] = 'F';
  for (const [gradeKey, config] of Object.entries(SCORE_GRADES)) {
    if (score >= config.min) {
      grade = gradeKey as CarbonScore['grade'];
      break;
    }
  }

  const riskAreas = identifyRiskAreas(breakdown, profile);

  return {
    score,
    grade,
    dailyAverageKg: Math.round(dailyAverage * 100) / 100,
    weeklyTotalKg: Math.round(weeklyTotal * 100) / 100,
    monthlyTotalKg: Math.round(monthlyTotal * 100) / 100,
    yearlyProjectionKg: Math.round(yearlyProjection),
    nationalAverageKg: nationalAvg,
    comparisonPercent: Math.round(((nationalAvg - yearlyProjection) / nationalAvg) * 100),
    breakdown,
    riskAreas,
    improvementForecast: Math.min(100, Math.round(score + score * IMPROVEMENT_FORECAST_RATE)),
  };
}

/**
 * Get daily trend data for the last N days, filling gaps with zero.
 *
 * Creates a continuous timeline even when some days have no logged activities.
 *
 * @param logs - Array of daily logs
 * @param days - Number of days to return (default: 30)
 * @returns Array of date/total pairs sorted chronologically
 */
export function getDailyTrend(logs: DailyLog[], days: number = 30): Array<{ date: string; total: number }> {
  const result: Array<{ date: string; total: number }> = [];
  const logMap = new Map(logs.map(log => [log.date, log.totalCarbonKg]));

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = getDateCutoff(i);
    result.push({ date: dateStr, total: logMap.get(dateStr) ?? 0 });
  }

  return result;
}
