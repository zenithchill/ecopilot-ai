/* ============================================
   EcoPilot AI — Constants & Emission Factors
   ============================================
   Sources: EPA, DEFRA (UK Gov), IPCC AR6
   All values in kg CO₂ equivalent
   ============================================ */

// ---- Transport Emission Factors (kg CO₂ per km) ----
export const TRANSPORT_EMISSIONS: Record<string, number> = {
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_hybrid: 0.110,
  car_electric: 0.053,
  car_suv_petrol: 0.256,
  car_suv_diesel: 0.228,
  motorcycle: 0.103,
  bus: 0.089,
  train: 0.041,
  metro: 0.033,
  tram: 0.029,
  bicycle: 0.0,
  walking: 0.0,
  e_scooter: 0.035,
  carpool_2: 0.096,  // half of petrol car
  carpool_3: 0.064,  // third
  taxi: 0.210,
  rideshare: 0.175,
  flight_domestic: 0.255,  // per km per passenger
  flight_short: 0.156,
  flight_long: 0.150,
};

// ---- Food Emission Factors (kg CO₂ per serving) ----
export const FOOD_EMISSIONS: Record<string, number> = {
  beef_meal: 6.61,
  lamb_meal: 5.84,
  pork_meal: 2.21,
  chicken_meal: 1.82,
  fish_meal: 1.34,
  dairy_meal: 1.39,
  vegetarian_meal: 0.86,
  vegan_meal: 0.43,
  eggs_meal: 0.98,
  rice_meal: 1.21,
  pasta_meal: 0.46,
  salad_meal: 0.28,
  fast_food: 3.50,
  coffee: 0.21,
  plant_milk: 0.14,
  dairy_milk: 0.63,
};

// ---- Energy Emission Factors ----
export const ENERGY_EMISSIONS = {
  electricity_kwh: 0.233,     // World average kg CO₂/kWh
  natural_gas_kwh: 0.184,     // kg CO₂/kWh
  heating_oil_kwh: 0.265,     // kg CO₂/kWh
  wood_kwh: 0.039,            // kg CO₂/kWh
  heat_pump_kwh: 0.058,       // kg CO₂/kWh (COP of 4)
  solar_kwh: 0.020,           // lifecycle emissions
  water_liter: 0.000344,      // kg CO₂ per liter
  shower_minute: 0.042,       // avg 8L/min * emissions
};

// ---- Shopping Emission Factors ----
export const SHOPPING_EMISSIONS: Record<string, number> = {
  clothing_item: 10.0,        // avg kg CO₂ per item
  electronics_small: 25.0,    // phone, tablet
  electronics_large: 400.0,   // laptop, TV
  furniture: 50.0,
  fast_fashion: 15.0,
  secondhand: 0.5,
  online_order: 0.5,          // packaging + delivery
  plastic_bag: 0.033,
  reusable_bag: 0.0,
};

// ---- Waste Emission Factors ----
export const WASTE_EMISSIONS: Record<string, number> = {
  general_waste_kg: 0.587,
  recycling_kg: 0.021,
  composting_kg: 0.010,
  food_waste_kg: 0.700,
  plastic_waste_kg: 1.430,
  paper_waste_kg: 0.340,
  glass_waste_kg: 0.180,
  electronic_waste_kg: 2.500,
};

// ---- National Averages (kg CO₂ per year) ----
export const NATIONAL_AVERAGES: Record<string, number> = {
  world: 4800,
  usa: 15520,
  uk: 5550,
  eu: 6800,
  india: 1900,
  china: 7380,
  japan: 9700,
  australia: 17100,
  canada: 15600,
  brazil: 2200,
  germany: 8090,
  france: 4810,
};

// ---- Carbon Score Thresholds ----
export const SCORE_GRADES = {
  'A+': { min: 90, color: '#059669', label: 'Eco Champion' },
  'A':  { min: 75, color: '#10b981', label: 'Sustainability Leader' },
  'B':  { min: 60, color: '#34d399', label: 'Eco Conscious' },
  'C':  { min: 45, color: '#fbbf24', label: 'Getting There' },
  'D':  { min: 30, color: '#f97316', label: 'Needs Improvement' },
  'F':  { min: 0,  color: '#ef4444', label: 'High Impact' },
};

// ---- Sustainability Levels ----
export const ECO_LEVELS = [
  { level: 1,  title: 'Seedling',           minPoints: 0,      icon: '🌱' },
  { level: 2,  title: 'Sprout',             minPoints: 100,    icon: '🌿' },
  { level: 3,  title: 'Sapling',            minPoints: 300,    icon: '🌳' },
  { level: 4,  title: 'Green Guardian',     minPoints: 600,    icon: '🛡️' },
  { level: 5,  title: 'Eco Warrior',        minPoints: 1000,   icon: '⚔️' },
  { level: 6,  title: 'Nature Protector',   minPoints: 1500,   icon: '🦋' },
  { level: 7,  title: 'Climate Champion',   minPoints: 2500,   icon: '🏆' },
  { level: 8,  title: 'Earth Ambassador',   minPoints: 4000,   icon: '🌍' },
  { level: 9,  title: 'Sustainability Sage', minPoints: 6000,  icon: '🧙' },
  { level: 10, title: 'Planet Savior',      minPoints: 10000,  icon: '✨' },
];

// ---- Default Badges ----
export const DEFAULT_BADGES: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'reduction' | 'transport' | 'diet' | 'energy' | 'community' | 'special';
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}> = [
  { id: 'first_log', title: 'First Step', description: 'Log your first activity', icon: '👣', category: 'special', requirement: 'Log 1 activity', rarity: 'common' },
  { id: 'streak_3', title: 'Hat Trick', description: '3-day logging streak', icon: '🔥', category: 'streak', requirement: '3 consecutive days', rarity: 'common' },
  { id: 'streak_7', title: 'Week Warrior', description: '7-day logging streak', icon: '💪', category: 'streak', requirement: '7 consecutive days', rarity: 'rare' },
  { id: 'streak_30', title: 'Monthly Master', description: '30-day logging streak', icon: '🏅', category: 'streak', requirement: '30 consecutive days', rarity: 'epic' },
  { id: 'streak_100', title: 'Century Champion', description: '100-day logging streak', icon: '💎', category: 'streak', requirement: '100 consecutive days', rarity: 'legendary' },
  { id: 'green_commute', title: 'Green Commuter', description: 'Log 10 bike/walk commutes', icon: '🚲', category: 'transport', requirement: '10 green commutes', rarity: 'common' },
  { id: 'public_transit', title: 'Transit Hero', description: 'Use public transit 20 times', icon: '🚇', category: 'transport', requirement: '20 public transit trips', rarity: 'rare' },
  { id: 'veg_week', title: 'Plant Pioneer', description: 'Go vegetarian for a week', icon: '🥦', category: 'diet', requirement: '7 days vegetarian', rarity: 'rare' },
  { id: 'low_carbon_day', title: 'Low Carbon Day', description: 'Keep daily emissions under 5kg', icon: '🌿', category: 'reduction', requirement: 'Daily total < 5kg CO₂', rarity: 'common' },
  { id: 'half_footprint', title: 'Half & Half', description: 'Reduce monthly footprint by 50%', icon: '📉', category: 'reduction', requirement: '50% monthly reduction', rarity: 'epic' },
  { id: 'zero_waste', title: 'Zero Waste Day', description: 'A day with zero waste emissions', icon: '♻️', category: 'reduction', requirement: 'Zero waste in a day', rarity: 'rare' },
  { id: 'energy_saver', title: 'Energy Saver', description: 'Reduce electricity by 20%', icon: '⚡', category: 'energy', requirement: '20% energy reduction', rarity: 'rare' },
  { id: 'eco_score_80', title: 'Elite Green', description: 'Reach a Carbon Score of 80+', icon: '🌟', category: 'special', requirement: 'Score ≥ 80', rarity: 'epic' },
  { id: 'first_challenge', title: 'Challenger', description: 'Complete your first challenge', icon: '🎯', category: 'special', requirement: 'Complete 1 challenge', rarity: 'common' },
  { id: 'ai_chat', title: 'AI Explorer', description: 'Have 10 conversations with EcoPilot', icon: '🤖', category: 'special', requirement: '10 AI conversations', rarity: 'common' },
  { id: 'simulator', title: 'What-If Wizard', description: 'Run 5 simulations', icon: '🔮', category: 'special', requirement: '5 simulations run', rarity: 'rare' },
];

// ---- Default Challenges ----
export const DEFAULT_CHALLENGES = [
  {
    id: 'public_transport_week',
    title: 'Public Transport Week',
    description: 'Use public transit for all commutes this week',
    category: 'transport' as const,
    type: 'weekly' as const,
    icon: '🚌',
    target: 5,
    unit: 'trips',
    rewardPoints: 50,
  },
  {
    id: 'meatless_monday',
    title: 'Meatless Days',
    description: 'Go meatless for 3 days this week',
    category: 'food' as const,
    type: 'weekly' as const,
    icon: '🥗',
    target: 3,
    unit: 'days',
    rewardPoints: 40,
  },
  {
    id: 'low_waste_week',
    title: 'Low Waste Week',
    description: 'Keep waste under 2kg this week',
    category: 'waste' as const,
    type: 'weekly' as const,
    icon: '♻️',
    target: 2,
    unit: 'kg max',
    rewardPoints: 60,
  },
  {
    id: 'energy_reduction',
    title: 'Energy Saver',
    description: 'Reduce daily electricity by 15%',
    category: 'energy' as const,
    type: 'weekly' as const,
    icon: '💡',
    target: 15,
    unit: '% reduction',
    rewardPoints: 45,
  },
  {
    id: 'walk_more',
    title: 'Step It Up',
    description: 'Walk or cycle instead of driving for 5 trips',
    category: 'transport' as const,
    type: 'weekly' as const,
    icon: '🚶',
    target: 5,
    unit: 'trips',
    rewardPoints: 35,
  },
  {
    id: 'local_food',
    title: 'Local Foodie',
    description: 'Eat locally sourced meals for 4 days',
    category: 'food' as const,
    type: 'weekly' as const,
    icon: '🌾',
    target: 4,
    unit: 'days',
    rewardPoints: 30,
  },
];

// ---- Equivalencies for making numbers relatable ----
export const EQUIVALENCIES = {
  tree_absorption_kg_per_year: 22,          // 1 tree absorbs ~22kg CO₂/year
  car_km_per_kg_co2: 5.2,                   // ~5.2 km driving per kg CO₂
  flight_hours_per_kg_co2: 0.004,            // hours of flying per kg
  smartphone_charges_per_kg_co2: 121,        // charges per kg CO₂
  led_bulb_hours_per_kg_co2: 103,            // hours of LED per kg
  netflix_hours_per_kg_co2: 28.6,            // streaming hours per kg
};

// ---- Category Config ----
export const CATEGORY_CONFIG: Record<string, { label: string; color: string; darkColor: string; icon: string }> = {
  transport: { label: 'Transport', color: '#3b82f6', darkColor: '#60a5fa', icon: '🚗' },
  energy:    { label: 'Energy',    color: '#f59e0b', darkColor: '#fbbf24', icon: '⚡' },
  food:      { label: 'Food',      color: '#10b981', darkColor: '#34d399', icon: '🍽️' },
  shopping:  { label: 'Shopping',  color: '#8b5cf6', darkColor: '#a78bfa', icon: '🛍️' },
  waste:     { label: 'Waste',     color: '#ef4444', darkColor: '#f87171', icon: '🗑️' },
  water:     { label: 'Water',     color: '#06b6d4', darkColor: '#22d3ee', icon: '💧' },
};

// ---- Quick Log Activities ----
export const QUICK_LOG_ACTIVITIES = [
  { id: 'drive_commute', label: 'Drive to work', category: 'transport' as const, type: 'car_petrol', defaultAmount: 15, unit: 'km', icon: '🚗' },
  { id: 'bus_commute', label: 'Bus commute', category: 'transport' as const, type: 'bus', defaultAmount: 15, unit: 'km', icon: '🚌' },
  { id: 'bike_commute', label: 'Bike commute', category: 'transport' as const, type: 'bicycle', defaultAmount: 10, unit: 'km', icon: '🚲' },
  { id: 'metro_ride', label: 'Metro ride', category: 'transport' as const, type: 'metro', defaultAmount: 12, unit: 'km', icon: '🚇' },
  { id: 'meat_meal', label: 'Meat meal', category: 'food' as const, type: 'chicken_meal', defaultAmount: 1, unit: 'serving', icon: '🍖' },
  { id: 'veg_meal', label: 'Vegetarian meal', category: 'food' as const, type: 'vegetarian_meal', defaultAmount: 1, unit: 'serving', icon: '🥗' },
  { id: 'vegan_meal', label: 'Vegan meal', category: 'food' as const, type: 'vegan_meal', defaultAmount: 1, unit: 'serving', icon: '🥬' },
  { id: 'electricity', label: 'Home electricity', category: 'energy' as const, type: 'electricity', defaultAmount: 8, unit: 'kWh', icon: '💡' },
  { id: 'shower', label: 'Shower', category: 'water' as const, type: 'shower', defaultAmount: 8, unit: 'min', icon: '🚿' },
  { id: 'online_shopping', label: 'Online order', category: 'shopping' as const, type: 'online_order', defaultAmount: 1, unit: 'item', icon: '📦' },
  { id: 'trash', label: 'Trash bag', category: 'waste' as const, type: 'general_waste', defaultAmount: 1.5, unit: 'kg', icon: '🗑️' },
  { id: 'recycling', label: 'Recycling', category: 'waste' as const, type: 'recycling', defaultAmount: 1, unit: 'kg', icon: '♻️' },
];
