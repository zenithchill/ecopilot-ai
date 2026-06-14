/* ============================================
   EcoPilot AI — Validators Tests
   ============================================ */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  validateChatMessage,
  validateActivityAmount,
  validateName,
  validateEmail,
  RateLimiter,
  isValidActivityType,
} from '@/lib/validators';

describe('sanitizeString', () => {
  it('removes HTML tags', () => {
    expect(sanitizeString('<b>hello</b>')).toBe('hello');
    expect(sanitizeString('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('removes on-event handlers', () => {
    expect(sanitizeString('hello onerror=alert(1)')).toBe('hello alert(1)');
    expect(sanitizeString('onclick=test()')).toBe('test()');
  });

  it('allows safe strings', () => {
    expect(sanitizeString('Hello World 123!')).toBe('Hello World 123!');
    expect(sanitizeString('https://example.com')).toBe('https://example.com');
  });

  it('trims and limits length', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('a'.repeat(2000), 10)).toBe('a'.repeat(10));
  });

  it('returns empty for non-string', () => {
    expect(sanitizeString(123 as any)).toBe('');
    expect(sanitizeString(null as any)).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('sanitizes string values', () => {
    const obj = { name: '<b>test</b>' };
    expect(sanitizeObject(obj).name).toBe('test');
  });

  it('sanitizes nested objects', () => {
    const obj = { nested: { value: '<script>x</script>' } };
    expect(sanitizeObject(obj).nested.value).toBe('x');
  });

  it('sanitizes arrays', () => {
    const arr = ['<b>a</b>', '<i>b</i>'];
    const result = sanitizeObject(arr);
    expect(result).toEqual(['a', 'b']);
  });

  it('passes through numbers and booleans', () => {
    expect(sanitizeObject(42)).toBe(42);
    expect(sanitizeObject(true)).toBe(true);
  });

  it('passes through null and undefined', () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });
});

describe('validateChatMessage', () => {
  it('rejects empty messages', () => {
    expect(validateChatMessage('').valid).toBe(false);
    expect(validateChatMessage('   ').valid).toBe(false);
  });

  it('rejects messages that are too short', () => {
    expect(validateChatMessage('a').valid).toBe(false);
  });

  it('accepts valid messages', () => {
    const result = validateChatMessage('Hello there');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Hello there');
  });

  it('returns sanitized message', () => {
    const result = validateChatMessage('<b>Hello</b> there');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Hello there');
  });
});

describe('validateActivityAmount', () => {
  it('rejects negative amounts', () => {
    expect(validateActivityAmount(-1).valid).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateActivityAmount('abc').valid).toBe(false);
  });

  it('rejects unrealistically high amounts', () => {
    expect(validateActivityAmount(10001).valid).toBe(false);
  });

  it('accepts valid amounts', () => {
    expect(validateActivityAmount(0).valid).toBe(true);
    expect(validateActivityAmount(10).valid).toBe(true);
    expect(validateActivityAmount(10000).valid).toBe(true);
  });

  it('returns rounded value', () => {
    expect(validateActivityAmount(10.555).value).toBe(10.56);
  });
});

describe('validateName', () => {
  it('rejects empty names', () => {
    expect(validateName('').valid).toBe(false);
  });

  it('rejects short names', () => {
    expect(validateName('A').valid).toBe(false);
  });

  it('rejects names with special characters', () => {
    expect(validateName('John@Doe').valid).toBe(false);
    expect(validateName('Jane$Smith').valid).toBe(false);
  });

  it('accepts valid names', () => {
    expect(validateName('John Doe').valid).toBe(true);
    expect(validateName('Anne-Marie').valid).toBe(true);
    expect(validateName("O'Connor").valid).toBe(true);
  });

  it('returns sanitized name', () => {
    expect(validateName('  John Doe  ').sanitized).toBe('John Doe');
  });
});

describe('validateEmail', () => {
  it('accepts empty email (since it is optional)', () => {
    expect(validateEmail('').valid).toBe(true);
    expect(validateEmail(undefined as any).valid).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('test@').valid).toBe(false);
    expect(validateEmail('@domain.com').valid).toBe(false);
  });

  it('accepts valid emails', () => {
    expect(validateEmail('test@example.com').valid).toBe(true);
    expect(validateEmail('user.name+tag@domain.co.uk').valid).toBe(true);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('allows requests within limit', () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('blocks requests over limit', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('resets after window expires', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('returns remaining requests', () => {
    const limiter = new RateLimiter(5, 1000);
    expect(limiter.getRemainingRequests()).toBe(5);
    limiter.canMakeRequest();
    expect(limiter.getRemainingRequests()).toBe(4);
  });

  it('returns reset time', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.canMakeRequest();
    const resetTime = limiter.getResetTimeMs();
    expect(resetTime).toBeGreaterThan(0);
    expect(resetTime).toBeLessThanOrEqual(1000);
  });

  it('returns 0 reset time when no requests made', () => {
    const limiter = new RateLimiter(5, 1000);
    expect(limiter.getResetTimeMs()).toBe(0);
  });
});

describe('isValidActivityType', () => {
  it('accepts valid category-type combinations', () => {
    // Note: signature is isValidActivityType(type, category)
    expect(isValidActivityType('car_petrol', 'transport')).toBe(true);
    expect(isValidActivityType('beef_meal', 'food')).toBe(true);
    expect(isValidActivityType('electricity', 'energy')).toBe(true);
  });

  it('rejects invalid categories', () => {
    expect(isValidActivityType('car_petrol', 'invalid')).toBe(false);
  });

  it('rejects invalid types for a category', () => {
    expect(isValidActivityType('beef_meal', 'transport')).toBe(false);
    expect(isValidActivityType('electricity', 'food')).toBe(false);
  });
});
