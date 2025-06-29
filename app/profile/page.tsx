"use client";

import { motion } from 'framer-motion';
import { 
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Progress,
  Divider
} from '@heroui/react';
import { 
  User,
  Wallet,
  TrendingUp,
  Award,
  Globe,
  Activity,
  Calendar,
  ExternalLink,
  Edit,
  Share
} from 'lucide-react';
import { mockUserPositions, mockTransactions, mockChains } from '@/lib/mock-data';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function ProfilePage() {
  const totalValue = mockUserPositions.reduce((sum, pos) => sum + pos.value, 0);
  const totalGasSpent = mockTransactions.reduce((sum, tx) => sum + (tx.gasUsed * tx.gasPrice / 1e18), 0);
  const chainsUsed = new Set(mockTransactions.map(tx => tx.chain));
  const strategiesUsed = new Set(mockUserPositions.map(pos => pos.strategyId));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Profile Header */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Card className="glass-morphism border-white/10">
              <CardBody className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <Avatar
                    src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
                    className="w-24 h-24"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">DeFi Strategist</h1>
                      <Chip size="sm" variant="flat" color="success" startContent={<Award className="w-3 h-3" />}>
                        Pro Trader
                      </Chip>
                    </div>
                    <p className="text-gray-400 mb-4">
                      0x742d35cc44c4532Af39C5FEB97bFb4B7B5C8c5A2
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Chip size="sm" variant="flat" color="primary">Cross-Chain Expert</Chip>
                      <Chip size="sm" variant="flat" color="secondary">High Yield Hunter</Chip>
                      <Chip size="sm" variant="flat" color="warning">Risk Manager</Chip>
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="bordered" color="success" startContent={<Edit className="w-4 h-4" />}>
                        Edit Profile
                      </Button>
                      <Button size="sm" variant="light" color="primary" startContent={<Share className="w-4 h-4" />}>
                        Share Profile
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      ${totalValue.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-400">Total Portfolio Value</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-xl font-bold text-white">{strategiesUsed.size}</span>
                </div>
                <p className="text-sm text-gray-400">Active Strategies</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <Globe className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-xl font-bold text-white">{chainsUsed.size}</span>
                </div>
                <p className="text-sm text-gray-400">Chains Used</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-xl font-bold text-white">{mockTransactions.length}</span>
                </div>
                <p className="text-sm text-gray-400">Total Transactions</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <Wallet className="w-5 h-5 text-amber-400 mr-2" />
                  <span className="text-xl font-bold text-white">{totalGasSpent.toFixed(3)}</span>
                </div>
                <p className="text-sm text-gray-400">ETH Gas Spent</p>
              </CardBody>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Achievement Badges */}
            <motion.div variants={fadeInUp} className="lg:col-span-1">
              <Card className="glass-morphism border-white/10 mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Award className="w-5 h-5 mr-2 text-amber-400" />
                    Achievement Badges
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Yield Master</p>
                      <p className="text-xs text-gray-400">Earned 10+ strategies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Cross-Chain Pioneer</p>
                      <p className="text-xs text-gray-400">Used 3+ chains</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Active Trader</p>
                      <p className="text-xs text-gray-400">100+ transactions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 opacity-50">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Whale Investor</p>
                      <p className="text-xs text-gray-400">$100K+ portfolio</p>
                      <Progress value={75} color="warning" size="sm" className="mt-1" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Chain Activity */}
              <Card className="glass-morphism border-white/10">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-400" />
                    Chain Activity
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {Array.from(chainsUsed).map((chain) => {
                      const chainTxs = mockTransactions.filter(tx => tx.chain === chain).length;
                      const percentage = (chainTxs / mockTransactions.length) * 100;
                      
                      return (
                        <div key={chain}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-white">{chain}</span>
                            <span className="text-sm text-gray-400">{chainTxs} txs</span>
                          </div>
                          <Progress 
                            value={percentage} 
                            color={chain === 'Ethereum' ? 'primary' : chain === 'Polygon' ? 'secondary' : 'success'} 
                            size="sm" 
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Portfolio Breakdown & Activity */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
              {/* Portfolio Breakdown */}
              <Card className="glass-morphism border-white/10">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Portfolio Breakdown
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {mockUserPositions.map((position, index) => {
                      const percentage = (position.value / totalValue) * 100;
                      
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-medium text-white">{position.strategyId}</p>
                              <p className="text-sm text-gray-400">{percentage.toFixed(1)}% of portfolio</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-400">${position.value.toLocaleString()}</p>
                              <p className="text-sm text-gray-400">{position.apy}% APY</p>
                            </div>
                          </div>
                          <Progress value={percentage} color="success" size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Recent Activity Summary */}
              <Card className="glass-morphism border-white/10">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                    Recent Activity Summary
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {mockTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{transaction.type}</p>
                            <p className="text-xs text-gray-400">{transaction.chain} • {transaction.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-400">${transaction.value.toLocaleString()}</p>
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            endContent={<ExternalLink className="w-3 h-3" />}
                            onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}