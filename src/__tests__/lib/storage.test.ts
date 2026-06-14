/* ============================================
   EcoPilot AI — Storage Tests
   ============================================ */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearAllStorage,
  exportAllData,
  generateSampleData,
} from '@/lib/storage';

describe('Storage Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setStorageItem & getStorageItem', () => {
    it('saves and retrieves string data', () => {
      setStorageItem('test_key', 'test_value');
      expect(getStorageItem('test_key', null)).toBe('test_value');
    });

    it('saves and retrieves JSON data', () => {
      const data = { a: 1, b: 'test' };
      setStorageItem('test_json', data);
      expect(getStorageItem('test_json', null)).toEqual(data);
    });

    it('returns fallback for non-existent key', () => {
      expect(getStorageItem('missing_key', 'default')).toBe('default');
      expect(getStorageItem('missing_key', null)).toBeNull();
    });

    it('uses ecopilot_ prefix in localStorage', () => {
      setStorageItem('mykey', 'myvalue');
      // Raw access should use the prefix
      expect(localStorage.getItem('ecopilot_mykey')).toBe('"myvalue"');
    });
  });

  describe('removeStorageItem', () => {
    it('removes an item', () => {
      setStorageItem('test_key', 'test_value');
      removeStorageItem('test_key');
      expect(getStorageItem('test_key', null)).toBeNull();
    });
  });

  describe('clearAllStorage', () => {
    it('clears all ecopilot data', () => {
      setStorageItem('profile', '1');
      setStorageItem('activity', '2');
      // Also set a non-ecopilot item directly
      localStorage.setItem('other-app-data', '3');
      
      clearAllStorage();
      
      expect(getStorageItem('profile', null)).toBeNull();
      expect(getStorageItem('activity', null)).toBeNull();
      // Non-ecopilot data should remain
      expect(localStorage.getItem('other-app-data')).toBe('3');
    });
  });

  describe('exportAllData', () => {
    it('returns JSON string of all ecopilot data', () => {
      setStorageItem('test', { data: 123 });
      
      const exported = exportAllData();
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed.test).toEqual({ data: 123 });
    });

    it('returns empty object for no data', () => {
      const exported = exportAllData();
      expect(JSON.parse(exported)).toEqual({});
    });
  });

  describe('generateSampleData', () => {
    it('generates 30 days of data', () => {
      const data = generateSampleData();
      expect(data).toHaveLength(30);
    });

    it('includes realistic activities', () => {
      const data = generateSampleData();
      const allActivities = data.flatMap(d => d.activities);
      expect(allActivities.length).toBeGreaterThan(0);
      
      // Should have generated activities across categories
      const categories = new Set(allActivities.map(a => a.category));
      expect(categories.has('transport')).toBe(true);
      expect(categories.has('food')).toBe(true);
      expect(categories.has('energy')).toBe(true);
    });

    it('each log has totalCarbonKg calculated', () => {
      const data = generateSampleData();
      for (const log of data) {
        const expected = log.activities.reduce((s, a) => s + a.carbonKg, 0);
        expect(log.totalCarbonKg).toBeCloseTo(expected, 1);
      }
    });

    it('has valid date strings', () => {
      const data = generateSampleData();
      for (const log of data) {
        expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });
});
