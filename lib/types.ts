export interface Strategy {
  id: string;
  name: string;
  description: string;
  protocol: string;
  chains: ChainDeployment[]; // Multiple chain deployments
  category: 'lending' | 'liquidity' | 'staking' | 'yield';
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  logoUrl: string;
  actions: StrategyAction[]; // Predefined actions instead of ABI
  tags: string[];
}

export interface ChainDeployment {
  chainId: number;
  chainName: string;
  strategyAddress: string;
  routerAddress: string;
  isActive: boolean;
}

export interface StrategyAction {
  id: number;
  name: string;
  description: string;
  type: 'deposit' | 'withdraw' | 'claim' | 'stake' | 'unstake' | 'compound' | 'borrow' | 'repay' | 'manage';
  parameters: ActionParameter[];
  isReadOnly: boolean;
  requiresToken: boolean;
  requiresApproval: boolean; // New field for approval requirement
  estimatedGas: number;
}

export interface ActionParameter {
  name: string;
  type: 'uint256' | 'address' | 'bool' | 'string' | 'bytes' | 'address[]' | 'uint256[]';
  description: string;
  required: boolean;
  defaultValue?: string;
  validation?: {
    min?: string;
    max?: string;
    pattern?: string;
  };
}

export interface CrossChainExecution {
  destinationChain: string | number;
  receiver: string; // Router address on destination chain
  strategy: string; // Strategy address on destination chain
  action: number; // Action ID
  token: string; // Token address or address(0)
  amount: string; // Token amount or "0"
  data: string; // Encoded parameters
}

export interface ApprovalTransaction {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface ABIFunction {
  name: string;
  type: 'function';
  inputs: ABIInput[];
  outputs: ABIOutput[];
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
}

export interface ABIInput {
  name: string;
  type: string;
  internalType?: string;
  components?: ABIInput[]; // For structs/tuples
}

export interface ABIOutput {
  name: string;
  type: string;
  internalType?: string;
  components?: ABIOutput[]; // For structs/tuples
}

export interface FunctionResult {
  type: 'success' | 'error' | 'transaction' | 'approval';
  data: any;
  timestamp: string;
  txHash?: string;
  approvalTx?: ApprovalTransaction;
}

export interface UserPosition {
  strategyId: string;
  chainId: number;
  balance: number;
  value: number;
  shares: number;
  apy: number;
  claimableRewards: number;
  lastUpdated: Date;
  contractData?: Record<string, any>; // Data from read functions
}

export interface Transaction {
  id: string;
  hash: string;
  type: string;
  strategyId: string;
  strategyName: string;
  chain: string;
  amount: number;
  value: number;
  gasUsed: number;
  gasPrice: number;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
}

export interface PlatformMetrics {
  totalStrategies: number;
  totalYieldSynced: number;
  crossChainTransactions: number;
  revenueGenerated: number;
  activeUsers: number;
  totalVolume: number;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface Chain {
  id: number;
  name: string;
  symbol: string;
  logoUrl: string;
  rpcUrl: string;
  explorerUrl: string;
  routerAddress: string; // Cross-chain router address
  isActive: boolean;
}

// Admin types
export interface ProtocolConfig {
  id: string;
  chainSelector: string;
  protocol: string;
  strategy: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ProtocolEntry {
  id: string;
  chainSelector: string;
  protocol: string;
  isAllowed: boolean;
  createdAt: Date;
}

export interface AdminContractFunctions {
  setAction: (chainSelector: string, protocol: string, strategy: string, action: string) => Promise<void>;
  setStrategyAction: (chainSelector: string, protocol: string, strategy: string, action: string) => Promise<void>;
  setProtocol: (chainSelector: string, protocol: string, allowed: boolean) => Promise<void>;
}