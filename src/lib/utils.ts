/* ============================================
   EcoPilot AI — Utility Functions
   ============================================ */

/**
 * Generate a unique ID.
 * Uses crypto.randomUUID if available, with a fallback to Date/Math.random.
 *
 * @returns A unique string identifier
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format a date string into a locale-friendly display format.
 *
 * @param dateStr - ISO date string to format
 * @param format  - Style of formatting ('short', 'long', or 'relative')
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (format === 'relative') {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get today's date in YYYY-MM-DD format.
 *
 * @returns ISO date string (date portion only)
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get a date N days ago in YYYY-MM-DD format.
 *
 * @param daysAgo - Number of days to subtract from today
 * @returns ISO date string (date portion only)
 */
export function getDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Format a carbon amount for display (e.g., "5.0kg", "500g", "1.5t").
 *
 * @param kg - Amount in kilograms
 * @returns Formatted string with appropriate unit prefix
 */
export function formatCarbon(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  if (kg >= 1) return `${kg.toFixed(1)}kg`;
  return `${(kg * 1000).toFixed(0)}g`;
}

/**
 * Format a carbon amount with the full unit label (e.g., "5.0 kg CO₂").
 *
 * @param kg - Amount in kilograms
 * @returns Formatted string with explicit CO₂ unit
 */
export function formatCarbonFull(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} tonnes CO₂`;
  if (kg >= 1) return `${kg.toFixed(1)} kg CO₂`;
  return `${(kg * 1000).toFixed(0)} g CO₂`;
}

/**
 * Calculate the percentage change between two values.
 *
 * @param oldVal - The initial baseline value
 * @param newVal - The new value to compare against the baseline
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function percentChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / oldVal) * 100;
}

/**
 * Clamp a numeric value so it does not exceed a specified min/max range.
 *
 * @param value - The value to clamp
 * @param min   - Minimum allowed value
 * @param max   - Maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert an amount of kg CO₂ to the equivalent number of mature trees
 * needed to offset it over one year. (1 tree absorbs ~22kg/year).
 *
 * @param kg - Amount in kilograms CO₂
 * @returns Equivalent number of trees (rounded to 1 decimal)
 */
export function kgToTrees(kg: number): number {
  return Math.round((kg / 22) * 10) / 10;
}

/**
 * Convert an amount of kg CO₂ to the equivalent distance driven in an
 * average petrol car. (1kg CO₂ ≈ 5.2 km driving).
 *
 * @param kg - Amount in kilograms CO₂
 * @returns Equivalent driving distance in kilometers (rounded)
 */
export function kgToDrivingKm(kg: number): number {
  return Math.round(kg * 5.2);
}

/**
 * Create a debounced version of a function that delays execution until
 * after the specified wait time has elapsed since the last call.
 *
 * @param func - The function to debounce
 * @param wait - Delay duration in milliseconds
 * @returns Debounced function wrapper
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get a time-appropriate greeting message based on the user's local clock.
 *
 * @returns Greeting string (e.g., "Good morning")
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Generate a consistent, aesthetically pleasing HSL color string from any input string.
 * Uses a simple hash function to map strings to a 360-degree hue spectrum.
 *
 * @param str - Input string to hash
 * @returns Valid CSS HSL color string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
}

/**
 * Safely parse a JSON string, returning a fallback value if parsing fails.
 *
 * @param json     - JSON string to parse
 * @param fallback - Value to return if parsing throws an error
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate an array of all date strings (YYYY-MM-DD) between a start and end date.
 *
 * @param startDate - Start date string
 * @param endDate   - End date string
 * @returns Array of date strings inclusive of bounds
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Group an array of items by their `category` property.
 *
 * @param items - Array of items containing a `category` string field
 * @returns Object mapping category names to arrays of matching items
 */
export function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
