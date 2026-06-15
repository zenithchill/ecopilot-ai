/* ============================================
   EcoPilot AI — Utility Functions Tests
   ============================================ */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  formatDate,
  getToday,
  getDaysAgo,
  formatCarbon,
  formatCarbonFull,
  percentChange,
  clamp,
  kgToTrees,
  kgToDrivingKm,
  debounce,
  getGreeting,
  stringToColor,
  safeJsonParse,
  getDateRange,
  groupByCategory,
} from '@/lib/utils';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('formats short date correctly', () => {
    const result = formatDate('2026-01-15', 'short');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('formats long date correctly', () => {
    const result = formatDate('2026-01-15', 'long');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('formats relative date — just now', () => {
    const now = new Date().toISOString();
    const result = formatDate(now, 'relative');
    expect(result).toBe('just now');
  });

  it('formats relative date — minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60000).toISOString();
    const result = formatDate(past, 'relative');
    expect(result).toMatch(/5m ago/);
  });

  it('formats relative date — hours ago', () => {
    const past = new Date(Date.now() - 3 * 3600000).toISOString();
    const result = formatDate(past, 'relative');
    expect(result).toMatch(/3h ago/);
  });

  it('formats relative date — days ago', () => {
    const past = new Date(Date.now() - 2 * 86400000).toISOString();
    const result = formatDate(past, 'relative');
    expect(result).toMatch(/2d ago/);
  });

  it('defaults to short format', () => {
    const result = formatDate('2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});

describe('getToday', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const today = getToday();
    const expected = new Date().toISOString().split('T')[0];
    expect(today).toBe(expected);
  });
});

describe('getDaysAgo', () => {
  it('returns correct date for 0 days ago', () => {
    expect(getDaysAgo(0)).toBe(getToday());
  });

  it('returns YYYY-MM-DD format', () => {
    expect(getDaysAgo(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns earlier date for positive days', () => {
    const result = getDaysAgo(7);
    expect(result < getToday()).toBe(true);
  });
});

describe('formatCarbon', () => {
  it('formats grams for values < 1 kg', () => {
    expect(formatCarbon(0.5)).toBe('500g');
    expect(formatCarbon(0.001)).toBe('1g');
  });

  it('formats kg for values >= 1', () => {
    expect(formatCarbon(5)).toBe('5.0kg');
    expect(formatCarbon(10.5)).toBe('10.5kg');
  });

  it('formats tonnes for values >= 1000', () => {
    expect(formatCarbon(1000)).toBe('1.0t');
    expect(formatCarbon(5500)).toBe('5.5t');
  });
});

describe('formatCarbonFull', () => {
  it('includes CO₂ unit label', () => {
    expect(formatCarbonFull(5)).toContain('CO₂');
  });

  it('formats grams with CO₂ label', () => {
    expect(formatCarbonFull(0.5)).toContain('g CO₂');
  });

  it('formats kg with CO₂ label', () => {
    expect(formatCarbonFull(5)).toContain('kg CO₂');
  });

  it('formats tonnes with CO₂ label', () => {
    expect(formatCarbonFull(1500)).toContain('tonnes CO₂');
  });
});

describe('percentChange', () => {
  it('calculates positive change', () => {
    expect(percentChange(100, 150)).toBe(50);
  });

  it('calculates negative change', () => {
    expect(percentChange(100, 50)).toBe(-50);
  });

  it('handles zero old value', () => {
    expect(percentChange(0, 50)).toBe(100);
    expect(percentChange(0, 0)).toBe(0);
  });

  it('returns 0 for no change', () => {
    expect(percentChange(100, 100)).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('kgToTrees', () => {
  it('calculates trees correctly', () => {
    // 1 tree absorbs ~22kg/year, returns rounded to 1 decimal
    expect(kgToTrees(22)).toBe(1);
    expect(kgToTrees(44)).toBe(2);
    expect(kgToTrees(11)).toBe(0.5);
  });

  it('handles zero', () => {
    expect(kgToTrees(0)).toBe(0);
  });
});

describe('kgToDrivingKm', () => {
  it('calculates km correctly', () => {
    // Math.round(kg * 5.2)
    expect(kgToDrivingKm(1)).toBe(5); // Math.round(5.2) = 5
    expect(kgToDrivingKm(10)).toBe(52);
  });

  it('handles zero', () => {
    expect(kgToDrivingKm(0)).toBe(0);
  });
});

describe('debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // reset
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('getGreeting', () => {
  it('returns a non-empty string', () => {
    const greeting = getGreeting();
    expect(typeof greeting).toBe('string');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('returns one of the expected greetings', () => {
    const valid = ['Good morning', 'Good afternoon', 'Good evening'];
    expect(valid).toContain(getGreeting());
  });
});

describe('stringToColor', () => {
  it('returns an HSL color string', () => {
    const color = stringToColor('transport');
    expect(color).toMatch(/^hsl\(-?\d+, 65%, 55%\)$/);
  });

  it('returns consistent colors for same input', () => {
    expect(stringToColor('test')).toBe(stringToColor('test'));
  });

  it('returns different colors for different inputs', () => {
    expect(stringToColor('transport')).not.toBe(stringToColor('food'));
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', { default: true })).toEqual({ default: true });
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('', 42)).toBe(42);
  });
});

describe('getDateRange', () => {
  it('returns array of dates between start and end', () => {
    const range = getDateRange('2026-01-01', '2026-01-05');
    expect(range).toHaveLength(5);
    expect(range[0]).toBe('2026-01-01');
    expect(range[4]).toBe('2026-01-05');
  });

  it('returns single date when start equals end', () => {
    const range = getDateRange('2026-01-01', '2026-01-01');
    expect(range).toHaveLength(1);
  });
});

describe('groupByCategory', () => {
  it('groups items by category', () => {
    const items = [
      { category: 'a', value: 1 },
      { category: 'b', value: 2 },
      { category: 'a', value: 3 },
    ];
    const grouped = groupByCategory(items);
    expect(grouped['a']).toHaveLength(2);
    expect(grouped['b']).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    expect(groupByCategory([])).toEqual({});
  });
});
