'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Bell, Moon, Sun, Search } from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { Badge } from '@/components/ui/Badge';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar }) => {
  const { profile, updatePreferences } = useUserStore();
  const { state: gamification } = useGamificationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    if (!profile) return;
    const newDarkMode = !profile.preferences.darkMode;
    updatePreferences({ darkMode: newDarkMode });
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync initial dark mode state
  useEffect(() => {
    if (profile?.preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.preferences.darkMode]);

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-lg md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search - placeholder for UI */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-surface-800 rounded-full text-slate-500 dark:text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-sm">Search (Ctrl+K)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && (
          <>
            {/* Level Badge */}
            <div className="hidden sm:flex items-center">
              <Badge variant="eco" size="sm" icon={gamification.levelTitle === 'Seedling' ? '🌱' : '🌿'}>
                Lvl {gamification.level}
              </Badge>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-full transition-colors"
              aria-label="Toggle dark mode"
            >
              {profile?.preferences.darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-surface-900" />
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-400 to-eco-500 flex items-center justify-center text-white font-semibold text-sm ml-2">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
