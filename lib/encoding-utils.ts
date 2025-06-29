import { ethers } from 'ethers';
import { ActionParameter, StrategyAction } from './types';

/**
 * Encode function parameters for cross-chain execution
 */
export function encodeActionParameters(
  action: StrategyAction,
  inputs: Record<string, any>
): string {
  try {
    // Create function signature for encoding
    const types = action.parameters.map(param => param.type);
    const values = action.parameters.map(param => {
      let value = inputs[param.name];
      
      // Handle default values
      if (!value && param.defaultValue) {
        value = param.defaultValue;
      }
      
      // Type conversions
      if (param.type.includes('uint') && typeof value === 'string') {
        value = ethers.parseUnits(value, 18); // Convert to BigNumber
      } else if (param.type === 'bool') {
        value = Boolean(value);
      } else if (param.type === 'address' && value === 'msg.sender') {
        // This will be replaced by the actual sender in the contract
        value = value as `0x${string}`;
      } else if (param.type.includes('[]')) {
        // Handle arrays - parse JSON string or split comma-separated values
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            // If not JSON, try comma-separated values
            value = value.split(',').map((v: string) => v.trim());
          }
        }
      }
      
      return value;
    });
    console.log('Encoding parameters:', { types, values });
    console.log('Encoded values:', values);

    // Encode the parameters
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, values);
    return encoded;
  } catch (error) {
    console.error('Error encoding parameters:', error);
    throw new Error(`Failed to encode parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode function parameters for display
 */
export function decodeActionParameters(
  action: StrategyAction,
  encodedData: string
): Record<string, any> {
  try {
    const types = action.parameters.map(param => param.type);
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(types, encodedData);
    
    const result: Record<string, any> = {};
    action.parameters.forEach((param, index) => {
      result[param.name] = decoded[index];
    });
    
    return result;
  } catch (error) {
    console.error('Error decoding parameters:', error);
    throw new Error(`Failed to decode parameters: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate parameter input based on type and validation rules
 */
export function validateParameterInput(
  parameter: ActionParameter,
  value: any
): { isValid: boolean; error?: string } {
  if (parameter.required && (!value || value === '')) {
    return { isValid: false, error: `${parameter.name} is required` };
  }

  if (!value && !parameter.required) {
    return { isValid: true };
  }

  // Type-specific validation
  switch (parameter.type) {
    case 'uint256':
      if (isNaN(Number(value)) || Number(value) < 0) {
        return { isValid: false, error: 'Must be a positive number' };
      }
      if (parameter.validation?.min && Number(value) < Number(parameter.validation.min)) {
        return { isValid: false, error: `Must be at least ${parameter.validation.min}` };
      }
      if (parameter.validation?.max && Number(value) > Number(parameter.validation.max)) {
        return { isValid: false, error: `Must be at most ${parameter.validation.max}` };
      }
      break;

    case 'address':
      if (value !== 'msg.sender' && !ethers.isAddress(value)) {
        return { isValid: false, error: 'Must be a valid Ethereum address' };
      }
      break;

    case 'bool':
      // Boolean values are always valid
      break;

    case 'string':
      if (parameter.validation?.pattern) {
        const regex = new RegExp(parameter.validation.pattern);
        if (!regex.test(value)) {
          return { isValid: false, error: 'Invalid format' };
        }
      }
      break;

    case 'bytes':
      if (!value.startsWith('0x')) {
        return { isValid: false, error: 'Must start with 0x' };
      }
      break;

    case 'address[]':
    case 'uint256[]':
      // Array validation - check if it's a valid array format
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          // Check if it's comma-separated
          if (!value.includes(',')) {
            return { isValid: false, error: 'Must be a JSON array or comma-separated values' };
          }
        }
      }
      break;
  }

  return { isValid: true };
}

/**
 * Format parameter value for display
 */
export function formatParameterValue(parameter: ActionParameter, value: any): string {
  if (!value) return '';

  switch (parameter.type) {
    case 'uint256':
      return ethers.formatUnits(value, 0);
    case 'address':
      return value;
    case 'bool':
      return value ? 'true' : 'false';
    case 'string':
    case 'bytes':
      return value.toString();
    case 'address[]':
    case 'uint256[]':
      return Array.isArray(value) ? JSON.stringify(value) : value.toString();
    default:
      return value.toString();
  }
}

/**
 * Get input type for HTML input element
 */
export function getInputType(parameterType: string): string {
  switch (parameterType) {
    case 'uint256':
      return 'number';
    case 'bool':
      return 'checkbox';
    case 'address':
    case 'string':
    case 'bytes':
    case 'address[]':
    case 'uint256[]':
      return 'text';
    default:
      return 'text';
  }
}

/**
 * Get placeholder text for input
 */
export function getInputPlaceholder(parameter: ActionParameter): string {
  if (parameter.defaultValue) {
    return parameter.defaultValue;
  }

  switch (parameter.type) {
    case 'uint256':
      return 'Enter amount';
    case 'address':
      return '0x... or msg.sender';
    case 'bool':
      return '';
    case 'string':
      return `Enter ${parameter.name}`;
    case 'bytes':
      return '0x...';
    case 'address[]':
      return '["0x...", "0x..."] or 0x..., 0x...';
    case 'uint256[]':
      return '[100, 200, 300] or 100, 200, 300';
    default:
      return `Enter ${parameter.name}`;
  }
}