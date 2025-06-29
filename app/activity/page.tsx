"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardBody,
  Chip,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { 
  Activity,
  ExternalLink,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { mockTransactions } from '@/lib/mock-data';


const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function ActivityPage() {
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesChain = selectedChain === 'all' || tx.chain === selectedChain;
    const matchesType = selectedType === 'all' || tx.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || tx.status === selectedStatus;
    
    return matchesChain && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Loader className="w-4 h-4 text-amber-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Add') || type.includes('Supply')) {
      return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    }
    return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
  };

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
              Activity & History
            </h1>
            <p className="text-gray-400 text-lg">
              Track all your DeFi transactions across chains and strategies
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {filteredTransactions.filter(tx => tx.status === 'success').length}
                </div>
                <p className="text-sm text-gray-400">Successful</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="text-2xl font-bold text-amber-400 mb-1">
                  {filteredTransactions.filter(tx => tx.status === 'pending').length}
                </div>
                <p className="text-sm text-gray-400">Pending</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  ${filteredTransactions.reduce((sum, tx) => sum + tx.value, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-400">Total Volume</p>
              </CardBody>
            </Card>
            
            <Card className="glass-morphism border-white/10">
              <CardBody className="text-center p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {new Set(filteredTransactions.map(tx => tx.chain)).size}
                </div>
                <p className="text-sm text-gray-400">Chains Used</p>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Card className="glass-morphism border-white/10">
            <CardBody className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  placeholder="All Chains"
                  selectedKeys={selectedChain === 'all' ? [] : [selectedChain]}
                  onSelectionChange={(keys) => setSelectedChain(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all"  >All Chains</SelectItem>
                  <SelectItem key="Ethereum" className="Ethereum">Ethereum</SelectItem>
                  <SelectItem key="Polygon" className="Polygon">Polygon</SelectItem>
                  <SelectItem key="Optimism" className="Optimism">Optimism</SelectItem>
                </Select>
                
                <Select
                  placeholder="All Types"
                  selectedKeys={selectedType === 'all' ? [] : [selectedType]}
                  onSelectionChange={(keys) => setSelectedType(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all" className="all">All Types</SelectItem>
                  <SelectItem key="Add Liquidity" className="Add Liquidity">Add Liquidity</SelectItem>
                  <SelectItem key="Supply" className="Supply">Supply</SelectItem>
                  <SelectItem key="Withdraw" className="Withdraw">Withdraw</SelectItem>
                  <SelectItem key="Claim" className="Claim">Claim</SelectItem>
                </Select>
                
                <Select
                  placeholder="All Status"
                  selectedKeys={selectedStatus === 'all' ? [] : [selectedStatus]}
                  onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string || 'all')}
                  variant="bordered"
                >
                  <SelectItem key="all" className="all">All Status</SelectItem>
                  <SelectItem key="success" className="success">Success</SelectItem>
                  <SelectItem key="pending" className="pending">Pending</SelectItem>
                  <SelectItem key="failed" className="failed">Failed</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-4"
        >
          {filteredTransactions.map((transaction, index) => (
            <motion.div key={transaction.id} variants={fadeInUp}>
              <Card className="glass-morphism border-white/10 hover:border-green-500/50 transition-all duration-300">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20">
                        {getTypeIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{transaction.type}</h3>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getStatusColor(transaction.status)}
                            startContent={getStatusIcon(transaction.status)}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Chip>
                        </div>
                        
                        <p className="text-gray-400 mb-2">{transaction.strategyName}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Amount</p>
                            <p className="font-medium text-white">{transaction.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Value</p>
                            <p className="font-medium text-green-400">${transaction.value.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Chain</p>
                            <Chip size="sm" variant="flat" color="secondary">
                              {transaction.chain}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-gray-400">Gas</p>
                            <p className="font-medium text-amber-400">
                              {(transaction.gasUsed * transaction.gasPrice / 1e9).toFixed(4)} ETH
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <p className="text-sm text-gray-400">
                        {transaction.timestamp.toLocaleDateString()} at {transaction.timestamp.toLocaleTimeString()}
                      </p>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        endContent={<ExternalLink className="w-3 h-3" />}
                        onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')}
                      >
                        View TX
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredTransactions.length === 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or make your first transaction</p>
            <Button
              variant="bordered"
              color="success"
              onClick={() => {
                setSelectedChain('all');
                setSelectedType('all');
                setSelectedStatus('all');
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