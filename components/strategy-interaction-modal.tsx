"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
  Chip,
  Divider,
  Spinner,
  Select,
  SelectItem,
  Input,
  Checkbox,
  Textarea,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  Avatar
} from '@heroui/react';
import { 
  Zap, 
  ExternalLink, 
  Info, 
  Activity, 
  TrendingUp, 
  Globe, 
  ArrowRight,
  Coins,
  Settings,
  CheckCircle,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';
import { Strategy, StrategyAction } from '@/lib/types';
import { useCrossChainInteraction } from '@/hooks/use-cross-chain-interaction';
import { getInputType, getInputPlaceholder } from '@/lib/encoding-utils';
import { useAccount } from 'wagmi';

interface StrategyInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: Strategy;
}

export function StrategyInteractionModal({ isOpen, onClose, strategy }: StrategyInteractionModalProps) {
  const [selectedAction, setSelectedAction] = useState<number>(0);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [openTokenSelector, setOpenTokenSelector] = useState(false);
  const {chainId} = useAccount()

  const {
    actionInputs,
    results,
    loading,
    selectedChain,
    setSelectedChain,
    approvalStatus,
    handleInputChange,
    executeAction,
    getAvailableChains,
    getUserPositions
  } = useCrossChainInteraction();

  const availableChains = getAvailableChains(strategy);
  const selectedActionData = strategy.actions[selectedAction];
  const actionKey = `${strategy.id}-${selectedActionData?.id}`;

  // Set default selected action
  useEffect(() => {
    if (strategy.actions.length > 0 && selectedAction >= strategy.actions.length) {
      setSelectedAction(0);
    }
  }, [strategy.actions, selectedAction]);

  // Set default chain
  useEffect(() => {
    if (availableChains.length > 0 && !availableChains.find(c => c.chainId === selectedChain)) {
      setSelectedChain(availableChains[0].chainId);
    }
  }, [availableChains, selectedChain, setSelectedChain]);

  // Load user data when modal opens or chain changes
  useEffect(() => {
    if (isOpen && selectedChain) {
      setLoadingUserData(true);
      getUserPositions(strategy, selectedChain).then(data => {
        setUserData(data);
        setLoadingUserData(false);
      });
    }
  }, [isOpen, selectedChain, strategy, getUserPositions]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'ondo-chip-success';
      case 'medium': return 'ondo-chip-warning';
      case 'high': return 'ondo-chip-danger';
      default: return 'ondo-chip';
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'success';
      case 'withdraw': return 'warning';
      case 'claim': return 'secondary';
      case 'stake': return 'primary';
      case 'unstake': return 'danger';
      case 'borrow': return 'primary';
      case 'repay': return 'warning';
      case 'manage': return 'default';
      default: return 'default';
    }
  };

  const handleExecuteAction = () => {
    if (!selectedActionData) return;
    
    executeAction(
      strategy,
      selectedActionData,
      selectedActionData.requiresToken ? tokenAddress : undefined,
      selectedActionData.requiresToken ? tokenAmount : undefined
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "ondo-modal max-h-[95vh]",
        backdrop: "ondo-modal-backdrop",
        header: "ondo-modal-header flex-shrink-0",
        body: "ondo-modal-body overflow-y-auto flex-1 min-h-0",
        footer: "ondo-modal-footer flex-shrink-0"
      }}
    >
      <ModalContent className="flex flex-col max-h-[95vh]">
        <ModalHeader className="flex flex-col gap-1 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{strategy.name}</h2>
                <p className="text-sm text-gray-400">{strategy.protocol} • {strategy.actions.length} Actions Available</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)} Risk
              </span>
              <span className="ondo-chip text-xs">
                {strategy.apy}% APY
              </span>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="flex-1 overflow-y-auto min-h-0 p-6">
          <div className="grid lg:grid-cols-4 gap-6 h-full">
            {/* Strategy Info & Chain Selection */}
            <div className="lg:col-span-1 space-y-6">
              {/* Chain Selection */}
              <Card className="ondo-card">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-purple-400" />
                    Select Chain
                  </h3>
                  
                  <Select
                    selectedKeys={selectedChain ? [selectedChain.toString()] : []}
                    onSelectionChange={(keys) => {
                      const chainId = Array.from(keys)[0] as string;
                      setSelectedChain(parseInt(chainId));
                    }}
                    variant="bordered"
                    classNames={{
                      trigger: "ondo-input-wrapper",
                      value: "text-white"
                    }}
                  >
                    {availableChains.map((deployment) => (
                      <SelectItem 
                        key={deployment.chainId.toString()} 
                        // value={deployment.chainId.toString()}
                        startContent={
                          <img 
                            src={deployment.chainInfo?.logoUrl} 
                            alt={deployment.chainName}
                            className="w-5 h-5 rounded-full"
                          />
                        }
                      >
                        {deployment.chainName}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Strategy Address:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs font-mono text-white bg-black/20 px-2 py-1 rounded flex-1">
                        {availableChains.find(c => c.chainId === selectedChain)?.strategyAddress.slice(0, 10)}...
                        {availableChains.find(c => c.chainId === selectedChain)?.strategyAddress.slice(-8)}
                      </code>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        isIconOnly
                        onClick={() => {
                          const chain = availableChains.find(c => c.chainId === selectedChain);
                          const chainInfo = chain?.chainInfo;
                          if (chainInfo && chain) {
                            window.open(`${chainInfo.explorerUrl}/address/${chain.strategyAddress}`, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Strategy Details */}
              <Card className="ondo-card">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-blue-400" />
                    Strategy Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-white">{strategy.description}</p>
                    </div>
                    
                    <Divider className="bg-white/10" />
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">TVL</p>
                        <p className="text-sm font-medium text-white">
                          ${(strategy.tvl / 1000000).toFixed(0)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">APY</p>
                        <p className="text-sm font-medium text-blue-400">{strategy.apy}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Available Chains</p>
                        <p className="text-sm font-medium text-purple-400">{availableChains.length}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {strategy.tags.map((tag) => (
                          <span key={tag} className="ondo-chip text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* User Position Data */}
              <Card className="ondo-card">
                <CardBody className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-400" />
                    Your Position
                  </h3>
                  
                  {loadingUserData ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="sm" color="primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(userData).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {value !== null ? value : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Action Interaction */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <Card className="ondo-card flex-1 flex flex-col">
                <CardBody className="p-6 flex flex-col flex-1 min-h-0">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Execute Strategy Actions
                    <p>Connected chain {chainId}</p>
                  </h3>
                  
                  {strategy.actions.length > 0 ? (
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* Action Tabs */}
                      <div className="flex-shrink-0 mb-6">
                        <Tabs
                          selectedKey={selectedAction.toString()}
                          onSelectionChange={(key) => setSelectedAction(parseInt(key as string))}
                          variant="underlined"
                          classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-white/10",
                            cursor: "w-full bg-blue-500",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-blue-400 text-gray-400"
                          }}
                        >
                          {strategy.actions.map((action, index) => (
                            <Tab 
                              key={index.toString()} 
                              title={
                                <div className="flex items-center space-x-2">
                                  <span>{action.name}</span>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={getActionTypeColor(action.type)}
                                  >
                                    #{action.id}
                                  </Chip>
                                </div>
                              } 
                            />
                          ))}
                        </Tabs>
                      </div>

                      {/* Selected Action Form - Scrollable Content */}
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <AnimatePresence mode="wait">
                          {selectedActionData && (
                            <motion.div
                              key={selectedAction}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-6"
                            >
                              <Card className="ondo-card">
                                <CardBody className="p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        selectedActionData.isReadOnly 
                                          ? 'bg-blue-500/10 border border-blue-500/20' 
                                          : 'bg-green-500/10 border border-green-500/20'
                                      }`}>
                                        {selectedActionData.isReadOnly ? (
                                          <Info className="w-5 h-5 text-blue-400" />
                                        ) : (
                                          <Zap className="w-5 h-5 text-green-400" />
                                        )}
                                      </div>
                                      <div>
                                        <h4 className="text-lg font-semibold text-white">{selectedActionData.name}</h4>
                                        <p className="text-sm text-gray-400">{selectedActionData.description}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {selectedActionData.requiresApproval && (
                                        <span className="ondo-chip-warning text-xs flex items-center">
                                          <Shield className="w-3 h-3 mr-1" />
                                          Approval Required
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">Gas: ~{selectedActionData.estimatedGas.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Token Input (if required) */}
                                  {selectedActionData.requiresToken && (
                                    <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <h5 className="text-sm font-medium text-amber-400 mb-3 flex items-center">
                                        <Coins className="w-4 h-4 mr-2" />
                                        Token Transfer Required
                                        {selectedActionData.requiresApproval && (
                                          <span className="ml-2 text-xs bg-amber-500/20 px-2 py-1 rounded">
                                            + Approval Needed
                                          </span>
                                        )}
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Token Address
                                          </label>
                                         
                                          <Input
                                            placeholder="0x... (token contract address)"
                                            value={tokenAddress}
                                            onChange={(e) => setTokenAddress(e.target.value)}
                                            onClick={()=> setOpenTokenSelector(true)}
                                            variant="bordered"
                                            classNames={{
                                              input: "text-white bg-transparent",
                                              inputWrapper: "ondo-input-wrapper border-amber-500/20"
                                            }}
                                          />
                                          <div className=" mt-1 bg-gray-900 rounded-xl">
                                            {
                                              openTokenSelector  && strategy.chains.find((c)=> c.chainId == chainId)?.validTokens?.map((token) =>{
                                                return <div
                                                onClick={() => {
                                                  setTokenAddress(token.address);
                                                  setOpenTokenSelector(false);
                                                }}
                                                
                                                className=' flex items-center m-2 bg-gray-800 text-white gap-2 p-2 rounded-xl hover:bg-gray-700 cursor-pointer'>
                                                    
                                                  <Avatar
                                                    src={token.logoUrl || '/default-token.png'}
                                                    alt={token.symbol}
                                                    className="w-6 h-6 rounded-full mr-2"
                                                  />
                                                  <span className="text-sm text-white">{token.name}</span>


                                                </div>
                                              } )
                                            }
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Amount
                                          </label>
                                          <Input
                                            type="number"
                                            placeholder="0.0"
                                            value={tokenAmount}
                                            onChange={(e) => setTokenAmount(e.target.value)}
                                            variant="bordered"
                                            classNames={{
                                              input: "text-white bg-transparent",
                                              inputWrapper: "ondo-input-wrapper border-amber-500/20"
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Parameters */}
                                  {selectedActionData.parameters.length > 0 && (
                                    <div className="space-y-4 mb-6">
                                      <h5 className="text-sm font-medium text-gray-300 flex items-center">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Action Parameters
                                      </h5>
                                      
                                      {selectedActionData.parameters.map((param, idx) => (
                                        <div key={idx} className="space-y-2">
                                          <label className="text-sm font-medium text-gray-400">
                                            {param.name}
                                            {param.required && <span className="text-red-400 ml-1">*</span>}
                                            <span className="text-purple-400 ml-1">({param.type})</span>
                                          </label>
                                          <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                                          
                                          {param.type === 'bool' ? (
                                            <Checkbox
                                              isSelected={actionInputs[actionKey]?.[param.name] || false}
                                              onValueChange={(checked) => handleInputChange(actionKey, param.name, checked)}
                                              classNames={{
                                                wrapper: "before:border-white/20"
                                              }}
                                            >
                                              <span className="text-sm text-gray-400">Enable</span>
                                            </Checkbox>
                                          ) : param.type.includes('[]') || (param.type === 'string' && param.name.toLowerCase().includes('data')) ? (
                                            <Textarea
                                              placeholder={getInputPlaceholder(param)}
                                              value={actionInputs[actionKey]?.[param.name] || ''}
                                              onChange={(e) => handleInputChange(actionKey, param.name, e.target.value)}
                                              variant="bordered"
                                              classNames={{
                                                input: "text-white bg-transparent",
                                                inputWrapper: "ondo-input-wrapper"
                                              }}
                                              minRows={3}
                                            />
                                          ) : (
                                            <Input
                                              type={getInputType(param.type)}
                                              placeholder={getInputPlaceholder(param)}
                                              value={actionInputs[actionKey]?.[param.name] || ''}
                                              onChange={(e) => handleInputChange(actionKey, param.name, e.target.value)}
                                              variant="bordered"
                                              classNames={{
                                                input: "text-white bg-transparent",
                                                inputWrapper: "ondo-input-wrapper"
                                              }}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <Button
                                    onClick={handleExecuteAction}
                                    isLoading={loading[actionKey]}
                                    className="w-full ondo-button-primary"
                                    startContent={!loading[actionKey] && <ArrowRight className="w-4 h-4" />}
                                    isDisabled={selectedActionData.requiresToken && (!tokenAddress || !tokenAmount)}
                                  >
                                    {loading[actionKey] ? 'Executing...' : `Execute ${selectedActionData.name}`}
                                  </Button>

                                  {/* Approval Status */}
                                  {approvalStatus[actionKey] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-4"
                                    >
                                      <div className={`p-3 rounded-lg border ${
                                        approvalStatus[actionKey].status === 'success'
                                          ? 'bg-green-500/10 border-green-500/30'
                                          : 'bg-red-500/10 border-red-500/30'
                                      }`}>
                                        <div className="flex items-center space-x-2">
                                          {approvalStatus[actionKey].status === 'success' ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                          ) : (
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                          )}
                                          <span className="text-sm font-medium text-white">
                                            Token Approval {approvalStatus[actionKey].status === 'success' ? 'Successful' : 'Failed'}
                                          </span>
                                          {approvalStatus[actionKey].txHash && (
                                            <code className="text-xs font-mono text-gray-300">
                                              {approvalStatus[actionKey].txHash!.slice(0, 10)}...
                                            </code>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}

                                  {/* Result Display */}
                                  {results[actionKey] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-6"
                                    >
                                      <Divider className="bg-white/10 mb-4" />
                                      
                                      <div className={`p-4 rounded-xl border ${
                                        results[actionKey].type === 'error' 
                                          ? 'bg-red-500/10 border-red-500/30' 
                                          : 'bg-green-500/10 border-green-500/30'
                                      }`}>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-2">
                                            {results[actionKey].type === 'error' ? (
                                              <AlertTriangle className="w-4 h-4 text-red-400" />
                                            ) : (
                                              <CheckCircle className="w-4 h-4 text-green-400" />
                                            )}
                                            <span className="text-sm font-medium text-white">
                                              {results[actionKey].type === 'error' ? 'Execution Failed' : 'Execution Successful'}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-400 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {results[actionKey].timestamp}
                                          </span>
                                        </div>

                                        <div className="bg-black/20 p-3 rounded-lg">
                                          <pre className={`text-sm font-mono whitespace-pre-wrap ${
                                            results[actionKey].type === 'error' ? 'text-red-300' : 'text-gray-300'
                                          }`}>
                                            {typeof results[actionKey].data === 'object' 
                                              ? JSON.stringify(results[actionKey].data, null, 2)
                                              : results[actionKey].data
                                            }
                                          </pre>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </CardBody>
                              </Card>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No Actions Available</h3>
                      <p className="text-gray-400">This strategy doesn't have any available actions for interaction.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex-shrink-0">
          <Button 
            variant="light" 
            onPress={onClose}
            className="ondo-button-secondary"
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}