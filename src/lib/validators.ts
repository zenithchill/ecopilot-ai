/* ============================================
   EcoPilot AI — Input Validators
   ============================================
   Security: sanitize all user inputs
   ============================================ */

/**
 * Sanitize a string to prevent XSS attacks
 * Strips HTML tags and limits length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/&lt;/g, '<')            // Decode common entities for re-strip
    .replace(/<[^>]*>/g, '')          // Re-strip after decode
    .replace(/javascript:/gi, '')     // Remove JS protocol
    .replace(/on\w+=/gi, '')          // Remove event handlers
    .trim()
    .slice(0, maxLength);
}

/**
 * Deep sanitize an object or array
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj) as unknown as T;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Also sanitize keys just in case
    const safeKey = sanitizeString(key);
    if (safeKey) {
      result[safeKey] = sanitizeObject(value);
    }
  }
  return result as T;
}

/**
 * Validate a chat message input
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeString(message, 2000);
  
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty', sanitized: '' };
  }
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Message too short', sanitized };
  }
  
  if (sanitized.length > 2000) {
    return { valid: false, error: 'Message too long (max 2000 characters)', sanitized };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate a numeric activity amount
 */
export function validateActivityAmount(amount: unknown): { valid: boolean; error?: string; value: number } {
  const num = Number(amount);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number', value: 0 };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative', value: 0 };
  }
  
  if (num > 10000) {
    return { valid: false, error: 'Value seems too high', value: 0 };
  }
  
  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validate user profile name
 */
export function validateName(name: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeString(name, 50);
  
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters', sanitized };
  }
  
  if (!/^[a-zA-Z\s\-'.]+$/.test(sanitized)) {
    return { valid: false, error: 'Name contains invalid characters', sanitized };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true }; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Rate limiter for API calls
 * Simple in-memory sliding window implementation
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 20, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove expired timestamps
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  getResetTimeMs(): number {
    if (this.timestamps.length === 0) return 0;
    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }
}

// Singleton rate limiter for the chat API
export const chatRateLimiter = new RateLimiter(20, 60000);

/**
 * Validate activity type against known types
 */
export function isValidActivityType(type: string, category: string): boolean {
  const validTypes: Record<string, string[]> = {
    transport: ['car_petrol', 'car_diesel', 'car_hybrid', 'car_electric', 'car_suv_petrol', 'car_suv_diesel', 'motorcycle', 'bus', 'train', 'metro', 'tram', 'bicycle', 'walking', 'e_scooter', 'carpool_2', 'carpool_3', 'taxi', 'rideshare', 'flight_domestic', 'flight_short', 'flight_long'],
    food: ['beef_meal', 'lamb_meal', 'pork_meal', 'chicken_meal', 'fish_meal', 'dairy_meal', 'vegetarian_meal', 'vegan_meal', 'eggs_meal', 'rice_meal', 'pasta_meal', 'salad_meal', 'fast_food', 'coffee', 'plant_milk', 'dairy_milk'],
    energy: ['electricity', 'natural_gas', 'heating_oil', 'wood', 'heat_pump', 'solar'],
    shopping: ['clothing_item', 'electronics_small', 'electronics_large', 'furniture', 'fast_fashion', 'secondhand', 'online_order', 'plastic_bag', 'reusable_bag'],
    waste: ['general_waste', 'recycling', 'composting', 'food_waste', 'plastic_waste', 'paper_waste', 'glass_waste', 'electronic_waste'],
    water: ['shower', 'water_usage'],
  };

  return validTypes[category]?.includes(type) ?? false;
}
