'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart2, 
  Trophy, 
  Settings, 
  Leaf,
  LogOut,
  LineChart
} from 'lucide-react';
import { useUserStore } from '@/stores/user-store';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const resetProfile = useUserStore(state => state.resetProfile);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'EcoPilot AI', href: '/assistant', icon: MessageSquare },
    { label: 'Analytics', href: '/analytics', icon: BarChart2 },
    { label: 'Simulator', href: '/simulator', icon: LineChart },
    { label: 'Challenges', href: '/challenges', icon: Trophy },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
      localStorage.clear();
      resetProfile();
      window.location.href = '/';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onCloseMobile}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-500 to-ocean-500 flex items-center justify-center text-white shadow-glow">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">EcoPilot</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 hide-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'text-eco-700 dark:text-eco-400 bg-eco-50 dark:bg-eco-950/50' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-eco-600 dark:text-eco-400' : ''}`} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-6 bg-eco-500 rounded-r-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <Link
          href="/settings"
          onClick={onCloseMobile}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${pathname === '/settings' 
              ? 'text-eco-700 dark:text-eco-400 bg-eco-50 dark:bg-eco-950/50' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800 hover:text-slate-900 dark:hover:text-slate-200'
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Reset Data</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Need to import AnimatePresence
import { AnimatePresence } from 'framer-motion';
