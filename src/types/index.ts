/* ============================================
   EcoPilot AI — TypeScript Interfaces
   ============================================ */

// ---- User & Profile ----

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  location?: string;
  joinedAt: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  lifestyle: LifestyleProfile;
}

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  units: 'metric' | 'imperial';
  currency: string;
}

export interface LifestyleProfile {
  // Transport
  primaryTransport: TransportMode;
  dailyCommuteKm: number;
  carType?: CarType;
  flightsPerYear: number;

  // Diet
  dietType: DietType;
  meatMealsPerWeek: number;
  localFoodPercentage: number;

  // Energy
  homeType: HomeType;
  electricityKwhPerMonth: number;
  heatingSource: HeatingSource;
  hasRenewableEnergy: boolean;
  hasSolarPanels: boolean;

  // Lifestyle
  shoppingFrequency: ShoppingFrequency;
  recyclingHabit: RecyclingHabit;
  waterUsage: WaterUsage;
}

// ---- Enums ----

export type TransportMode = 'car' | 'public_transit' | 'bicycle' | 'walking' | 'motorcycle' | 'electric_car' | 'carpool';
export type CarType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'suv_petrol' | 'suv_diesel';
export type DietType = 'omnivore' | 'flexitarian' | 'pescatarian' | 'vegetarian' | 'vegan';
export type HomeType = 'apartment' | 'house' | 'studio' | 'shared';
export type HeatingSource = 'natural_gas' | 'electric' | 'oil' | 'heat_pump' | 'wood' | 'district';
export type ShoppingFrequency = 'minimal' | 'moderate' | 'frequent' | 'excessive';
export type RecyclingHabit = 'always' | 'usually' | 'sometimes' | 'rarely' | 'never';
export type WaterUsage = 'low' | 'average' | 'high';

// ---- Activity Tracking ----

export type ActivityCategory = 'transport' | 'energy' | 'food' | 'shopping' | 'waste' | 'water';

export interface Activity {
  id: string;
  category: ActivityCategory;
  type: string;
  label: string;
  amount: number;
  unit: string;
  carbonKg: number;
  timestamp: string;
  notes?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  activities: Activity[];
  totalCarbonKg: number;
}

// ---- Carbon Score ----

export interface CarbonScore {
  score: number; // 0-100 (100 = best)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  dailyAverageKg: number;
  weeklyTotalKg: number;
  monthlyTotalKg: number;
  yearlyProjectionKg: number;
  nationalAverageKg: number;
  comparisonPercent: number; // positive = better than average
  breakdown: CategoryBreakdown[];
  riskAreas: RiskArea[];
  improvementForecast: number; // predicted score in 30 days
}

export interface CategoryBreakdown {
  category: ActivityCategory;
  carbonKg: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface RiskArea {
  category: ActivityCategory;
  severity: 'high' | 'medium' | 'low';
  message: string;
  potentialSavingKg: number;
}

// ---- AI Insights ----

export interface Insight {
  id: string;
  type: 'recommendation' | 'achievement' | 'warning' | 'tip';
  priority: 'high' | 'medium' | 'low';
  category: ActivityCategory;
  title: string;
  message: string;
  impactKg: number;
  effort: 'easy' | 'moderate' | 'hard';
  cost: 'free' | 'low' | 'moderate' | 'high';
  icon: string;
  actionLabel?: string;
  dismissed?: boolean;
}

export interface SmartNotification {
  id: string;
  type: 'positive' | 'warning' | 'tip' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}

// ---- Chat ----

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ---- Gamification ----

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'reduction' | 'transport' | 'diet' | 'energy' | 'community' | 'special';
  requirement: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number; // 0-100
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  type: 'daily' | 'weekly' | 'monthly';
  icon: string;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  rewardPoints: number;
}

export interface GamificationState {
  ecoPoints: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  badges: Badge[];
  activeChallenges: Challenge[];
  completedChallenges: string[];
  weeklyRank: number;
}

// ---- Simulation ----

export interface SimulationScenario {
  id: string;
  label: string;
  category: ActivityCategory;
  currentValue: number;
  newValue: number;
  unit: string;
  impactKgPerMonth: number;
}

export interface SimulationResult {
  currentMonthlyKg: number;
  projectedMonthlyKg: number;
  savingsKg: number;
  savingsPercent: number;
  equivalentTrees: number;
  equivalentDrivingKm: number;
  scenarios: SimulationScenario[];
}

// ---- Analytics ----

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface WeeklyComparison {
  week: string;
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  waste: number;
  water: number;
  total: number;
}

export interface PredictionDataPoint {
  date: string;
  actual?: number;
  predicted: number;
  lower: number;
  upper: number;
}

// ---- Leaderboard ----

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  reduction: number;
  isCurrentUser?: boolean;
}

// ---- Onboarding ----

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}
