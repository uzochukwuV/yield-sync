import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { HeroUIProvider } from '@/components/providers/heroui-provider';
import { Web3Provider } from '@/components/providers/web3-provider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'YieldSync - Your Cross-Chain Yield Strategies',
  description: 'Synced, Tracked & Amplified - The ultimate DeFi yield management platform',
  keywords: 'DeFi, yield farming, strategies, cross-chain, crypto',
  authors: [{ name: 'YieldSync Team' }],
  openGraph: {
    title: 'YieldSync - Your Cross-Chain Yield Strategies',
    description: 'Synced, Tracked & Amplified - The ultimate DeFi yield management platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-inter`}>
        <Web3Provider>
          <HeroUIProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster position="top-right" />
          </HeroUIProvider>
        </Web3Provider>
      </body>
    </html>
  );
}