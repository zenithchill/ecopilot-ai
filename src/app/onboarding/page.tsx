'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user-store';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Car, Bus, Zap } from 'lucide-react';
import { calculateCarbonScore } from '@/lib/carbon-engine';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, createProfile, updateLifestyle, completeOnboarding } = useUserStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  
  // Local state for lifestyle data
  const [lifestyle, setLifestyle] = useState({
    primaryTransport: 'car',
    dailyCommuteKm: 15,
    carType: 'petrol',
    dietType: 'omnivore',
    meatMealsPerWeek: 7,
    homeType: 'apartment',
    electricityKwhPerMonth: 250,
    hasRenewableEnergy: false,
    shoppingFrequency: 'moderate',
    recyclingHabit: 'sometimes',
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      if (step === 0) setStep(1);
    }
  }, [profile, step]);

  const handleNext = () => {
    if (step === 0) {
      if (name.trim().length < 2) return;
      createProfile(name);
      setStep(1);
    } else if (step < 4) {
      setStep(step + 1);
    } else {
      // Finalize
      updateLifestyle(lifestyle as Partial<import('@/types').LifestyleProfile>);
      completeOnboarding();
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const steps = [
    { title: 'Welcome', icon: '👋' },
    { title: 'Transport', icon: '🚗' },
    { title: 'Diet', icon: '🥗' },
    { title: 'Energy', icon: '⚡' },
    { title: 'Lifestyle', icon: '🌍' },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-eco-500/10 blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="p-6 relative z-10 flex justify-between items-center max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-500 to-ocean-500 flex items-center justify-center text-white shadow-glow text-sm font-bold">
            E
          </div>
          <span className="font-display font-bold text-lg tracking-tight">EcoPilot</span>
        </div>
        {step > 0 && (
          <div className="w-48 hidden sm:block">
            <Progress value={(step / 4) * 100} size="sm" variant="gradient" />
            <p className="text-xs text-right mt-1 text-slate-500">Step {step} of 4</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-surface-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-slate-800"
            >
              {/* Step 0: Name */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-display font-bold">Welcome aboard! 👋</h1>
                    <p className="text-slate-500 dark:text-slate-400">Let&apos;s start your sustainability journey. What should we call you?</p>
                  </div>
                  <Input 
                    placeholder="Your name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg py-4"
                    autoFocus
                  />
                  <Button 
                    className="w-full text-lg py-4" 
                    onClick={handleNext}
                    disabled={name.trim().length < 2}
                  >
                    Let&apos;s Go
                  </Button>
                </div>
              )}

              {/* Step 1: Transport */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">How do you get around? 🚗</h2>
                    <p className="text-slate-500 dark:text-slate-400">Transport is often the largest part of a carbon footprint.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Commute Mode</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'car', label: 'Car', icon: <Car className="w-5 h-5 mb-1" /> },
                        { id: 'public_transit', label: 'Transit', icon: <Bus className="w-5 h-5 mb-1" /> },
                        { id: 'bicycle', label: 'Bike', icon: <div className="text-xl mb-1">🚲</div> },
                        { id: 'walking', label: 'Walk', icon: <div className="text-xl mb-1">🚶</div> },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setLifestyle(s => ({ ...s, primaryTransport: mode.id }))}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                            lifestyle.primaryTransport === mode.id 
                              ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20 text-eco-700 dark:text-eco-400' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {mode.icon}
                          <span className="text-xs font-medium">{mode.label}</span>
                        </button>
                      ))}
                    </div>

                    {lifestyle.primaryTransport === 'car' && (
                      <div className="animate-fade-in space-y-3 pt-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Car Type</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-eco-500"
                          value={lifestyle.carType}
                          onChange={(e) => setLifestyle(s => ({ ...s, carType: e.target.value }))}
                        >
                          <option value="petrol">Petrol (Gasoline)</option>
                          <option value="diesel">Diesel</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="electric">Electric (EV)</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-3 pt-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Daily Commute Distance (km): {lifestyle.dailyCommuteKm}km
                      </label>
                      <input 
                        type="range" min="0" max="100" step="1"
                        value={lifestyle.dailyCommuteKm}
                        onChange={(e) => setLifestyle(s => ({ ...s, dailyCommuteKm: parseInt(e.target.value) }))}
                        className="w-full accent-eco-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Diet */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">What&apos;s on your plate? 🥗</h2>
                    <p className="text-slate-500 dark:text-slate-400">Diet choices have a huge impact on land and water use.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Diet Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'omnivore', label: 'Omnivore', desc: 'Eats everything' },
                        { id: 'pescatarian', label: 'Pescatarian', desc: 'Fish & veggies' },
                        { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat' },
                        { id: 'vegan', label: 'Vegan', desc: 'Plant-based only' },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            const updates: Partial<typeof lifestyle> = { dietType: mode.id };
                            if (mode.id === 'vegetarian' || mode.id === 'vegan') updates.meatMealsPerWeek = 0;
                            setLifestyle(s => ({ ...s, ...updates }));
                          }}
                          className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                            lifestyle.dietType === mode.id 
                              ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className={`font-semibold ${lifestyle.dietType === mode.id ? 'text-eco-700 dark:text-eco-400' : ''}`}>{mode.label}</span>
                          <span className="text-xs text-slate-500 mt-1">{mode.desc}</span>
                        </button>
                      ))}
                    </div>

                    {(lifestyle.dietType === 'omnivore' || lifestyle.dietType === 'pescatarian') && (
                      <div className="animate-fade-in space-y-3 pt-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Meat/Fish Meals per Week: {lifestyle.meatMealsPerWeek}
                        </label>
                        <input 
                          type="range" min="0" max="21" step="1"
                          value={lifestyle.meatMealsPerWeek}
                          onChange={(e) => setLifestyle(s => ({ ...s, meatMealsPerWeek: parseInt(e.target.value) }))}
                          className="w-full accent-eco-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>0</span><span>7</span><span>14</span><span>21</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Energy */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">Powering your life ⚡</h2>
                    <p className="text-slate-500 dark:text-slate-400">Home energy use is a major factor in global emissions.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Home Type</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-eco-500"
                      value={lifestyle.homeType}
                      onChange={(e) => setLifestyle(s => ({ ...s, homeType: e.target.value }))}
                    >
                      <option value="apartment">Apartment / Flat</option>
                      <option value="house">Detached House</option>
                      <option value="shared">Shared House</option>
                    </select>

                    <div className="space-y-3 pt-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Monthly Electricity (kWh): {lifestyle.electricityKwhPerMonth}
                      </label>
                      <input 
                        type="range" min="50" max="1000" step="10"
                        value={lifestyle.electricityKwhPerMonth}
                        onChange={(e) => setLifestyle(s => ({ ...s, electricityKwhPerMonth: parseInt(e.target.value) }))}
                        className="w-full accent-eco-500"
                      />
                      <p className="text-xs text-slate-500 text-center">Avg is ~250 kWh for an apartment</p>
                    </div>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={lifestyle.hasRenewableEnergy}
                        onChange={(e) => setLifestyle(s => ({ ...s, hasRenewableEnergy: e.target.checked }))}
                        className="w-5 h-5 rounded text-eco-600 focus:ring-eco-500 accent-eco-500"
                      />
                      <div>
                        <p className="font-medium text-sm">I use a renewable energy tariff</p>
                        <p className="text-xs text-slate-500 mt-0.5">My provider uses 100% green energy</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Lifestyle & Finish */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">Shopping & Waste 🌍</h2>
                    <p className="text-slate-500 dark:text-slate-400">Final touches to build your profile.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shopping Frequency (Clothes/Tech)</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-eco-500"
                      value={lifestyle.shoppingFrequency}
                      onChange={(e) => setLifestyle(s => ({ ...s, shoppingFrequency: e.target.value }))}
                    >
                      <option value="minimal">Minimal (Only essentials)</option>
                      <option value="moderate">Moderate (Occasional treats)</option>
                      <option value="frequent">Frequent (Regular shopping)</option>
                    </select>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 pt-3">Recycling Habits</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-eco-500"
                      value={lifestyle.recyclingHabit}
                      onChange={(e) => setLifestyle(s => ({ ...s, recyclingHabit: e.target.value }))}
                    >
                      <option value="always">Always recycle everything</option>
                      <option value="usually">Usually recycle</option>
                      <option value="sometimes">Sometimes recycle</option>
                      <option value="rarely">Rarely recycle</option>
                    </select>
                  </div>

                  <div className="p-4 bg-eco-50 dark:bg-eco-900/20 rounded-xl mt-6 border border-eco-100 dark:border-eco-800/50">
                    <p className="text-sm text-eco-800 dark:text-eco-300 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-eco-500" />
                      Ready to see your initial Carbon Score?
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              {step > 0 && (
                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" className="w-1/3" onClick={handleBack}>
                    Back
                  </Button>
                  <Button className="w-2/3" onClick={handleNext}>
                    {step === 4 ? 'Calculate Score' : 'Continue'}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
