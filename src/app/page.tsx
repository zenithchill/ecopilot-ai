'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf, Activity, MessageSquare, TrendingDown, ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-eco-500/10 dark:bg-eco-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-ocean-500/10 dark:bg-ocean-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-eco-500 to-ocean-500 flex items-center justify-center text-white shadow-glow">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">EcoPilot<span className="text-eco-500">.</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Login
          </Link>
          <Link href="/onboarding">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 z-10">
        <motion.div 
          className="max-w-4xl mx-auto space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVars}
        >
          <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-eco-50 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400 font-medium text-sm border border-eco-200 dark:border-eco-800/50">
            <SparklesIcon className="w-4 h-4" />
            <span>AI-Powered Sustainability Coach</span>
          </motion.div>
          
          <motion.h1 variants={itemVars} className="text-5xl sm:text-6xl md:text-7xl font-bold font-display tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Master your carbon <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-500 via-ocean-500 to-eco-400 animate-gradient-shift bg-[length:200%_auto]">
              footprint with AI.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVars} className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance">
            Track your lifestyle, get personalized insights, and simulate the impact of your choices. Making sustainable decisions has never been this smart.
          </motion.p>
          
          <motion.div variants={itemVars} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Your Journey
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-surface-900 relative z-10 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display mb-4">Everything you need to go green</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              A comprehensive toolkit powered by advanced AI and real climate science.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-eco-500" />}
              title="Smart Tracking"
              description="Log your meals, commutes, and energy use in seconds. We do the complex math."
            />
            <FeatureCard 
              icon={<MessageSquare className="w-6 h-6 text-ocean-500" />}
              title="AI Assistant"
              description="Chat with an AI trained on environmental science to get personalized advice."
            />
            <FeatureCard 
              icon={<TrendingDown className="w-6 h-6 text-amber-500" />}
              title="Predictive Models"
              description="Forecast your emissions and run 'what-if' simulations before making changes."
            />
            <FeatureCard 
              icon={<Target className="w-6 h-6 text-red-500" />}
              title="Gamified Goals"
              description="Earn badges, build streaks, and complete weekly sustainability challenges."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-purple-500" />}
              title="Data Privacy"
              description="Your data never leaves your device. Everything runs locally in your browser."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-blue-500" />}
              title="Real Science"
              description="Calculations based on verified EPA, DEFRA, and IPCC emission factors."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-900 relative z-10">
        <p className="text-sm">Built for Hackathon. All data stored locally.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-slate-100 dark:border-slate-800 hover:border-eco-500/30 transition-colors duration-300">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-900 flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
