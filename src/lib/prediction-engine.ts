/* ============================================
   EcoPilot AI — Prediction Engine
   Trend forecasting & "what-if" simulations
   ============================================ */

import type { DailyLog, SimulationResult, SimulationScenario, PredictionDataPoint, LifestyleProfile } from '@/types';
import { calculateActivityCarbon, calculateMonthlyTotal } from './carbon-engine';
import { generateId } from './utils';

// ---- Constants ----
const DEFAULT_PREDICTION_DAYS = 30;
const MIN_LOGS_FOR_REGRESSION = 3;
const FALLBACK_DAILY_EMISSION_KG = 10;
const REGRESSION_LOOKBACK_DAYS = 30;
const CONFIDENCE_INTERVAL_Z_SCORE = 1.96; // 95% confidence interval

/**
 * Perform simple linear regression for trend prediction.
 * Calculates the line of best fit: y = mx + b.
 *
 * @param data - Array of x/y coordinate pairs representing days and emissions
 * @returns The slope (m) and intercept (b) of the regression line
 */
function linearRegression(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const denominator = (n * sumX2 - sumX * sumX);
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: isFinite(slope) ? slope : 0,
    intercept: isFinite(intercept) ? intercept : 0
  };
}

/**
 * Predict future daily emissions using linear regression on recent data.
 * Includes confidence intervals that widen over time.
 *
 * @param logs       - Array of historical daily logs
 * @param futureDays - Number of days to predict into the future
 * @returns Array of predicted data points with confidence bands
 */
export function predictEmissions(logs: DailyLog[], futureDays: number = DEFAULT_PREDICTION_DAYS): PredictionDataPoint[] {
  const results: PredictionDataPoint[] = [];

  // Not enough data for regression — return flat prediction based on last known value
  if (logs.length < MIN_LOGS_FOR_REGRESSION) {
    const lastValue = logs.length > 0 ? logs[logs.length - 1].totalCarbonKg : FALLBACK_DAILY_EMISSION_KG;
    for (let i = 0; i < futureDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      results.push({
        date: date.toISOString().split('T')[0],
        predicted: lastValue,
        lower: lastValue * 0.7, // Arbitrary 30% uncertainty band
        upper: lastValue * 1.3
      });
    }
    return results;
  }

  // Use the last N days of data for regression
  const recentLogs = logs.slice(-REGRESSION_LOOKBACK_DAYS);
  const regressionData = recentLogs.map((log, index) => ({ x: index, y: log.totalCarbonKg }));
  const { slope, intercept } = linearRegression(regressionData);

  // Calculate standard deviation of residuals for confidence bands
  const predictedValues = regressionData.map(point => intercept + slope * point.x);
  const residuals = regressionData.map((point, i) => point.y - predictedValues[i]);
  const variance = residuals.reduce((sum, res) => sum + res * res, 0) / residuals.length;
  const stdDev = Math.sqrt(variance);

  const lastXIndex = regressionData.length - 1;

  for (let i = 1; i <= futureDays; i++) {
    const futureX = lastXIndex + i;
    const predictedMean = Math.max(0, intercept + slope * futureX);

    // Uncertainty grows as we predict further into the future
    const uncertaintyFactor = stdDev * Math.sqrt(1 + i / regressionData.length);
    const marginOfError = CONFIDENCE_INTERVAL_Z_SCORE * uncertaintyFactor;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);

    results.push({
      date: targetDate.toISOString().split('T')[0],
      predicted: Math.round(predictedMean * 100) / 100,
      lower: Math.max(0, Math.round((predictedMean - marginOfError) * 100) / 100),
      upper: Math.round((predictedMean + marginOfError) * 100) / 100,
    });
  }

  return results;
}

/**
 * Calculate the projected total emissions for the upcoming month.
 *
 * @param logs - Array of historical daily logs
 * @returns Sum of predicted emissions over the next 30 days
 */
export function predictMonthlyTotal(logs: DailyLog[]): number {
  const predictions = predictEmissions(logs, 30);
  return predictions.reduce((total, point) => total + point.predicted, 0);
}

/**
 * Simulate "what-if" scenarios to project carbon savings.
 * Calculates how changing specific lifestyle parameters impacts monthly totals.
 *
 * @param profile   - The user's current lifestyle profile
 * @param logs      - Historical daily logs
 * @param scenarios - Array of scenarios to simulate
 * @returns Detailed simulation results including savings and equivalencies
 */
export function simulateScenarios(profile: LifestyleProfile, logs: DailyLog[], scenarios: SimulationScenario[]): SimulationResult {
  const currentMonthlyKg = calculateMonthlyTotal(logs) || estimateMonthlyFromProfile(profile);
  let projectedMonthlyKg = currentMonthlyKg;

  for (const scenario of scenarios) {
    const activityType = getTypeForCategory(scenario.category, profile);
    const currentDailyImpact = calculateActivityCarbon(scenario.category, activityType, scenario.currentValue);
    const newDailyImpact = calculateActivityCarbon(scenario.category, activityType, scenario.newValue);

    const dailySaving = currentDailyImpact - newDailyImpact;
    scenario.impactKgPerMonth = Math.round(dailySaving * 30 * 100) / 100;
    projectedMonthlyKg -= scenario.impactKgPerMonth;
  }

  // Ensure projection never drops below zero
  projectedMonthlyKg = Math.max(0, projectedMonthlyKg);

  const savingsKg = currentMonthlyKg - projectedMonthlyKg;
  const savingsPercent = currentMonthlyKg > 0 ? (savingsKg / currentMonthlyKg) * 100 : 0;

  // Equivalencies: 1 tree absorbs ~22kg/year. Calculate annual trees needed.
  const equivalentTrees = (savingsKg * 12) / 22;
  // Equivalencies: Driving 1km emits ~0.192kg. 1 / 0.192 ≈ 5.2km per kg.
  const equivalentDrivingKm = savingsKg * 5.2;

  return {
    currentMonthlyKg: Math.round(currentMonthlyKg * 100) / 100,
    projectedMonthlyKg: Math.round(projectedMonthlyKg * 100) / 100,
    savingsKg: Math.round(savingsKg * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
    equivalentTrees: Math.round(equivalentTrees * 10) / 10,
    equivalentDrivingKm: Math.round(equivalentDrivingKm),
    scenarios,
  };
}

/**
 * Generate a set of default simulation scenarios tailored to the user's current lifestyle.
 *
 * @param profile - The user's lifestyle profile
 * @returns Array of relevant "what-if" scenarios
 */
export function getDefaultScenarios(profile: LifestyleProfile): SimulationScenario[] {
  const scenarios: SimulationScenario[] = [];

  if (profile.primaryTransport === 'car') {
    scenarios.push({
      id: generateId(),
      label: 'Switch to public transit',
      category: 'transport',
      currentValue: profile.dailyCommuteKm,
      newValue: profile.dailyCommuteKm,
      unit: 'km/day (by bus instead)',
      impactKgPerMonth: 0
    });
    scenarios.push({
      id: generateId(),
      label: 'Reduce driving distance',
      category: 'transport',
      currentValue: profile.dailyCommuteKm,
      newValue: Math.round(profile.dailyCommuteKm * 0.5),
      unit: 'km/day',
      impactKgPerMonth: 0
    });
  }

  scenarios.push({
    id: generateId(),
    label: 'Reduce meat meals',
    category: 'food',
    currentValue: profile.meatMealsPerWeek,
    newValue: Math.max(0, profile.meatMealsPerWeek - 3),
    unit: 'meals/week',
    impactKgPerMonth: 0
  });

  scenarios.push({
    id: generateId(),
    label: 'Go vegetarian',
    category: 'food',
    currentValue: profile.meatMealsPerWeek,
    newValue: 0,
    unit: 'meals/week',
    impactKgPerMonth: 0
  });

  scenarios.push({
    id: generateId(),
    label: 'Reduce electricity',
    category: 'energy',
    currentValue: profile.electricityKwhPerMonth,
    newValue: Math.round(profile.electricityKwhPerMonth * 0.8),
    unit: 'kWh/month',
    impactKgPerMonth: 0
  });

  if (!profile.hasRenewableEnergy) {
    scenarios.push({
      id: generateId(),
      label: 'Switch to renewable energy',
      category: 'energy',
      currentValue: profile.electricityKwhPerMonth,
      newValue: Math.round(profile.electricityKwhPerMonth * 0.1), // Assumes 90% cleaner
      unit: 'kWh/month (net)',
      impactKgPerMonth: 0
    });
  }

  return scenarios;
}

/**
 * Helper: Estimate monthly emissions purely from a lifestyle profile.
 * Used as a fallback baseline when activity logs are missing.
 */
function estimateMonthlyFromProfile(profile: LifestyleProfile): number {
  let dailyEmissions = 0;

  const transportType = profile.primaryTransport === 'car' ? `car_${profile.carType ?? 'petrol'}` : 'bus';
  dailyEmissions += calculateActivityCarbon('transport', transportType, profile.dailyCommuteKm);

  const dailyMeatMeals = profile.meatMealsPerWeek / 7;
  dailyEmissions += calculateActivityCarbon('food', 'chicken_meal', dailyMeatMeals);
  dailyEmissions += calculateActivityCarbon('food', 'vegetarian_meal', 3 - dailyMeatMeals);

  const dailyElectricity = profile.electricityKwhPerMonth / 30;
  dailyEmissions += calculateActivityCarbon('energy', 'electricity', dailyElectricity);

  return dailyEmissions * 30;
}

/**
 * Helper: Resolve the specific emission type key for a broad category based on user profile.
 */
function getTypeForCategory(category: string, profile: LifestyleProfile): string {
  switch (category) {
    case 'transport':
      return profile.primaryTransport === 'car' ? `car_${profile.carType ?? 'petrol'}` : 'bus';
    case 'food':
      return 'chicken_meal'; // Average proxy for simulation
    case 'energy':
      return 'electricity';
    default:
      return 'general_waste';
  }
}
