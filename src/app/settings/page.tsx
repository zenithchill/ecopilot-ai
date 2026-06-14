'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/stores/user-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { exportAllData, clearAllStorage } from '@/lib/storage';
import { Save, Download, Trash2, Moon, Sun, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { profile, setProfile, updatePreferences } = useUserStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return null;

  const handleSaveProfile = () => {
    setIsSaving(true);
    setProfile({ name });
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile updated!');
    }, 500);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to delete ALL your data? This action cannot be undone.')) {
      clearAllStorage();
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in-up pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile, preferences, and data.</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <section className="bg-white dark:bg-surface-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Profile</h2>
          
          <div className="space-y-4 max-w-md">
            <Input 
              label="Display Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
            
            <div className="pt-2">
              <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white dark:bg-surface-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Preferences</h2>
          
          <div className="space-y-6">
            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400">
                  {profile.preferences.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-slate-500">Toggle dark theme</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={profile.preferences.darkMode}
                  onChange={(e) => {
                    updatePreferences({ darkMode: e.target.checked });
                    if (e.target.checked) document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                  }}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-eco-300 dark:peer-focus:ring-eco-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-eco-500"></div>
              </label>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Smart Notifications</p>
                  <p className="text-sm text-slate-500">Receive contextual tips</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={profile.preferences.notifications}
                  onChange={(e) => updatePreferences({ notifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-eco-300 dark:peer-focus:ring-eco-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-eco-500"></div>
              </label>
            </div>

            {/* Units */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Measurement Units</p>
                  <p className="text-sm text-slate-500">Metric (kg/km) vs Imperial</p>
                </div>
              </div>
              <select 
                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-eco-500"
                value={profile.preferences.units}
                onChange={(e) => updatePreferences({ units: e.target.value as 'metric' | 'imperial' })}
              >
                <option value="metric">Metric</option>
                <option value="imperial" disabled>Imperial (Soon)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white dark:bg-surface-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Export Data</p>
                <p className="text-sm text-slate-500">Download all your activity logs as JSON.</p>
              </div>
              <Button variant="outline" onClick={exportAllData} leftIcon={<Download className="w-4 h-4" />}>
                Export JSON
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
              <div>
                <p className="font-medium text-red-900 dark:text-red-400">Delete Account & Data</p>
                <p className="text-sm text-red-700 dark:text-red-300">Permanently remove all data from this device.</p>
              </div>
              <Button variant="danger" onClick={handleResetData} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete Data
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
