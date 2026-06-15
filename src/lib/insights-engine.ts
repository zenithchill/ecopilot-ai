/* ============================================
   EcoPilot AI — Insights Engine
   Pattern detection & personalized recommendations
   ============================================ */

import type { DailyLog, Insight, SmartNotification, LifestyleProfile, ActivityCategory } from '@/types';
import { CATEGORY_CONFIG } from './constants';
import { generateId, formatCarbon, percentChange } from './utils';

// ---- Threshold Constants ----
const MIN_LOGS_FOR_PATTERNS = 3;
const PATTERN_LOOKBACK_DAYS = 14;
const HIGH_EMISSION_MULTIPLIER = 1.5;
const MIN_HIGH_EMISSION_DAYS = 3;
const MIN_DAILY_HABIT_DAYS = 10;
const INSIGHT_LOOKBACK_DAYS = 7;
const EMISSION_RISE_THRESHOLD_PERCENT = 1.2; // 20% increase
const EMISSION_DROP_THRESHOLD_PERCENT = 0.8; // 20% decrease
const NOTIFICATION_SPIKE_PERCENT = 20;
const NOTIFICATION_DROP_PERCENT = -15;

/**
 * Detect behavior patterns from recent activity logs.
 * Looks for frequent high emissions or daily habits in specific categories.
 *
 * @param logs - Array of daily logs
 * @returns Array of detected patterns with frequency count
 */
export function detectPatterns(logs: DailyLog[]): Array<{ category: ActivityCategory; pattern: string; frequency: number }> {
  const patterns: Array<{ category: ActivityCategory; pattern: string; frequency: number }> = [];
  if (logs.length < MIN_LOGS_FOR_PATTERNS) return patterns;

  const recentLogs = logs.slice(-PATTERN_LOOKBACK_DAYS);
  const categoryTotals: Record<string, number[]> = {};

  // Aggregate carbon emissions by category across recent days
  for (const log of recentLogs) {
    for (const activity of log.activities) {
      if (!categoryTotals[activity.category]) {
        categoryTotals[activity.category] = [];
      }
      categoryTotals[activity.category].push(activity.carbonKg);
    }
  }

  // Analyze each category for patterns
  for (const [category, values] of Object.entries(categoryTotals)) {
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const highDaysCount = values.filter(value => value > average * HIGH_EMISSION_MULTIPLIER).length;

    if (highDaysCount > MIN_HIGH_EMISSION_DAYS) {
      patterns.push({
        category: category as ActivityCategory,
        pattern: 'frequent_high_emission',
        frequency: highDaysCount
      });
    }

    if (values.length > MIN_DAILY_HABIT_DAYS) {
      patterns.push({
        category: category as ActivityCategory,
        pattern: 'daily_habit',
        frequency: values.length
      });
    }
  }

  return patterns;
}

/**
 * Calculate the total carbon footprint for a specific category across a set of logs.
 */
function getCategoryTotal(logs: DailyLog[], category: ActivityCategory): number {
  return logs.reduce((total, log) => {
    const categorySum = log.activities
      .filter(activity => activity.category === category)
      .reduce((sum, activity) => sum + activity.carbonKg, 0);
    return total + categorySum;
  }, 0);
}

/**
 * Generate personalized insights from activity data and lifestyle profile.
 * Creates actionable recommendations, warnings, and achievements.
 *
 * @param logs    - Array of daily logs
 * @param profile - User's lifestyle profile
 * @returns Sorted array of insights (highest priority/impact first)
 */
export function generateInsights(logs: DailyLog[], profile: LifestyleProfile): Insight[] {
  const insights: Insight[] = [];

  // Fallback insight for new users
  if (logs.length === 0) {
    insights.push({
      id: generateId(),
      type: 'tip',
      priority: 'high',
      category: 'transport',
      title: 'Start Tracking',
      message: 'Log your first activity to get personalized insights!',
      impactKg: 0,
      effort: 'easy',
      cost: 'free',
      icon: '🚀',
    });
    return insights;
  }

  const currentWeekLogs = logs.slice(-INSIGHT_LOOKBACK_DAYS);
  const previousWeekLogs = logs.slice(-(INSIGHT_LOOKBACK_DAYS * 2), -INSIGHT_LOOKBACK_DAYS);

  // --- Transport Insights ---
  const currentTransport = getCategoryTotal(currentWeekLogs, 'transport');
  const prevTransport = getCategoryTotal(previousWeekLogs, 'transport');

  if (prevTransport > 0 && currentTransport > prevTransport * EMISSION_RISE_THRESHOLD_PERCENT) {
    insights.push({
      id: generateId(),
      type: 'warning',
      priority: 'high',
      category: 'transport',
      title: 'Transport Emissions Rising',
      message: `Your transport emissions increased ${Math.round(percentChange(prevTransport, currentTransport))}% this week. Consider carpooling or public transit for 2-3 trips.`,
      impactKg: currentTransport * 0.3,
      effort: 'moderate',
      cost: 'low',
      icon: '🚗',
      actionLabel: 'Try public transit',
    });
  }

  if (profile.primaryTransport === 'car' && profile.dailyCommuteKm > 10) {
    const savingsWeekly = profile.dailyCommuteKm * 0.159 * 5; // approx diff between car and bus
    insights.push({
      id: generateId(),
      type: 'recommendation',
      priority: 'high',
      category: 'transport',
      title: 'Switch to Public Transit',
      message: `Replacing your car commute with metro/bus 3x/week would save ${formatCarbon(savingsWeekly * 0.6)} CO₂ weekly — equivalent to planting ${Math.round(savingsWeekly * 52 / 22)} trees/year.`,
      impactKg: savingsWeekly * 0.6,
      effort: 'moderate',
      cost: 'low',
      icon: '🚌',
      actionLabel: 'Log a transit trip',
    });
  }

  // --- Food Insights ---
  if (profile.meatMealsPerWeek > 5) {
    const excessMeals = profile.meatMealsPerWeek - 3;
    const savingsWeekly = excessMeals * 3.5; // average savings per substituted meal
    insights.push({
      id: generateId(),
      type: 'recommendation',
      priority: 'medium',
      category: 'food',
      title: 'Reduce Meat Consumption',
      message: `Cutting ${excessMeals} meat meals/week saves ${formatCarbon(savingsWeekly)} CO₂ weekly. Try "Meatless Monday" as a start!`,
      impactKg: savingsWeekly,
      effort: 'easy',
      cost: 'free',
      icon: '🥗',
      actionLabel: 'Try a veggie meal',
    });
  }

  // --- Energy Insights ---
  if (profile.electricityKwhPerMonth > 300 && !profile.hasRenewableEnergy) {
    const excessUsage = profile.electricityKwhPerMonth - 200;
    const dailySavings = (excessUsage * 0.233) / 30;
    insights.push({
      id: generateId(),
      type: 'recommendation',
      priority: 'medium',
      category: 'energy',
      title: 'Reduce Electricity Usage',
      message: `Your electricity usage is above average. Switching to LED bulbs and unplugging standby devices could save ${formatCarbon(dailySavings)} CO₂ daily.`,
      impactKg: dailySavings,
      effort: 'easy',
      cost: 'low',
      icon: '💡',
      actionLabel: 'Track energy usage',
    });
  }

  // --- Positive Reinforcement (Achievements) ---
  if (prevTransport > 0 && currentTransport < prevTransport * EMISSION_DROP_THRESHOLD_PERCENT) {
    insights.push({
      id: generateId(),
      type: 'achievement',
      priority: 'low',
      category: 'transport',
      title: '🎉 Great Progress!',
      message: `Your transport emissions dropped ${Math.abs(Math.round(percentChange(prevTransport, currentTransport)))}% this week. Keep it up!`,
      impactKg: prevTransport - currentTransport,
      effort: 'easy',
      cost: 'free',
      icon: '🌟',
    });
  }

  // --- Waste/Recycling Tip ---
  if (profile.recyclingHabit !== 'always') {
    insights.push({
      id: generateId(),
      type: 'tip',
      priority: 'low',
      category: 'waste',
      title: 'Recycling Matters',
      message: 'Recycling 1kg of waste produces 96% less CO₂ than sending it to landfill. Separate your waste to make a big impact!',
      impactKg: 0.5,
      effort: 'easy',
      cost: 'free',
      icon: '♻️',
      actionLabel: 'Log recycling',
    });
  }

  return rankByImpact(insights);
}

/**
 * Rank insights by their priority and impact-to-effort ratio.
 * High priority items always come first. Within the same priority,
 * items with high impact and low effort rank higher.
 *
 * @param insights - Unsorted array of insights
 * @returns Sorted array of insights
 */
export function rankByImpact(insights: Insight[]): Insight[] {
  const effortScore: Record<string, number> = { easy: 1, moderate: 2, hard: 3 };
  const priorityScore: Record<string, number> = { high: 0, medium: 1, low: 2 };

  return [...insights].sort((a, b) => {
    // 1. Sort by Priority (High = 0, Low = 2)
    const priorityDifference = priorityScore[a.priority] - priorityScore[b.priority];
    if (priorityDifference !== 0) return priorityDifference;

    // 2. Sort by Impact/Effort ratio
    const ratioA = a.impactKg / effortScore[a.effort];
    const ratioB = b.impactKg / effortScore[b.effort];
    return ratioB - ratioA; // Higher ratio comes first
  });
}

/**
 * Generate smart push/toast notifications based on very recent activity (day-to-day).
 * Detects sudden spikes, drops, and tracking milestones.
 *
 * @param logs    - Array of daily logs
 * @param profile - User's lifestyle profile
 * @returns Array of smart notifications to display
 */
export function generateNotifications(logs: DailyLog[], _profile: LifestyleProfile): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const nowStr = new Date().toISOString();

  if (logs.length === 0) {
    notifications.push({
      id: generateId(),
      type: 'tip',
      title: 'Welcome!',
      message: 'Start logging activities to receive personalized tips.',
      timestamp: nowStr,
      read: false,
      icon: '👋'
    });
    return notifications;
  }

  const todayLog = logs[logs.length - 1];
  const yesterdayLog = logs.length > 1 ? logs[logs.length - 2] : null;

  // Compare today vs yesterday
  if (todayLog && yesterdayLog) {
    const dailyChange = percentChange(yesterdayLog.totalCarbonKg, todayLog.totalCarbonKg);

    if (dailyChange < NOTIFICATION_DROP_PERCENT) {
      notifications.push({
        id: generateId(),
        type: 'positive',
        title: 'Lower Emissions Today!',
        message: `You used ${Math.abs(Math.round(dailyChange))}% less carbon than yesterday. ${CATEGORY_CONFIG.transport.icon} Keep it up!`,
        timestamp: nowStr,
        read: false,
        icon: '📉'
      });
    } else if (dailyChange > NOTIFICATION_SPIKE_PERCENT) {
      notifications.push({
        id: generateId(),
        type: 'warning',
        title: 'Emissions Spike',
        message: `Your emissions are ${Math.round(dailyChange)}% higher than yesterday. Check which activities contributed most.`,
        timestamp: nowStr,
        read: false,
        icon: '📈'
      });
    }
  }

  // Tracking Milestones
  const trackingDays = logs.length;
  if (trackingDays === 7) {
    notifications.push({
      id: generateId(),
      type: 'milestone',
      title: 'One Week!',
      message: 'You\'ve been tracking for a full week! Check your analytics for insights.',
      timestamp: nowStr,
      read: false,
      icon: '🎯'
    });
  }
  if (trackingDays === 30) {
    notifications.push({
      id: generateId(),
      type: 'milestone',
      title: 'Monthly Milestone!',
      message: 'A full month of tracking! Your data is now rich enough for robust AI predictions.',
      timestamp: nowStr,
      read: false,
      icon: '🏆'
    });
  }

  return notifications;
}
