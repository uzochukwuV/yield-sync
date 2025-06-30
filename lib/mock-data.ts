import { Strategy, UserPosition, Transaction, PlatformMetrics, ChartData, Chain } from './types';

export const mockStrategies: Strategy[] = [
  {
  "id": "simple-usdc-vault",
  "name": "Simple Multi-Asset Vault",
  "description": "Basic vault allowing deposits and withdrawals of supported ERC-20 tokens",
  "protocol": "Custom Vault",
  "chains": [
    {
      "chainId": 84532,
      "chainName": "Base Sepolia",
      "strategyAddress": "0x0687c557BcF088922Df1A54392c45BEdaDc8118F",
      "routerAddress": "0x0b08a6b201D4Da4Ea3F40EA3156f303B7afB0e6a",
      "isActive": true
    },
    {
      "chainId": 11155111,
      "chainName": "Etherum Sepolia",
      "strategyAddress": "0xa018DbBF743d9A7b5741e13c21152942A5947cB4", //"0xd23a73375F06038B8EaC7FAbf0A14f6E571bBa2F",
      "routerAddress": "0xe0d40a806723a0b4B1DcF8F2cEAB6f90D84Ce0Ed",
      "isActive": true
    }
  ],
  "category": "yield",
  "apy": 0.0,
  "tvl": 0,
  "riskLevel": "low",
  "isActive": true,
  "logoUrl": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  "actions": [
    {
      "id": 1,
      "name": "Deposit",
      "description": "Deposit ERC-20 tokens into the vault",
      "type": "deposit",
      "parameters": [
        {
          "name": "token",
          "type": "address",
          "description": "Address of the token to deposit",
          "required": true
        },
        {
          "name": "amount",
          "type": "uint256",
          "description": "Amount of tokens to deposit",
          "required": true,
          "validation": { "min": "0" }
        }
      ],
      "isReadOnly": false,
      "requiresToken": true,
      "requiresApproval": true,
      "estimatedGas": 70000
    },
    {
      "id": 2,
      "name": "Withdraw",
      "description": "Withdraw tokens from the vault",
      "type": "withdraw",
      "parameters": [
        {
          "name": "token",
          "type": "address",
          "description": "Address of the token to withdraw",
          "required": true
        },
        {
          "name": "amount",
          "type": "uint256",
          "description": "Amount of tokens to withdraw",
          "required": true,
          "validation": { "min": "0" }
        }
      ],
      "isReadOnly": false,
      "requiresToken": false,
      "requiresApproval": false,
      "estimatedGas": 70000
    }
  ],
  "tags": ["Vault", "ERC-20", "Base Sepolia", "Custom Strategy"]
}

];

export const mockUserPositions: UserPosition[] = [
  {
    strategyId: 'aave-v3-vault',
    chainId: 1,
    balance: 2.5,
    value: 5250.75,
    shares: 1.25,
    apy: 8.2,
    claimableRewards: 45.32,
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
    contractData: {
      supplied: '5000.0',
      borrowed: '2000.0',
      healthFactor: '2.5',
      collateralValue: '5250.75'
    }
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'Supply',
    strategyId: 'aave-v3-vault',
    strategyName: 'Aave V3 Multi-Asset Vault',
    chain: 'Ethereum',
    amount: 1.0,
    value: 2100.50,
    gasUsed: 150000,
    gasPrice: 30,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    status: 'success',
  }
];

export const mockPlatformMetrics: PlatformMetrics = {
  totalStrategies: 1247,
  totalYieldSynced: 2847291.50,
  crossChainTransactions: 45892,
  revenueGenerated: 145670.25,
  activeUsers: 8934,
  totalVolume: 12847390.75,
};

export const mockChartData: ChartData[] = [
  { date: '2024-01-01', value: 1200000 },
  { date: '2024-01-02', value: 1350000 },
  { date: '2024-01-03', value: 1280000 },
  { date: '2024-01-04', value: 1420000 },
  { date: '2024-01-05', value: 1380000 },
  { date: '2024-01-06', value: 1510000 },
  { date: '2024-01-07', value: 1470000 },
  { date: '2024-01-08', value: 1590000 },
  { date: '2024-01-09', value: 1650000 },
  { date: '2024-01-10', value: 1720000 },
  { date: '2024-01-11', value: 1680000 },
  { date: '2024-01-12', value: 1750000 },
  { date: '2024-01-13', value: 1820000 },
  { date: '2024-01-14', value: 1890000 },
  { date: '2024-01-15', value: 1950000 },
];

export const mockChains: Chain[] = [
  {
    id: 11155111,
    name: 'Ethereum Sepolia',
    symbol: 'Seplia ETH',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
    explorerUrl: 'https://etherscan.io',
    routerAddress: '0x1234567890123456789012345678901234567890',
    isActive: true,
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    symbol: 'ETH',
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    routerAddress: '0x2345678901234567890123456789012345678901',
    isActive: true,
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    logoUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    routerAddress: '0x4567890123456789012345678901234567890123',
    isActive: true,
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    routerAddress: '0x3456789012345678901234567890123456789012',
    isActive: true,
  },
];