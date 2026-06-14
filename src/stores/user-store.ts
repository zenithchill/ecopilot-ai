/* ============================================
   EcoPilot AI — User Store (Zustand)
   ============================================ */
'use client';

import { create } from 'zustand';
import type { UserProfile, UserPreferences, LifestyleProfile } from '@/types';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { generateId } from '@/lib/utils';

const DEFAULT_LIFESTYLE: LifestyleProfile = {
  primaryTransport: 'car',
  dailyCommuteKm: 15,
  carType: 'petrol',
  flightsPerYear: 2,
  dietType: 'omnivore',
  meatMealsPerWeek: 7,
  localFoodPercentage: 30,
  homeType: 'apartment',
  electricityKwhPerMonth: 250,
  heatingSource: 'natural_gas',
  hasRenewableEnergy: false,
  hasSolarPanels: false,
  shoppingFrequency: 'moderate',
  recyclingHabit: 'sometimes',
  waterUsage: 'average',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: true,
  notifications: true,
  units: 'metric',
  currency: 'USD',
};

interface UserState {
  profile: UserProfile | null;
  isHydrated: boolean;
  // Actions
  hydrate: () => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  updateLifestyle: (lifestyle: Partial<LifestyleProfile>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
  createProfile: (name: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isHydrated: false,

  hydrate: () => {
    const stored = getStorageItem<UserProfile | null>('user_profile', null);
    set({ profile: stored, isHydrated: true });
  },

  createProfile: (name: string) => {
    const profile: UserProfile = {
      id: generateId(),
      name,
      joinedAt: new Date().toISOString(),
      onboardingCompleted: false,
      preferences: { ...DEFAULT_PREFERENCES },
      lifestyle: { ...DEFAULT_LIFESTYLE },
    };
    setStorageItem('user_profile', profile);
    set({ profile });
  },

  setProfile: (updates) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates };
    setStorageItem('user_profile', updated);
    set({ profile: updated });
  },

  updateLifestyle: (lifestyle) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, lifestyle: { ...current.lifestyle, ...lifestyle } };
    setStorageItem('user_profile', updated);
    set({ profile: updated });
  },

  updatePreferences: (prefs) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, preferences: { ...current.preferences, ...prefs } };
    setStorageItem('user_profile', updated);
    set({ profile: updated });
  },

  completeOnboarding: () => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, onboardingCompleted: true };
    setStorageItem('user_profile', updated);
    set({ profile: updated });
  },

  resetProfile: () => {
    setStorageItem('user_profile', null);
    set({ profile: null });
  },
}));
