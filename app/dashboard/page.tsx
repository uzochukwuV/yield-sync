"use client";

import { motion } from 'framer-motion';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Button, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Eye, 
  Plus,
  Zap,
  ChevronRight,
  Globe,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { mockUserPositions, mockStrategies, mockChartData } from '@/lib/mock-data';
import { PerformanceChart } from '@/components/performance-chart';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Dashboard() {
  const totalPortfolioValue = mockUserPositions.reduce((sum, position) => sum + position.value, 0);
  const totalClaimableRewards = mockUserPositions.reduce((sum, position) => sum + position.claimableRewards, 0);
  const averageAPY = mockUserPositions.reduce((sum, position) => sum + position.apy, 0) / mockUserPositions.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Portfolio Dashboard
              </h1>
              <p className="text-gray-400 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 sync-pulse" />
                Real-time synchronization across all chains
              </p>
            </div>
            <Button 
              className="ondo-button-primary"
              startContent={<Plus className="w-4 h-4" />}
            >
              Add Strategy
            </Button>
          </motion.div>

          {/* Portfolio Overview Cards */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">${totalPortfolioValue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+12.5%</span>
                <span className="text-gray-500 ml-2">this month</span>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Claimable Rewards</p>
                  <p className="text-2xl font-bold text-white">${totalClaimableRewards.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-yellow-400">Ready to claim</span>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average APY</p>
                  <p className="text-2xl font-bold text-white">{averageAPY.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Activity className="w-4 h-4 text-blue-400 mr-1" />
                <span className="text-blue-400">Across {mockUserPositions.length} strategies</span>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Strategies</p>
                  <p className="text-2xl font-bold text-white">{mockUserPositions.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-purple-400 sync-pulse" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <Globe className="w-4 h-4 text-purple-400 mr-1" />
                <span className="text-purple-400">3 chains</span>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Portfolio Performance */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Card className="ondo-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
                  <div className="ondo-chip text-xs">Last 30 Days</div>
                </div>
              </CardHeader>
              <CardBody>
                <PerformanceChart data={mockChartData} />
              </CardBody>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <Card className="ondo-card mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button 
                  className="w-full ondo-button-primary"
                  startContent={<Plus className="w-4 h-4" />}
                >
                  Add New Strategy
                </Button>
                <Button 
                  className="w-full ondo-button-secondary"
                  startContent={<DollarSign className="w-4 h-4" />}
                >
                  Claim All Rewards
                </Button>
                <Button 
                  className="w-full ondo-button-secondary"
                  startContent={<RefreshCw className="w-4 h-4" />}
                >
                  Sync Portfolio
                </Button>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card className="ondo-card">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {mockUserPositions.slice(0, 3).map((position) => {
                    const strategy = mockStrategies.find(s => s.id === position.strategyId);
                    return (
                      <div key={position.strategyId} className="ondo-table-row flex items-center justify-between p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{strategy?.name}</p>
                            <p className="text-xs text-gray-500">{strategy?.chain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-400">+${position.claimableRewards.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Rewards</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        {/* Strategies Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mt-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Active Strategies</h2>
            <Button 
              className="ondo-button-secondary"
              endContent={<ChevronRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="ondo-card">
              <CardBody className="p-0">
                <Table 
                  aria-label="Active strategies table"
                  classNames={{
                    wrapper: "bg-transparent shadow-none",
                    th: "ondo-table-header",
                    td: "ondo-table-row text-white border-b border-white/4"
                  }}
                >
                  <TableHeader>
                    <TableColumn>STRATEGY</TableColumn>
                    <TableColumn>CHAIN</TableColumn>
                    <TableColumn>POSITION VALUE</TableColumn>
                    <TableColumn>APY</TableColumn>
                    <TableColumn>CLAIMABLE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {mockUserPositions.map((position) => {
                      const strategy = mockStrategies.find(s => s.id === position.strategyId);
                      if (!strategy) return null;

                      return (
                        <TableRow key={position.strategyId}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">{strategy.name}</p>
                                <p className="text-xs text-gray-500">{strategy.protocol}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="ondo-chip text-xs">{strategy.chain}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-white">${position.value.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-400">{position.apy}%</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-yellow-400">${position.claimableRewards.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="ondo-chip ondo-chip-success text-xs flex items-center">
                              <RefreshCw className="w-3 h-3 mr-1 sync-pulse" />
                              Synced
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              className="ondo-button-secondary text-xs"
                              startContent={<Eye className="w-3 h-3" />}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}