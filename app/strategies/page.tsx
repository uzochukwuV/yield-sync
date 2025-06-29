"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Chip,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Divider
} from '@heroui/react';
import { 
  Search,
  Filter,
  TrendingUp,
  Layers,
  Globe,
  Zap,
  DollarSign,
  Users
} from 'lucide-react';
import { mockStrategies, mockChains } from '@/lib/mock-data';
import { StrategyCard } from '@/components/strategy-card';
import { Strategy } from '@/lib/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function StrategiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredStrategies = mockStrategies.filter((strategy) => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChain = selectedChain === 'all' || strategy.chain === selectedChain;
    const matchesCategory = selectedCategory === 'all' || strategy.category === selectedCategory;
    const matchesRisk = selectedRisk === 'all' || strategy.riskLevel === selectedRisk;
    
    return matchesSearch && matchesChain && matchesCategory && matchesRisk;
  });

  const getStrategiesByTab = (tab: string) => {
    if (tab === 'all') return filteredStrategies;
    if (tab === 'high-yield') return filteredStrategies.filter(s => s.apy >= 15);
    if (tab === 'stable') return filteredStrategies.filter(s => s.riskLevel === 'low');
    if (tab === 'trending') return filteredStrategies.slice(0, 6);
    return filteredStrategies;
  };

  const displayedStrategies = getStrategiesByTab(activeTab);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Yield Strategies Explorer
            </h1>
            <p className="text-gray-400 text-lg">
              Discover and interact with {mockStrategies.length}+ high-performing DeFi strategies
            </p>
          </motion.div>

          {/* Platform Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <Layers className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-xl font-bold text-white">{mockStrategies.length}</span>
                </div>
                <p className="text-sm text-gray-400">Total Strategies</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <Globe className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-xl font-bold text-white">{mockChains.length}</span>
                </div>
                <p className="text-sm text-gray-400">Supported Chains</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400 mr-2" />
                  <span className="text-xl font-bold text-white">
                    {(mockStrategies.reduce((sum, s) => sum + s.apy, 0) / mockStrategies.length).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-400">Avg APY</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-xl font-bold text-white">
                    ${(mockStrategies.reduce((sum, s) => sum + s.tvl, 0) / 1000000000).toFixed(1)}B
                  </span>
                </div>
                <p className="text-sm text-gray-400">Total TVL</p>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Card className="glass-morphism border-white/10">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<Search className="w-4 h-4 text-gray-400" />}
                  variant="bordered"
                  className="w-full"
                />
                
                <Select
                  placeholder="All Chains"
                  selectedKeys={selectedChain === 'all' ? [] : [selectedChain]}
                  onSelectionChange={(keys) => setSelectedChain(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all" value="all">All Chains</SelectItem>
                  {mockChains.map((chain) => (
                    <SelectItem key={chain.name} value={chain.name}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </Select>
                
                <Select
                  placeholder="All Categories"
                  selectedKeys={selectedCategory === 'all' ? [] : [selectedCategory]}
                  onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all" value="all">All Categories</SelectItem>
                  <SelectItem key="lending" value="lending">Lending</SelectItem>
                  <SelectItem key="liquidity" value="liquidity">Liquidity</SelectItem>
                  <SelectItem key="staking" value="staking">Staking</SelectItem>
                  <SelectItem key="yield" value="yield">Yield</SelectItem>
                </Select>
                
                <Select
                  placeholder="All Risk Levels"
                  selectedKeys={selectedRisk === 'all' ? [] : [selectedRisk]}
                  onSelectionChange={(keys) => setSelectedRisk(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all" value="all">All Risk Levels</SelectItem>
                  <SelectItem key="low" value="low">Low Risk</SelectItem>
                  <SelectItem key="medium" value="medium">Medium Risk</SelectItem>
                  <SelectItem key="high" value="high">High Risk</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-green-500",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-green-400"
            }}
          >
            <Tab key="all" title={
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>All Strategies</span>
                <Chip size="sm" variant="flat">{mockStrategies.length}</Chip>
              </div>
            } />
            <Tab key="high-yield" title={
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>High Yield</span>
                <Chip size="sm" variant="flat" color="warning">
                  {mockStrategies.filter(s => s.apy >= 15).length}
                </Chip>
              </div>
            } />
            <Tab key="stable" title={
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Stable</span>
                <Chip size="sm" variant="flat" color="success">
                  {mockStrategies.filter(s => s.riskLevel === 'low').length}
                </Chip>
              </div>
            } />
            <Tab key="trending" title={
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Trending</span>
                <Chip size="sm" variant="flat" color="secondary">6</Chip>
              </div>
            } />
          </Tabs>
        </motion.div>

        {/* Strategies Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {displayedStrategies.map((strategy, index) => (
            <motion.div key={strategy.id} variants={fadeInUp}>
              <StrategyCard strategy={strategy} />
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {displayedStrategies.length === 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No strategies found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria or filters</p>
            <Button
              variant="bordered"
              color="success"
              onClick={() => {
                setSearchQuery('');
                setSelectedChain('all');
                setSelectedCategory('all');
                setSelectedRisk('all');
                setActiveTab('all');
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}