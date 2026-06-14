'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { useActivityStore } from '@/stores/activity-store';
import { getDefaultScenarios, simulateScenarios } from '@/lib/prediction-engine';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { SlidersHorizontal, Calculator, ArrowRight, Save, Trees, Car } from 'lucide-react';
import type { SimulationScenario } from '@/types';

export default function SimulatorPage() {
  const { profile, updateLifestyle } = useUserStore();
  const { logs } = useActivityStore();
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);

  useEffect(() => {
    if (profile && scenarios.length === 0) {
      setScenarios(getDefaultScenarios(profile.lifestyle));
    }
  }, [profile, scenarios.length]);

  const result = useMemo(() => {
    if (!profile || scenarios.length === 0) return null;
    return simulateScenarios(profile.lifestyle, logs, scenarios);
  }, [profile, logs, scenarios]);

  if (!profile || !result) return null;

  const handleApplyChanges = () => {
    if (!confirm('Apply these simulated changes to your profile?')) return;
    
    const updates: any = {};
    scenarios.forEach(s => {
      if (s.category === 'transport' && s.label.includes('transit')) updates.primaryTransport = 'public_transit';
      if (s.category === 'transport' && s.label.includes('distance')) updates.dailyCommuteKm = s.newValue;
      if (s.category === 'food' && s.label.includes('vegetarian')) updates.dietType = 'vegetarian';
      if (s.category === 'food' && s.label.includes('meat')) updates.meatMealsPerWeek = s.newValue;
      if (s.category === 'energy' && s.label.includes('electricity')) updates.electricityKwhPerMonth = s.newValue;
      if (s.category === 'energy' && s.label.includes('renewable')) updates.hasRenewableEnergy = true;
    });

    updateLifestyle(updates);
    alert('Profile updated successfully!');
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            AI Action Simulator
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ocean-50 dark:bg-ocean-900/30 text-ocean-600 dark:text-ocean-400">Beta</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Adjust your habits to see the projected impact on your carbon footprint.
          </p>
        </div>
        <Button onClick={handleApplyChanges} rightIcon={<Save className="w-4 h-4" />}>
          Apply Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scenario Builder */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-ocean-50 dark:bg-ocean-900/20 text-ocean-500 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Variables</h2>
                <p className="text-sm text-slate-500">Move the sliders to simulate changes.</p>
              </div>
            </div>

            <div className="space-y-8">
              {scenarios.map((scenario, index) => (
                <div key={scenario.id} className="space-y-3 group">
                  <div className="flex justify-between items-end">
                    <label className="font-medium text-slate-700 dark:text-slate-300">
                      {scenario.label}
                    </label>
                    <span className="text-sm font-semibold text-ocean-600 dark:text-ocean-400">
                      {scenario.newValue} <span className="text-xs font-normal text-slate-500">{scenario.unit}</span>
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min={0} 
                    max={scenario.currentValue > 0 ? scenario.currentValue * 1.5 : 100} 
                    step={1}
                    value={scenario.newValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const newScenarios = [...scenarios];
                      newScenarios[index].newValue = val;
                      setScenarios(newScenarios);
                    }}
                    className="w-full accent-ocean-500"
                  />

                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Current: {scenario.currentValue}</span>
                    {scenario.impactKgPerMonth > 0 && (
                      <span className="text-eco-600 font-medium">-{scenario.impactKgPerMonth} kg/mo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Impact Visualization */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-ocean-500/20 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Projected Impact</h2>
                <p className="text-sm text-slate-400">Monthly footprint estimate</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              {/* Current vs Projected */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Current</p>
                  <p className="text-2xl font-bold">{result.currentMonthlyKg} <span className="text-sm font-normal text-slate-400">kg</span></p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-500" />
                <div className="text-right">
                  <p className="text-sm text-ocean-400 font-medium mb-1">Projected</p>
                  <p className="text-3xl font-display font-bold text-white">{result.projectedMonthlyKg} <span className="text-sm font-normal text-ocean-400">kg</span></p>
                </div>
              </div>

              {/* Savings Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">Reduction</span>
                  <span className="font-bold text-eco-400">{result.savingsPercent}%</span>
                </div>
                <Progress value={result.savingsPercent} variant="eco" />
                <p className="text-xs text-slate-400 mt-2 text-right">
                  Savings: {result.savingsKg} kg CO₂ / month
                </p>
              </div>

              <div className="h-px w-full bg-white/10" />

              {/* Equivalencies */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-300">This reduction is equivalent to:</p>
                
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                    <Trees className="w-6 h-6 text-eco-400 mb-2" />
                    <p className="text-2xl font-bold">{result.equivalentTrees}</p>
                    <p className="text-xs text-slate-400 leading-tight">trees planted (annual offset)</p>
                  </div>
                  
                  <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                    <Car className="w-6 h-6 text-ocean-400 mb-2" />
                    <p className="text-2xl font-bold">{result.equivalentDrivingKm}</p>
                    <p className="text-xs text-slate-400 leading-tight">km not driven in a petrol car</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
