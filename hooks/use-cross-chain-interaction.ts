"use client";

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { Strategy, StrategyAction, CrossChainExecution, FunctionResult, ApprovalTransaction } from '@/lib/types';
import { encodeActionParameters, validateParameterInput } from '@/lib/encoding-utils';
import { mockChains } from '@/lib/mock-data';
import { toast } from 'sonner';
import { write } from 'node:fs';
import { chainUID, getChainUID } from '@/lib/wagmi-config';

export function useCrossChainInteraction() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [actionInputs, setActionInputs] = useState<Record<string, Record<string, any>>>({});
  const [results, setResults] = useState<Record<string, FunctionResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedChain, setSelectedChain] = useState<number>(1); // Default to Ethereum
  const [approvalStatus, setApprovalStatus] = useState<Record<string, ApprovalTransaction>>({});

  const handleInputChange = useCallback((actionId: string, paramName: string, value: any) => {
    setActionInputs(prev => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        [paramName]: value
      }
    }));
  }, []);

  const validateInputs = useCallback((action: StrategyAction, inputs: Record<string, any>): boolean => {
    for (const param of action.parameters) {
      const value = inputs[param.name];
      const validation = validateParameterInput(param, value);
      
      if (!validation.isValid) {
        toast.error(`${param.name}: ${validation.error}`);
        return false;
      }
    }
    return true;
  }, []);

  const executeApproval = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<ApprovalTransaction> => {
    try {
      // Simulate approval transaction
      console.log(`Requesting approval for ${amount} tokens at ${tokenAddress} for spender ${spenderAddress}`);
      const trx = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            type: 'function',
            name: 'approve',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable'
          }
        ],
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, parseUnits(amount, 18)],
        account: address
      })
      
      
      const approvalTx: ApprovalTransaction = {
        tokenAddress,
        spenderAddress,
        amount,
        txHash: trx,
        status: 'success'
      };

      toast.success(`Token approval successful: ${trx.slice(0, 10)}...`);
      return approvalTx;
    } catch (error) {
      const approvalTx: ApprovalTransaction = {
        tokenAddress,
        spenderAddress,
        amount,
        status: 'failed'
      };
      
      toast.error('Token approval failed');
      throw approvalTx;
    }
  }, []);

  const executeAction = useCallback(async (
    strategy: Strategy,
    action: StrategyAction,
    tokenAddress?: string,
    tokenAmount?: string
  ) => {
    const actionKey = `${strategy.id}-${action.id}`;
    const inputs = actionInputs[actionKey] || {};
    
    if (!validateInputs(action, inputs)) {
      return;
    }

    // Find chain deployment
    const chainDeployment = strategy.chains.find(c => c.chainId === chainId);
    if (!chainDeployment) {
      toast.error('Strategy not available on selected chain');
      return;
    }

    const chain = mockChains.find(c => c.id === selectedChain);

    const targetChain = strategy.chains.find(c => c.chainId === selectedChain);
    if (!targetChain) {
      toast.error('Target chain not available for this strategy');
      return;
    }
    if (!chain) {
      toast.error('Chain not supported');
      return;
    }

    setLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      let approvalTx: ApprovalTransaction | undefined;

      // Handle token approval if required
      if (action.requiresApproval && action.requiresToken && tokenAddress && tokenAmount) {
        toast.info('Requesting token approval...');
        
        try {
          approvalTx = await executeApproval(
            tokenAddress,
            chainDeployment.routerAddress, // Approve strategy contract
            tokenAmount
          );
          
          setApprovalStatus(prev => ({
            ...prev,
            [actionKey]: approvalTx!
          }));
        } catch (error) {
          setResults(prev => ({
            ...prev,
            [actionKey]: {
              type: 'error',
              data: 'Token approval failed. Transaction cancelled.',
              timestamp: new Date().toLocaleTimeString()
            }
          }));
          return;
        }
      }

      // Encode parameters
      const encodedData = encodeActionParameters(action, inputs);
      const id = getChainUID(selectedChain)!

      console.log(id, tokenAmount)
      // return ;
      // Prepare cross-chain execution data
      const execution: CrossChainExecution = {
        destinationChain:id,
        receiver: targetChain.routerAddress,
        strategy: targetChain.strategyAddress,
        action: action.id,
        token: tokenAddress || '0x0000000000000000000000000000000000000000',
        amount: parseEther(tokenAmount!).toString() || '0',
        data: encodedData
      };
      console.log('Executing action with execution data:', execution);

      // Simulate the main transaction
      toast.info(`Executing ${action.name}...`);
      const txHash =await writeContractAsync({
        address: chainDeployment.routerAddress as `0x${string}`,
        abi: [{
			"inputs": [
				{
					"internalType": "uint64",
					"name": "destinationChain",
					"type": "uint64"
				},
				{
					"internalType": "address",
					"name": "receiver",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "strategy",
					"type": "address"
				},
				{
					"internalType": "uint64",
					"name": "action",
					"type": "uint64"
				},
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amount",
					"type": "uint256"
				},
				{
					"internalType": "bytes",
					"name": "data",
					"type": "bytes"
				}
			],
			"name": "crossChainSync",
			"outputs": [
				{
					"internalType": "bytes32",
					"name": "messageId",
					"type": "bytes32"
				}
			],
			"stateMutability": "nonpayable",
			"type": "function"
		}],
        functionName: 'crossChainSync',
        args: [
          BigInt(execution.destinationChain),
          execution.receiver as `0x${string}`,
          execution.strategy as `0x${string}`,
          BigInt(execution.action),
          execution.token as `0x${string}`,
          BigInt(execution.amount),
          execution.data as `0x${string}`
        ],
        account: address,
        gas: BigInt(3000000) // Adjust gas limit as needed
      });
      
     
      setResults(prev => ({
        ...prev,
        [actionKey]: {
          type: 'transaction',
          data: {
            txHash: txHash,
            execution,
            chainName: chain.name,
            actionName: action.name,
            approvalRequired: action.requiresApproval,
            tokenTransfer: action.requiresToken
          },
          txHash: txHash,
          timestamp: new Date().toLocaleTimeString(),
          approvalTx
        }
      }));

      // Reset inputs after successful execution
      setActionInputs(prev => ({
        ...prev,
        [actionKey]: {}
      }));

      toast.success(`${action.name} executed successfully on ${chain.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setResults(prev => ({
        ...prev,
        [actionKey]: {
          type: 'error',
          data: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

      toast.error(`Error executing ${action.name}: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [selectedChain, actionInputs, validateInputs, executeApproval]);

  const getAvailableChains = useCallback((strategy: Strategy) => {
    return strategy.chains
      .filter(deployment => deployment.isActive)
      .map(deployment => ({
        ...deployment,
        chainInfo: mockChains.find(c => c.id === deployment.chainId)
      }))
      .filter(item => item.chainInfo);
  }, []);

  const getUserPositions = useCallback(async (strategy: Strategy, chainId: number) => {
    // Simulate reading user positions from the strategy
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data based on strategy and chain
    const mockData: Record<string, any> = {};
    
    if (strategy.category === 'lending') {
      mockData.supplied = '1000.5';
      mockData.borrowed = '250.0';
      mockData.healthFactor = '3.2';
      mockData.collateralValue = '1000.5';
      mockData.borrowCapacity = '750.0';
    } else if (strategy.category === 'liquidity') {
      mockData.liquidity = '2500.75';
      mockData.token0Balance = '1.25';
      mockData.token1Balance = '2500.0';
      mockData.feesEarned0 = '0.05';
      mockData.feesEarned1 = '12.34';
      mockData.positionCount = '3';
    } else if (strategy.category === 'staking') {
      mockData.staked = '500.0';
      mockData.rewards = '25.5';
      mockData.apr = '22.4';
      mockData.stakingPeriod = '30 days';
    }
    
    return mockData;
  }, []);

  return {
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
  };
}