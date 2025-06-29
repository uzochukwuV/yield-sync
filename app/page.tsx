"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip
} from '@heroui/react';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  Globe, 
  BarChart3, 
  Wallet, 
  ChevronRight, 
  Activity, 
  Target, 
  Layers, 
  RefreshCw,
  Zap,
  DollarSign
} from 'lucide-react';
import { mockPlatformMetrics, mockStrategies } from '@/lib/mock-data';
import { StrategyCard } from '@/components/strategy-card';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="ondo-hero-section min-h-screen flex items-center justify-center relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                <RefreshCw className="w-4 h-4 text-blue-400 mr-2 sync-pulse" />
                <span className="text-blue-400 text-sm font-medium">Synchronizing yields across chains</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 ondo-text-gradient">
                YieldSync
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-400 mb-8 font-light">
                Cross-Chain Yield Strategy Platform
              </p>
              
              <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                Seamlessly manage and optimize your DeFi yield strategies across multiple blockchains 
                with enterprise-grade analytics and automated synchronization.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!isConnected ? (
                <Button
                  size="lg"
                  className="ondo-button-primary px-8 py-6 text-base"
                  startContent={<Wallet className="w-5 h-5" />}
                >
                  Connect Wallet
                </Button>
              ) : (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="ondo-button-primary px-8 py-6 text-base"
                    startContent={<BarChart3 className="w-5 h-5" />}
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              )}
              <Link href="/strategies">
                <Button
                  size="lg"
                  className="ondo-button-secondary px-8 py-6 text-base"
                  startContent={<Layers className="w-5 h-5" />}
                >
                  Explore Strategies
                </Button>
              </Link>
            </motion.div>

            {/* Platform Metrics */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mockPlatformMetrics.totalStrategies.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-2">
                  ${(mockPlatformMetrics.totalYieldSynced / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-500">Yield Synced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-400 mb-2">
                  {mockPlatformMetrics.crossChainTransactions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Cross-Chain TXs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-400 mb-2">
                  ${(mockPlatformMetrics.revenueGenerated / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-gray-500">Revenue</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
              How YieldSync Works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
              Three simple steps to synchronize your DeFi yields across multiple chains
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Wallet,
                title: "Connect & Discover",
                description: "Connect your wallet and discover yield strategies across 15+ chains with real-time data",
                step: "01"
              },
              {
                icon: RefreshCw,
                title: "Sync & Optimize",
                description: "Automatically synchronize positions across chains with AI-powered optimization",
                step: "02"
              },
              {
                icon: TrendingUp,
                title: "Track & Amplify",
                description: "Monitor performance with unified analytics and cross-chain insights",
                step: "03"
              }
            ].map((step, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="ondo-card h-full">
                  <CardBody className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Strategies */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Strategies
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
              High-performing strategies synchronized across chains with verified smart contracts
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {mockStrategies.slice(0, 6).map((strategy, index) => (
              <motion.div key={strategy.id} variants={fadeInUp}>
                <StrategyCard strategy={strategy} />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <Link href="/strategies">
              <Button
                size="lg"
                className="ondo-button-secondary"
                endContent={<ArrowRight className="w-5 h-5" />}
              >
                View All Strategies
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose YieldSync?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-2xl mx-auto">
              Built for DeFi users who demand seamless cross-chain synchronization
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-grade security with audited smart contracts and insurance coverage"
              },
              {
                icon: RefreshCw,
                title: "Real-Time Sync",
                description: "Seamlessly synchronize strategies across 15+ chains with real-time updates"
              },
              {
                icon: TrendingUp,
                title: "Advanced Analytics",
                description: "Comprehensive performance tracking with synchronized yield analytics"
              },
              {
                icon: Zap,
                title: "AI Optimization",
                description: "Machine learning algorithms optimize strategies across chains automatically"
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Access strategies from top DeFi protocols and institutional partners"
              },
              {
                icon: BarChart3,
                title: "Professional Tools",
                description: "Advanced charting, backtesting, and cross-chain risk analysis"
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="ondo-card h-full">
                  <CardBody className="p-8">
                    <div className="w-12 h-12 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Synchronize Your Yields?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-400 mb-12">
              Join thousands of DeFi users who trust YieldSync to manage their cross-chain strategies
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isConnected ? (
                <Button
                  size="lg"
                  className="ondo-button-primary px-10 py-6 text-base"
                  startContent={<Wallet className="w-5 h-5" />}
                >
                  Connect Wallet & Start
                </Button>
              ) : (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="ondo-button-primary px-10 py-6 text-base"
                    startContent={<BarChart3 className="w-5 h-5" />}
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              )}
              <Link href="/strategies">
                <Button
                  size="lg"
                  className="ondo-button-secondary px-10 py-6 text-base"
                  startContent={<Layers className="w-5 h-5" />}
                >
                  Explore Strategies
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}