/* ============================================
   EcoPilot AI — Constants & Config Tests
   ============================================ */

import { describe, it, expect } from 'vitest';
import {
  TRANSPORT_EMISSIONS,
  FOOD_EMISSIONS,
  ENERGY_EMISSIONS,
  SHOPPING_EMISSIONS,
  WASTE_EMISSIONS,
  SCORE_GRADES,
  ECO_LEVELS,
  QUICK_LOG_ACTIVITIES,
  CATEGORY_CONFIG,
} from '@/lib/constants';

describe('Emission Factors Integrity', () => {
  const checkFactors = (factors: Record<string, number>, name: string) => {
    it(`all ${name} factors are non-negative numbers`, () => {
      Object.entries(factors).forEach(([key, value]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  };

  checkFactors(TRANSPORT_EMISSIONS, 'TRANSPORT');
  checkFactors(FOOD_EMISSIONS, 'FOOD');
  checkFactors(ENERGY_EMISSIONS, 'ENERGY');
  checkFactors(SHOPPING_EMISSIONS, 'SHOPPING');
  checkFactors(WASTE_EMISSIONS, 'WASTE');
});

describe('Score Grades Config', () => {
  // SCORE_GRADES is an object like { 'A+': { min: 90, ... }, 'A': { min: 75, ... }, ... }
  it('grades have descending min scores', () => {
    const entries = Object.entries(SCORE_GRADES);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1][1].min).toBeGreaterThan(entries[i][1].min);
    }
  });

  it('covers the full range 0-100', () => {
    const entries = Object.entries(SCORE_GRADES);
    expect(entries[0][1].min).toBeLessThanOrEqual(100);
    expect(entries[entries.length - 1][1].min).toBe(0);
  });

  it('all grades have a label and color', () => {
    Object.values(SCORE_GRADES).forEach(grade => {
      expect(grade.label).toBeDefined();
      expect(grade.color).toBeDefined();
    });
  });
});

describe('Eco Levels Config', () => {
  it('levels are sorted in ascending order by minPoints', () => {
    for (let i = 1; i < ECO_LEVELS.length; i++) {
      expect(ECO_LEVELS[i - 1].minPoints).toBeLessThan(ECO_LEVELS[i].minPoints);
    }
  });

  it('starts at 0 points', () => {
    expect(ECO_LEVELS[0].minPoints).toBe(0);
  });

  it('each level has a title and icon', () => {
    ECO_LEVELS.forEach(level => {
      expect(level.title.length).toBeGreaterThan(0);
      expect(level.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('Quick Log Activities Integrity', () => {
  it('all quick log activities reference valid categories', () => {
    const validCategories = Object.keys(CATEGORY_CONFIG);
    QUICK_LOG_ACTIVITIES.forEach(activity => {
      expect(validCategories).toContain(activity.category);
    });
  });

  it('all quick log amounts are positive', () => {
    QUICK_LOG_ACTIVITIES.forEach(activity => {
      expect(activity.defaultAmount).toBeGreaterThan(0);
    });
  });

  it('all quick log activities have labels and icons', () => {
    QUICK_LOG_ACTIVITIES.forEach(activity => {
      expect(activity.label.length).toBeGreaterThan(0);
      expect(activity.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('Category Config', () => {
  it('contains config for all 6 main categories', () => {
    const required = ['transport', 'food', 'energy', 'shopping', 'waste', 'water'];
    required.forEach(cat => {
      expect(CATEGORY_CONFIG[cat]).toBeDefined();
    });
  });

  it('each category has a label, icon, and color', () => {
    Object.values(CATEGORY_CONFIG).forEach(config => {
      expect(config.label).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
    });
  });
});
