import { ABIFunction, ABIInput } from './types';

export function parseABI(abiString: string): any[] {
  try {
    const parsed = JSON.parse(abiString);
    if (!Array.isArray(parsed)) {
      throw new Error('ABI must be an array');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid ABI JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getFunctionFromABI(abi: any[], functionName: string): ABIFunction | null {
  const func = abi.find(item => 
    item.type === 'function' && item.name === functionName
  );
  return func || null;
}

export function getInputType(solidityType: string): string {
  if (solidityType.includes('uint') || solidityType.includes('int')) {
    return 'number';
  }
  if (solidityType === 'bool') {
    return 'checkbox';
  }
  if (solidityType === 'address') {
    return 'text';
  }
  if (solidityType === 'string') {
    return 'text';
  }
  if (solidityType.includes('bytes')) {
    return 'text';
  }
  return 'text';
}

export function getInputPlaceholder(solidityType: string, paramName: string): string {
  if (solidityType === 'address') {
    return '0x...';
  }
  if (solidityType.includes('uint') || solidityType.includes('int')) {
    return 'Enter number';
  }
  if (solidityType === 'bool') {
    return '';
  }
  if (solidityType === 'string') {
    return `Enter ${paramName}`;
  }
  if (solidityType.includes('bytes')) {
    return '0x...';
  }
  return `Enter ${paramName}`;
}

export function validateInput(value: any, solidityType: string): boolean {
  if (!value && value !== 0 && value !== false) return false;
  
  if (solidityType === 'address') {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }
  
  if (solidityType.includes('uint') || solidityType.includes('int')) {
    return !isNaN(Number(value)) && Number(value) >= 0;
  }
  
  if (solidityType === 'bool') {
    return typeof value === 'boolean';
  }
  
  if (solidityType.includes('bytes')) {
    return typeof value === 'string' && value.startsWith('0x');
  }
  
  return true;
}

export function formatFunctionSignature(func: ABIFunction): string {
  const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
  return `${func.name}(${inputs})`;
}

export function isViewFunction(func: ABIFunction): boolean {
  return func.stateMutability === 'view' || func.stateMutability === 'pure';
}

export function isPayableFunction(func: ABIFunction): boolean {
  return func.stateMutability === 'payable';
}

export function formatResult(result: any, outputType: string): string {
  if (outputType === 'address') {
    return result;
  }
  if (outputType.includes('uint') || outputType.includes('int')) {
    return result.toString();
  }
  if (outputType === 'bool') {
    return result ? 'true' : 'false';
  }
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }
  return result.toString();
}