/* ============================================
   EcoPilot AI — Insights Engine
   Pattern detection & personalized recommendations
   ============================================ */

import type { DailyLog, Insight, SmartNotification, LifestyleProfile, ActivityCategory } from '@/types';
import { CATEGORY_CONFIG } from './constants';
import { generateId, formatCarbon, percentChange } from './utils';

/** Detect behavior patterns from activity logs */
export function detectPatterns(logs: DailyLog[]): Array<{ category: ActivityCategory; pattern: string; frequency: number }> {
  const patterns: Array<{ category: ActivityCategory; pattern: string; frequency: number }> = [];
  if (logs.length < 3) return patterns;

  const recentLogs = logs.slice(-14);
  const catTotals: Record<string, number[]> = {};
  
  for (const log of recentLogs) {
    for (const act of log.activities) {
      if (!catTotals[act.category]) catTotals[act.category] = [];
      catTotals[act.category].push(act.carbonKg);
    }
  }

  for (const [cat, values] of Object.entries(catTotals)) {
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const highDays = values.filter(v => v > avg * 1.5).length;
    if (highDays > 3) {
      patterns.push({ category: cat as ActivityCategory, pattern: 'frequent_high_emission', frequency: highDays });
    }
    if (values.length > 10) {
      patterns.push({ category: cat as ActivityCategory, pattern: 'daily_habit', frequency: values.length });
    }
  }

  return patterns;
}

/** Generate personalized insights from activity data */
export function generateInsights(logs: DailyLog[], profile: LifestyleProfile): Insight[] {
  const insights: Insight[] = [];
  if (logs.length === 0) {
    insights.push({
      id: generateId(), type: 'tip', priority: 'high', category: 'transport',
      title: 'Start Tracking', message: 'Log your first activity to get personalized insights!',
      impactKg: 0, effort: 'easy', cost: 'free', icon: '🚀',
    });
    return insights;
  }

  const last7 = logs.slice(-7);
  const prev7 = logs.slice(-14, -7);
  
  // Transport insights
  const transportCurrent = last7.reduce((s, l) => s + l.activities.filter(a => a.category === 'transport').reduce((s2, a) => s2 + a.carbonKg, 0), 0);
  const transportPrev = prev7.reduce((s, l) => s + l.activities.filter(a => a.category === 'transport').reduce((s2, a) => s2 + a.carbonKg, 0), 0);
  
  if (transportPrev > 0 && transportCurrent > transportPrev * 1.2) {
    insights.push({
      id: generateId(), type: 'warning', priority: 'high', category: 'transport',
      title: 'Transport Emissions Rising', message: `Your transport emissions increased ${Math.round(percentChange(transportPrev, transportCurrent))}% this week. Consider carpooling or public transit for 2-3 trips.`,
      impactKg: transportCurrent * 0.3, effort: 'moderate', cost: 'low', icon: '🚗',
      actionLabel: 'Try public transit',
    });
  }

  if (profile.primaryTransport === 'car' && profile.dailyCommuteKm > 10) {
    const savings = profile.dailyCommuteKm * 0.159 * 5; // diff between car and bus, per week
    insights.push({
      id: generateId(), type: 'recommendation', priority: 'high', category: 'transport',
      title: 'Switch to Public Transit', message: `Replacing your car commute with metro/bus 3x/week would save ${formatCarbon(savings * 0.6)} CO₂ weekly — equivalent to planting ${Math.round(savings * 52 / 22)} trees/year.`,
      impactKg: savings * 0.6, effort: 'moderate', cost: 'low', icon: '🚌',
      actionLabel: 'Log a transit trip',
    });
  }

  // Food insights
  if (profile.meatMealsPerWeek > 5) {
    const savings = (profile.meatMealsPerWeek - 3) * 3.5;
    insights.push({
      id: generateId(), type: 'recommendation', priority: 'medium', category: 'food',
      title: 'Reduce Meat Consumption', message: `Cutting ${profile.meatMealsPerWeek - 3} meat meals/week saves ${formatCarbon(savings)} CO₂ weekly. Try "Meatless Monday" as a start!`,
      impactKg: savings, effort: 'easy', cost: 'free', icon: '🥗',
      actionLabel: 'Try a veggie meal',
    });
  }

  // Energy insights
  if (profile.electricityKwhPerMonth > 300 && !profile.hasRenewableEnergy) {
    const savings = (profile.electricityKwhPerMonth - 200) * 0.233 / 30;
    insights.push({
      id: generateId(), type: 'recommendation', priority: 'medium', category: 'energy',
      title: 'Reduce Electricity Usage', message: `Your electricity usage is above average. Switching to LED bulbs and unplugging standby devices could save ${formatCarbon(savings)} CO₂ daily.`,
      impactKg: savings, effort: 'easy', cost: 'low', icon: '💡',
      actionLabel: 'Track energy usage',
    });
  }

  // Positive reinforcement
  if (transportPrev > 0 && transportCurrent < transportPrev * 0.8) {
    insights.push({
      id: generateId(), type: 'achievement', priority: 'low', category: 'transport',
      title: '🎉 Great Progress!', message: `Your transport emissions dropped ${Math.abs(Math.round(percentChange(transportPrev, transportCurrent)))}% this week. Keep it up!`,
      impactKg: transportPrev - transportCurrent, effort: 'easy', cost: 'free', icon: '🌟',
    });
  }

  // Recycling tip
  if (profile.recyclingHabit !== 'always') {
    insights.push({
      id: generateId(), type: 'tip', priority: 'low', category: 'waste',
      title: 'Recycling Matters', message: 'Recycling 1kg of waste produces 96% less CO₂ than sending it to landfill. Separate your waste to make a big impact!',
      impactKg: 0.5, effort: 'easy', cost: 'free', icon: '♻️',
      actionLabel: 'Log recycling',
    });
  }

  return rankByImpact(insights);
}

/** Rank insights by impact-to-effort ratio */
export function rankByImpact(insights: Insight[]): Insight[] {
  const effortScore = { easy: 1, moderate: 2, hard: 3 };
  return [...insights].sort((a, b) => {
    // Priority first
    const priorityScore = { high: 0, medium: 1, low: 2 };
    const pDiff = priorityScore[a.priority] - priorityScore[b.priority];
    if (pDiff !== 0) return pDiff;
    // Then by impact/effort ratio
    const ratioA = a.impactKg / effortScore[a.effort];
    const ratioB = b.impactKg / effortScore[b.effort];
    return ratioB - ratioA;
  });
}

/** Generate smart notifications based on recent activity */
export function generateNotifications(logs: DailyLog[], profile: LifestyleProfile): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const now = new Date().toISOString();

  if (logs.length === 0) {
    notifications.push({ id: generateId(), type: 'tip', title: 'Welcome!', message: 'Start logging activities to receive personalized tips.', timestamp: now, read: false, icon: '👋' });
    return notifications;
  }

  const today = logs[logs.length - 1];
  const yesterday = logs.length > 1 ? logs[logs.length - 2] : null;

  if (today && yesterday) {
    const change = percentChange(yesterday.totalCarbonKg, today.totalCarbonKg);
    if (change < -15) {
      notifications.push({ id: generateId(), type: 'positive', title: 'Lower Emissions Today!', message: `You used ${Math.abs(Math.round(change))}% less carbon than yesterday. ${CATEGORY_CONFIG.transport.icon} Keep it up!`, timestamp: now, read: false, icon: '📉' });
    } else if (change > 20) {
      notifications.push({ id: generateId(), type: 'warning', title: 'Emissions Spike', message: `Your emissions are ${Math.round(change)}% higher than yesterday. Check which activities contributed most.`, timestamp: now, read: false, icon: '📈' });
    }
  }

  // Milestone notifications
  const totalDays = logs.length;
  if (totalDays === 7) notifications.push({ id: generateId(), type: 'milestone', title: 'One Week!', message: 'You\'ve been tracking for a full week! Check your analytics for insights.', timestamp: now, read: false, icon: '🎯' });
  if (totalDays === 30) notifications.push({ id: generateId(), type: 'milestone', title: 'Monthly Milestone!', message: 'A full month of tracking! Your data is now rich enough for AI predictions.', timestamp: now, read: false, icon: '🏆' });

  return notifications;
}
