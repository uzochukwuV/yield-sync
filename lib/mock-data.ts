import { Strategy, UserPosition, Transaction, PlatformMetrics, ChartData, Chain } from './types';

export const mockStrategies: Strategy[] = [
//   {
//   "id": "simple-usdc-vault",
//   "name": "Simple USDC Vault",
//   "description": "Basic vault allowing deposits and withdrawals of supported USDC ERC-20 tokens",
//   "protocol": "Custom Vault",
//   "chains": [
//     {
//       "chainId": 84532,
//       "chainName": "Base Sepolia",
//       "strategyAddress": "0x0687c557BcF088922Df1A54392c45BEdaDc8118F",
//       "routerAddress": "0x0b08a6b201D4Da4Ea3F40EA3156f303B7afB0e6a",
//       "isActive": true,
//       "logo": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
//       "validTokens": [
//          {
//           "name": "USDC",
//         "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
//         "symbol": "USDC",
//         "decimals": 6,
//         "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
//       }
//       ]
//     },
//     {
//       "chainId": 11155111,
//       "chainName": "Etherum Sepolia",
//       "strategyAddress": "0xa018DbBF743d9A7b5741e13c21152942A5947cB4", //"0xd23a73375F06038B8EaC7FAbf0A14f6E571bBa2F",
//       "routerAddress": "0xe0d40a806723a0b4B1DcF8F2cEAB6f90D84Ce0Ed",
//       "isActive": true,
//        "validTokens": [
//          {
//           "name": "USDC",
//         "address": "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
//         "symbol": "USDC",
//         "decimals": 6,
//         "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
//       }
//       ]
//     }
//   ],
//   "category": "yield",
//   "apy": 0.0,
//   "tvl": 0,
//   "riskLevel": "low",
//   "isActive": true,
//   "logoUrl": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
//   "actions": [
//     {
//       "id": 1,
//       "name": "Deposit",
//       "description": "Deposit ERC-20 tokens into the vault",
//       "type": "deposit",
//       "parameters": [
//         {
//           "name": "token",
//           "type": "address",
//           "description": "Address of the token to deposit",
//           "required": true
//         },
//         {
//           "name": "amount",
//           "type": "uint256",
//           "description": "Amount of tokens to deposit",
//           "required": true,
//           "validation": { "min": "0" }
//         }
//       ],
//       "isReadOnly": false,
//       "requiresToken": true,
//       "requiresApproval": true,
//       "estimatedGas": 70000
//     },
//     {
//       "id": 2,
//       "name": "Withdraw",
//       "description": "Withdraw tokens from the vault",
//       "type": "withdraw",
//       "parameters": [
//         {
//           "name": "token",
//           "type": "address",
//           "description": "Address of the token to withdraw",
//           "required": true
//         },
//         {
//           "name": "amount",
//           "type": "uint256",
//           "description": "Amount of tokens to withdraw",
//           "required": true,
//           "validation": { "min": "0" }
//         }
//       ],
//       "isReadOnly": false,
//       "requiresToken": false,
//       "requiresApproval": false,
//       "estimatedGas": 70000
//     }
//   ],
//   "tags": ["Vault", "ERC-20", "Base Sepolia", "Custom Strategy"]
// },
{
  "id": "simple-usdc-vault-v2",
  "name": "Simple USDC Vault Un2",
  "description": "Basic vault allowing deposits and withdrawals of supported USDC ERC-20 tokens with balance tracking ",
  "protocol": "Custom Vault",
  "chains": [
    {
      "chainId": 84532,
      "chainName": "Base Sepolia",
      "strategyAddress": "0x06eA0a1656A108da2A2c04cCA75064885A98a19e",
      "routerAddress": "0x413C4429C496baF4149b6cB8e770C8455C02d7f5",
      "isActive": true,
       "validTokens": [
         {
          "name": "USDC",
        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "symbol": "USDC",
        "decimals": 6,
        "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      }
      ]
    },
    {
      "chainId": 11155111,
      "chainName": "Etherum Sepolia",
      "strategyAddress": "0xdF4d4E90f1c17dc8D232AE85d713bA0Cab76cbdE",
      "routerAddress": "0xf1D72E025e9013445b4A767bc687f231a0520919",
      "isActive": true,
       "validTokens": [
         {
          "name": "USDC",
        "address": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        "symbol": "USDC",
        "decimals": 6,
        "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      }
      ]
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
},
// 0xF51b69a55A79275D2a0f4e36c8cAf02d6251f9DC
// {
//   "id": "simple-usdc-vault-v2",
//   "name": "Simple USDC Vault Controlled 2.2",
//   "description": "Basic vault allowing deposits and withdrawals of supported USDC ERC-20 tokens with balance tracking ",
//   "protocol": "Custom Vault",
//   "chains": [
//     {
//       "chainId": 84532,
//       "chainName": "Base Sepolia",
//       "strategyAddress": "0x14a44d68794B0E045315d7E1daDbb9d9074de5E7",
//       "routerAddress": "0x899dCC73CB91c204750cEE87cFc593fDf38a7E61",
//       "isActive": true,
//        "validTokens": [
//          {
//           "name": "USDC",
//         "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
//         "symbol": "USDC",
//         "decimals": 6,
//         "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
//       }
//       ]
//     },
//     {
//       "chainId": 11155111,
//       "chainName": "Etherum Sepolia",
//       "strategyAddress": "0x24cfe2f3d6b429841B4182e3a5B4fb4Ed9a1A699", //"0xd23a73375F06038B8EaC7FAbf0A14f6E571bBa2F",
//       "routerAddress": "0xCc19b5D412F4e10b304C898621C9F8949F686C83",
//       "isActive": true,
//        "validTokens": [
//          {
//           "name": "USDC",
//         "address": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
//         "symbol": "USDC",
//         "decimals": 6,
//         "logoUrl": "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
//       }
//       ]
//     }
//   ],
//   "category": "yield",
//   "apy": 0.0,
//   "tvl": 0,
//   "riskLevel": "low",
//   "isActive": true,
//   "logoUrl": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
//   "actions": [
//     {
//       "id": 1,
//       "name": "Deposit",
//       "description": "Deposit ERC-20 tokens into the vault",
//       "type": "deposit",
//       "parameters": [
//         {
//           "name": "token",
//           "type": "address",
//           "description": "Address of the token to deposit",
//           "required": true
//         },
//         {
//           "name": "amount",
//           "type": "uint256",
//           "description": "Amount of tokens to deposit",
//           "required": true,
//           "validation": { "min": "0" }
//         }
//       ],
//       "isReadOnly": false,
//       "requiresToken": true,
//       "requiresApproval": true,
//       "estimatedGas": 70000
//     },
//     {
//       "id": 2,
//       "name": "Withdraw",
//       "description": "Withdraw tokens from the vault",
//       "type": "withdraw",
//       "parameters": [
//         {
//           "name": "token",
//           "type": "address",
//           "description": "Address of the token to withdraw",
//           "required": true
//         },
//         {
//           "name": "amount",
//           "type": "uint256",
//           "description": "Amount of tokens to withdraw",
//           "required": true,
//           "validation": { "min": "0" }
//         }
//       ],
//       "isReadOnly": false,
//       "requiresToken": false,
//       "requiresApproval": false,
//       "estimatedGas": 70000
//     }
//   ],
//   "tags": ["Vault", "ERC-20", "Base Sepolia", "Custom Strategy"]
// }
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