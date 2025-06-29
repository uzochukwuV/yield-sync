"use client";

import { motion } from 'framer-motion';
import { Button, Chip } from '@heroui/react';
import { Star, Wallet, BarChart3, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { mockPlatformMetrics } from '@/lib/mock-data';
import { KPIStatCard } from './kpi-stat-card';

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export function AnimatedHero() {
  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <Chip
              startContent={<RefreshCw className="w-4 h-4 sync-animation" />}
              variant="flat"
              color="success"
              className="mb-6 text-sm font-medium curved-button"
            >
              Synchronizing yields across chains
            </Chip>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent font-display">
              YieldSync
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-6 font-light">
              Your Cross-Chain Yield Strategies
            </p>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Seamlessly manage, track, and optimize your DeFi yield strategies across multiple blockchains 
              with enterprise-grade analytics and automated synchronization.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Button 
              size="lg" 
              className="gradient-primary font-medium text-lg px-10 py-7 curved-button"
              startContent={<Wallet className="w-5 h-5" />}
              endContent={<ArrowRight className="w-5 h-5" />}
            >
              Connect & Sync Wallet
            </Button>
            <Button 
              size="lg" 
              variant="bordered" 
              className="border-green-500/50 hover:bg-green-500/10 text-green-400 text-lg px-10 py-7 curved-button"
              startContent={<BarChart3 className="w-5 h-5" />}
            >
              View Dashboard
            </Button>
          </motion.div>

          {/* Platform Metrics */}
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            <KPIStatCard
              title="Strategies Synced"
              value={mockPlatformMetrics.totalStrategies.toLocaleString()}
              color="text-green-400"
            />
            <KPIStatCard
              title="Yield Synchronized"
              value={`$${(mockPlatformMetrics.totalYieldSynced / 1000000).toFixed(1)}M`}
              color="text-blue-400"
            />
            <KPIStatCard
              title="Cross-Chain TXs"
              value={mockPlatformMetrics.crossChainTransactions.toLocaleString()}
              color="text-amber-400"
            />
            <KPIStatCard
              title="Revenue Generated"
              value={`$${(mockPlatformMetrics.revenueGenerated / 1000).toFixed(0)}K`}
              color="text-purple-400"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-amber-500/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
    </section>
  );
}