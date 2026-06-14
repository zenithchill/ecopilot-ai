/* ============================================
   EcoPilot AI — Gamification Store (Zustand)
   ============================================ */
'use client';

import { create } from 'zustand';
import type { GamificationState, Badge, Challenge } from '@/types';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { DEFAULT_BADGES, DEFAULT_CHALLENGES, ECO_LEVELS } from '@/lib/constants';
import { getToday, generateId } from '@/lib/utils';

const initBadges = (): Badge[] => DEFAULT_BADGES.map(b => ({ ...b, earned: false, progress: 0 }));

const initChallenges = (): Challenge[] => {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + 7);
  return DEFAULT_CHALLENGES.slice(0, 3).map(c => ({
    ...c, id: generateId(), current: 0, startDate: now.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0], completed: false,
  }));
};

const getLevel = (points: number) => {
  let current = ECO_LEVELS[0];
  for (const lvl of ECO_LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
    else break;
  }
  return current;
};

interface GamificationActions {
  isHydrated: boolean;
  state: GamificationState;
  hydrate: () => void;
  addPoints: (points: number) => void;
  updateStreak: () => void;
  earnBadge: (badgeId: string) => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  checkBadgeEligibility: (totalActivities: number, chatCount: number) => void;
  resetGamification: () => void;
}

export const useGamificationStore = create<GamificationActions>((set, get) => ({
  isHydrated: false,
  state: {
    ecoPoints: 0, level: 1, levelTitle: 'Seedling', currentStreak: 0, longestStreak: 0,
    lastLogDate: null, badges: initBadges(), activeChallenges: initChallenges(),
    completedChallenges: [], weeklyRank: 42,
  },

  hydrate: () => {
    const stored = getStorageItem<GamificationState | null>('gamification', null);
    if (stored) {
      // Ensure badges array is complete
      const badges = DEFAULT_BADGES.map(db => {
        const existing = stored.badges.find(b => b.id === db.id);
        return existing ?? { ...db, earned: false, progress: 0 };
      });
      set({ state: { ...stored, badges }, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },

  addPoints: (points) => {
    const s = get().state;
    const newPoints = s.ecoPoints + points;
    const lvl = getLevel(newPoints);
    const updated = { ...s, ecoPoints: newPoints, level: lvl.level, levelTitle: lvl.title };
    setStorageItem('gamification', updated);
    set({ state: updated });
  },

  updateStreak: () => {
    const s = get().state;
    const today = getToday();
    if (s.lastLogDate === today) return; // Already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (s.lastLogDate === yesterdayStr) {
      newStreak = s.currentStreak + 1;
    }

    const updated = {
      ...s,
      currentStreak: newStreak,
      longestStreak: Math.max(s.longestStreak, newStreak),
      lastLogDate: today,
    };
    setStorageItem('gamification', updated);
    set({ state: updated });
  },

  earnBadge: (badgeId) => {
    const s = get().state;
    const badges = s.badges.map(b =>
      b.id === badgeId && !b.earned ? { ...b, earned: true, earnedAt: new Date().toISOString(), progress: 100 } : b
    );
    const updated = { ...s, badges };
    setStorageItem('gamification', updated);
    set({ state: updated });
  },

  updateChallengeProgress: (challengeId, progress) => {
    const s = get().state;
    const activeChallenges = s.activeChallenges.map(c => {
      if (c.id !== challengeId) return c;
      const completed = progress >= c.target;
      return { ...c, current: progress, completed };
    });
    const completed = activeChallenges.filter(c => c.completed).map(c => c.id);
    const updated = {
      ...s,
      activeChallenges,
      completedChallenges: Array.from(new Set([...s.completedChallenges, ...completed])),
    };
    setStorageItem('gamification', updated);
    set({ state: updated });
  },

  checkBadgeEligibility: (totalActivities, chatCount) => {
    const s = get().state;
    const earnBadge = get().earnBadge;
    if (totalActivities >= 1) earnBadge('first_log');
    if (s.currentStreak >= 3) earnBadge('streak_3');
    if (s.currentStreak >= 7) earnBadge('streak_7');
    if (s.currentStreak >= 30) earnBadge('streak_30');
    if (s.currentStreak >= 100) earnBadge('streak_100');
    if (chatCount >= 10) earnBadge('ai_chat');
  },

  resetGamification: () => {
    const fresh: GamificationState = {
      ecoPoints: 0, level: 1, levelTitle: 'Seedling', currentStreak: 0, longestStreak: 0,
      lastLogDate: null, badges: initBadges(), activeChallenges: initChallenges(),
      completedChallenges: [], weeklyRank: 42,
    };
    setStorageItem('gamification', fresh);
    set({ state: fresh });
  },
}));
