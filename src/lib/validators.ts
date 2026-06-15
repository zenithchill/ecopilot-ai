/* ============================================
   EcoPilot AI — Input Validators
   ============================================
   Security: sanitize all user inputs before
   processing or persisting them.
   ============================================ */

/** Maximum allowed length for generic sanitized strings */
const DEFAULT_MAX_LENGTH = 1000;
/** Maximum allowed length for chat messages */
const CHAT_MAX_LENGTH = 2000;
/** Minimum allowed length for chat messages */
const CHAT_MIN_LENGTH = 2;
/** Maximum allowed length for user names */
const NAME_MAX_LENGTH = 50;
/** Minimum allowed length for user names */
const NAME_MIN_LENGTH = 2;
/** Maximum reasonable value for any single activity amount */
const ACTIVITY_AMOUNT_CEILING = 10000;
/** Default rate-limit: requests per window */
const DEFAULT_RATE_LIMIT_REQUESTS = 20;
/** Default rate-limit: window duration in milliseconds (1 minute) */
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Pattern matching HTML tags */
const HTML_TAG_PATTERN = /<[^>]*>/g;
/** Pattern matching dangerous URI schemes */
const JS_PROTOCOL_PATTERN = /javascript:/gi;
const DATA_URI_PATTERN = /data:/gi;
const VB_PROTOCOL_PATTERN = /vbscript:/gi;
/** Pattern matching inline event handlers like `onclick=`, `onerror=` */
const EVENT_HANDLER_PATTERN = /on\w+=/gi;
/** Pattern for common HTML entities that could bypass sanitization */
const HTML_ENTITY_LT_PATTERN = /&lt;/g;
/** Pattern for valid names */
const VALID_NAME_PATTERN = /^[a-zA-Z\s\-'.]+$/;
/** RFC 5322-simplified email pattern */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Object keys that should never appear (prototype pollution protection) */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Sanitize a string to prevent XSS attacks.
 * Strips HTML tags, dangerous URI schemes, inline event handlers,
 * trims whitespace, and enforces a maximum length.
 */
export function sanitizeString(input: string, maxLength: number = DEFAULT_MAX_LENGTH): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(HTML_TAG_PATTERN, '')
    .replace(HTML_ENTITY_LT_PATTERN, '<')
    .replace(HTML_TAG_PATTERN, '')
    .replace(JS_PROTOCOL_PATTERN, '')
    .replace(DATA_URI_PATTERN, '')
    .replace(VB_PROTOCOL_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Deep-sanitize an object, array, or primitive value.
 * Protects against prototype pollution by rejecting dangerous keys.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj) as unknown as T;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const safeKey = sanitizeString(key);
    if (safeKey) {
      result[safeKey] = sanitizeObject(value);
    }
  }
  return result as T;
}

/**
 * Validate a chat message input.
 * Sanitizes the message and checks length constraints.
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeString(message, CHAT_MAX_LENGTH);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty', sanitized: '' };
  }
  if (sanitized.length < CHAT_MIN_LENGTH) {
    return { valid: false, error: 'Message too short', sanitized };
  }
  if (sanitized.length > CHAT_MAX_LENGTH) {
    return { valid: false, error: `Message too long (max ${CHAT_MAX_LENGTH} characters)`, sanitized };
  }
  return { valid: true, sanitized };
}

/**
 * Validate a numeric activity amount.
 * Ensures the value is a finite, non-negative number within a reasonable range.
 */
export function validateActivityAmount(amount: unknown): { valid: boolean; error?: string; value: number } {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Must be a number', value: 0 };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative', value: 0 };
  }
  if (num > ACTIVITY_AMOUNT_CEILING) {
    return { valid: false, error: 'Value seems too high', value: 0 };
  }
  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Validate a user profile name.
 * Only letters, spaces, hyphens, apostrophes, and periods are allowed.
 */
export function validateName(name: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeString(name, NAME_MAX_LENGTH);
  if (!sanitized || sanitized.length < NAME_MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${NAME_MIN_LENGTH} characters`, sanitized };
  }
  if (!VALID_NAME_PATTERN.test(sanitized)) {
    return { valid: false, error: 'Name contains invalid characters', sanitized };
  }
  return { valid: true, sanitized };
}

/**
 * Validate an email address format.
 * Email is an optional field — empty/undefined values are accepted.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true };
  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Sliding-window rate limiter for API calls.
 * Tracks request timestamps in memory and enforces a maximum number
 * of requests within a configurable time window.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(
    maxRequests: number = DEFAULT_RATE_LIMIT_REQUESTS,
    windowMs: number = DEFAULT_RATE_LIMIT_WINDOW_MS,
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Prune expired timestamps from the internal tracking array. */
  private pruneExpired(): void {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);
  }

  /** Check if a new request is allowed and record it if so. */
  canMakeRequest(): boolean {
    this.pruneExpired();
    if (this.timestamps.length >= this.maxRequests) return false;
    this.timestamps.push(Date.now());
    return true;
  }

  /** Get the number of remaining requests allowed in the current window. */
  getRemainingRequests(): number {
    this.pruneExpired();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /** Get time in ms until the oldest request expires. Returns 0 if empty. */
  getResetTimeMs(): number {
    if (this.timestamps.length === 0) return 0;
    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }
}

/** Singleton rate limiter for the chat API */
export const chatRateLimiter = new RateLimiter(DEFAULT_RATE_LIMIT_REQUESTS, DEFAULT_RATE_LIMIT_WINDOW_MS);

/** Known valid activity types grouped by category */
const VALID_ACTIVITY_TYPES: Readonly<Record<string, readonly string[]>> = {
  transport: ['car_petrol', 'car_diesel', 'car_hybrid', 'car_electric', 'car_suv_petrol', 'car_suv_diesel', 'motorcycle', 'bus', 'train', 'metro', 'tram', 'bicycle', 'walking', 'e_scooter', 'carpool_2', 'carpool_3', 'taxi', 'rideshare', 'flight_domestic', 'flight_short', 'flight_long'],
  food: ['beef_meal', 'lamb_meal', 'pork_meal', 'chicken_meal', 'fish_meal', 'dairy_meal', 'vegetarian_meal', 'vegan_meal', 'eggs_meal', 'rice_meal', 'pasta_meal', 'salad_meal', 'fast_food', 'coffee', 'plant_milk', 'dairy_milk'],
  energy: ['electricity', 'natural_gas', 'heating_oil', 'wood', 'heat_pump', 'solar'],
  shopping: ['clothing_item', 'electronics_small', 'electronics_large', 'furniture', 'fast_fashion', 'secondhand', 'online_order', 'plastic_bag', 'reusable_bag'],
  waste: ['general_waste', 'recycling', 'composting', 'food_waste', 'plastic_waste', 'paper_waste', 'glass_waste', 'electronic_waste'],
  water: ['shower', 'water_usage'],
};

/**
 * Validate an activity type against the known valid types for its category.
 */
export function isValidActivityType(type: string, category: string): boolean {
  const validTypes = VALID_ACTIVITY_TYPES[category];
  return validTypes?.includes(type) ?? false;
}
