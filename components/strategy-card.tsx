"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader, Chip, Button } from '@heroui/react';
import { Globe, TrendingUp, Shield, Zap, RefreshCw } from 'lucide-react';
import { Strategy } from '@/lib/types';
import { motion } from 'framer-motion';
import { StrategyInteractionModal } from './strategy-interaction-modal';

interface StrategyCardProps {
  strategy: Strategy;
  showActions?: boolean;
  className?: string;
}

export function StrategyCard({ strategy, showActions = true, className }: StrategyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'ondo-chip-success';
      case 'medium': return 'ondo-chip-warning';
      case 'high': return 'ondo-chip-danger';
      default: return 'ondo-chip';
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className={`ondo-strategy-card h-full ${className}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-400 sync-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{strategy.name}</h3>
                  <p className="text-sm text-gray-500">{strategy.protocol}</p>
                </div>
              </div>
              <div className="ondo-chip text-xs">
                {strategy.chains[0].chainName}
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="pt-0">
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {strategy.description}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-blue-400">{strategy.apy}%</div>
                <div className="text-xs text-gray-500">APY</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">${(strategy.tvl / 1000000).toFixed(0)}M</div>
                <div className="text-xs text-gray-500">TVL</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                  {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)} Risk
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{strategy.actions.length} functions</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {strategy.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="ondo-chip text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              {showActions && (
                <Button 
                  size="sm" 
                  className="ondo-button-primary text-xs px-3 py-1"
                  endContent={<Zap className="w-3 h-3" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Interact
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <StrategyInteractionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        strategy={strategy}
      />
    </>
  );
}