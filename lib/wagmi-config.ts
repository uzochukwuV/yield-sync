import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, sepolia, baseSepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});


export const chainUID = {
  [sepolia.id]: "16015286601757825753",
  [baseSepolia.id]: "10344971235874465080",
  [optimism.id]: "800",
  [arbitrum.id]: "900",
}

export function getChainUID(chainId: number): string {
 if(chainId == sepolia.id) return chainUID[sepolia.id];
  if(chainId == baseSepolia.id) return chainUID[baseSepolia.id];
  if(chainId == optimism.id) return chainUID[optimism.id];
  if(chainId == arbitrum.id) return chainUID[arbitrum.id];
  return "000000"; // Default case if chainId doesn't match
}