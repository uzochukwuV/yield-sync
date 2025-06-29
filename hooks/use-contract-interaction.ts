"use client";

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ABIFunction, FunctionResult } from '@/lib/types';
import { validateInput, isViewFunction, isPayableFunction } from '@/lib/abi-utils';
import { toast } from 'sonner';

export function useContractInteraction(contractAddress: string, abi: any[]) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [functionInputs, setFunctionInputs] = useState<Record<string, Record<string, any>>>({});
  const [results, setResults] = useState<Record<string, FunctionResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleInputChange = useCallback((funcName: string, paramName: string, value: any) => {
    setFunctionInputs(prev => ({
      ...prev,
      [funcName]: {
        ...prev[funcName],
        [paramName]: value
      }
    }));
  }, []);

  const validateInputs = useCallback((func: ABIFunction, inputs: Record<string, any>): boolean => {
    for (const input of func.inputs) {
      const value = inputs[input.name];
      if (!validateInput(value, input.type)) {
        toast.error(`Invalid input for ${input.name} (${input.type})`);
        return false;
      }
    }
    return true;
  }, []);

  const executeFunction = useCallback(async (func: ABIFunction) => {
    const funcName = func.name;
    const inputs = functionInputs[funcName] || {};
    
    if (!validateInputs(func, inputs)) {
      return;
    }

    setLoading(prev => ({ ...prev, [funcName]: true }));

    try {
      if (isViewFunction(func)) {
        // For view functions, we'll simulate the read
        // In a real implementation, you'd use useReadContract
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockResult = func.outputs.length > 0 ? 
          func.outputs.map(output => {
            if (output.type.includes('uint')) return '12345';
            if (output.type === 'bool') return 'true';
            if (output.type === 'address') return '0x742d35Cc6634C0532925a3b8D';
            return 'Mock Result';
          }).join(', ') : 'Success';

        setResults(prev => ({
          ...prev,
          [funcName]: {
            type: 'success',
            data: mockResult,
            timestamp: new Date().toLocaleTimeString()
          }
        }));
        
        toast.success(`${funcName} executed successfully`);
      } else {
        // For write functions
        const args = func.inputs.map(input => {
          let value = inputs[input.name];
          
          // Convert values based on type
          if (input.type.includes('uint') || input.type.includes('int')) {
            value = BigInt(value);
          }
          
          return value;
        });

        const txConfig: any = {
          address: contractAddress as `0x${string}`,
          abi,
          functionName: funcName,
          args
        };

        // Handle payable functions
        if (isPayableFunction(func) && inputs._value) {
          txConfig.value = parseEther(inputs._value.toString());
        }

        // Simulate transaction for now
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);

        setResults(prev => ({
          ...prev,
          [funcName]: {
            type: 'transaction',
            data: mockTxHash,
            txHash: mockTxHash,
            timestamp: new Date().toLocaleTimeString()
          }
        }));

        toast.success(`Transaction submitted: ${mockTxHash.slice(0, 10)}...`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setResults(prev => ({
        ...prev,
        [funcName]: {
          type: 'error',
          data: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

      toast.error(`Error executing ${funcName}: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [funcName]: false }));
    }
  }, [contractAddress, abi, functionInputs, validateInputs]);

  const readUserData = useCallback(async (readFunctions: string[]) => {
    if (!address) return {};

    const userData: Record<string, any> = {};

    for (const funcName of readFunctions) {
      try {
        // Simulate reading user data
        // In real implementation, use useReadContract for each function
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user data based on function name
        if (funcName.includes('balance') || funcName.includes('Balance')) {
          userData[funcName] = '1000.5';
        } else if (funcName.includes('allowance') || funcName.includes('Allowance')) {
          userData[funcName] = '500.0';
        } else if (funcName.includes('shares') || funcName.includes('Shares')) {
          userData[funcName] = '250.75';
        } else {
          userData[funcName] = 'Mock Data';
        }
      } catch (error) {
        console.error(`Error reading ${funcName}:`, error);
        userData[funcName] = null;
      }
    }

    return userData;
  }, [address]);

  return {
    functionInputs,
    results,
    loading,
    handleInputChange,
    executeFunction,
    readUserData
  };
}