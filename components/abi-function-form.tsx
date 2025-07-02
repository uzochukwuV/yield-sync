"use client";

import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Chip,
  Checkbox,
  Textarea,
  Divider
} from '@heroui/react';
import { 
  Eye, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Copy,
  Zap
} from 'lucide-react';
import { ABIFunction, FunctionResult } from '@/lib/types';
import { 
  getInputType, 
  getInputPlaceholder, 
  isViewFunction, 
  isPayableFunction,
  formatFunctionSignature 
} from '@/lib/abi-utils';
import { toast } from 'sonner';

interface ABIFunctionFormProps {
  func: ABIFunction;
  inputs: Record<string, any>;
  result?: FunctionResult;
  isLoading: boolean;
  onInputChange: (paramName: string, value: any) => void;
  onExecute: () => void;
  explorerUrl?: string;
}

export function ABIFunctionForm({
  func,
  inputs,
  result,
  isLoading,
  onInputChange,
  onExecute,
  explorerUrl
}: ABIFunctionFormProps) {
  const isView = isViewFunction(func);
  const isPayable = isPayableFunction(func);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const openInExplorer = (txHash: string) => {
    if (explorerUrl && txHash) {
      window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="ondo-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isView 
                  ? 'bg-blue-500/10 border border-blue-500/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                {isView ? (
                  <Eye className="w-5 h-5 text-blue-400" />
                ) : (
                  <Send className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{func.name}</h3>
                <p className="text-sm text-gray-400 font-mono">
                  {formatFunctionSignature(func)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${
                isView ? 'ondo-chip' : 'ondo-chip-success'
              }`}>
                {isView ? 'Read' : 'Write'}
              </span>
              {isPayable && (
                <span className="ondo-chip-warning text-xs px-2 py-1 rounded">
                  Payable
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {func.inputs.length > 0 && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-gray-300 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Parameters
              </h4>
              
              {func.inputs.map((input, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    {input.name} 
                    <span className="text-purple-400 ml-1">({input.type})</span>
                  </label>
                  
                  {input.type === 'bool' ? (
                    <Checkbox
                      isSelected={inputs[input.name] || false}
                      onValueChange={(checked) => onInputChange(input.name, checked)}
                      classNames={{
                        wrapper: "before:border-white/20"
                      }}
                    >
                      <span className="text-sm text-gray-400">Enable</span>
                    </Checkbox>
                  ) : input.type === 'string' && input.name.toLowerCase().includes('data') ? (
                    <Textarea
                      placeholder={getInputPlaceholder(input.type, input.name)}
                      value={inputs[input.name] || ''}
                      onChange={(e) => onInputChange(input.name, e.target.value)}
                      variant="bordered"
                      classNames={{
                        input: "text-white bg-transparent",
                        inputWrapper: "ondo-input-wrapper"
                      }}
                      minRows={3}
                    />
                  ) : (
                    <Input
                      type={getInputType(input.type)}
                      placeholder={getInputPlaceholder(input.type, input.name)}
                      value={inputs[input.name] || ''}
                      onChange={(e) => onInputChange(input.name, e.target.value)}
                      variant="bordered"
                      classNames={{
                        input: "text-white bg-transparent",
                        inputWrapper: "ondo-input-wrapper"
                      }}
                    />
                  )}
                </div>
              ))}

              {isPayable && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    ETH Value 
                    <span className="text-amber-400 ml-1">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={inputs._value || ''}
                    onChange={(e) => onInputChange('_value', e.target.value)}
                    variant="bordered"
                    endContent={<span className="text-gray-400 text-sm">ETH</span>}
                    classNames={{
                      input: "text-white bg-transparent",
                      inputWrapper: "ondo-input-wrapper border-amber-500/20 hover:border-amber-500/40"
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <Button
            onClick={onExecute}
            isLoading={isLoading}
            className={`w-full font-medium ${
              isView 
                ? 'ondo-button-secondary' 
                : 'ondo-button-primary'
            }`}
            startContent={!isLoading && (isView ? <Eye className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
          >
            {isLoading ? 'Processing...' : (isView ? 'Read Data' : 'Execute Transaction')}
          </Button>

          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6"
            >
              <Divider className="bg-white/10 mb-4" />
              
              <div className={`p-4 rounded-xl border ${
                result.type === 'error' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : result.type === 'transaction'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {result.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                      {result.type === 'transaction' ? 'Transaction Result' : 
                       result.type === 'error' ? 'Error' : 'Read Result'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{result.timestamp}</span>
                </div>

                <div className="space-y-2">
                  {result.type === 'transaction' && result.txHash && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Transaction Hash:</span>
                      <code className="text-sm font-mono text-white bg-black/20 px-2 py-1 rounded">
                        {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                      </code>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onClick={() => copyToClipboard(result.txHash!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {explorerUrl && (
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={() => openInExplorer(result.txHash!)}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="bg-black/20 p-3 rounded-lg">
                    <pre className={`text-sm font-mono whitespace-pre-wrap ${
                      result.type === 'error' ? 'text-red-300' : 'text-gray-300'
                    }`}>
                      {typeof result.data === 'object' 
                        ? JSON.stringify(result.data, null, 2)
                        : result.data
                      }
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}