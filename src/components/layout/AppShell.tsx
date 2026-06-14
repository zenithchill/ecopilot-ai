'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUserStore } from '@/stores/user-store';
import { useActivityStore } from '@/stores/activity-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { useChatStore } from '@/stores/chat-store';
import { Loader2 } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Stores
  const { profile, hydrate: hydrateUser, isHydrated: userHydrated } = useUserStore();
  const { hydrate: hydrateActivity, isHydrated: activityHydrated } = useActivityStore();
  const { hydrate: hydrateGamification, isHydrated: gamificationHydrated } = useGamificationStore();
  const { hydrate: hydrateChat, isHydrated: chatHydrated } = useChatStore();

  const isHydrated = userHydrated && activityHydrated && gamificationHydrated && chatHydrated;

  // Hydrate all stores on mount
  useEffect(() => {
    hydrateUser();
    hydrateActivity();
    hydrateGamification();
    hydrateChat();
  }, [hydrateUser, hydrateActivity, hydrateGamification, hydrateChat]);

  // Route protection
  useEffect(() => {
    if (!isHydrated) return;

    const isPublicRoute = pathname === '/' || pathname === '/onboarding';
    
    if (!profile && !isPublicRoute) {
      router.push('/');
    } else if (profile && !profile.onboardingCompleted && pathname !== '/onboarding') {
      router.push('/onboarding');
    } else if (profile && profile.onboardingCompleted && isPublicRoute) {
      router.push('/dashboard');
    }
  }, [isHydrated, profile, pathname, router]);

  // Handle mobile sidebar close on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-eco-500 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading EcoPilot...</p>
        </div>
      </div>
    );
  }

  // If on a public route, just render children
  if (pathname === '/' || pathname === '/onboarding') {
    return <>{children}</>;
  }

  // If we should be redirecting, render nothing while router kicks in
  if (!profile || !profile.onboardingCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Background Particles - subtle decorative element */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-eco-500/5 dark:bg-eco-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-ocean-500/5 dark:bg-ocean-500/10 blur-[100px]" />
      </div>

      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onCloseMobile={() => setIsMobileSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col md:pl-64 z-10 h-screen overflow-hidden">
        <TopBar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
