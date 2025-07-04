"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { 
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Chip
} from '@heroui/react';
import { 
  BarChart3, 
  Layers, 
  Activity, 
  User,
  RefreshCw,
  TrendingUp,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectWalletButton } from './connect-wallet-button';
import { ThemeToggle } from './theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Strategies', href: '/strategies', icon: Layers },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Profile', href: '/profile', icon: User },
];

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mock admin check - in real app, this would check against admin addresses
  const isAdmin = address === '0xa7793C5c4582C72B3aa5e78859d8Bd66998D43ce'; // Allow all for demo

  const visibleNavigation = isConnected ? navigation : [];
  const allNavigation = isAdmin && address ? [...visibleNavigation, ...adminNavigation] : visibleNavigation;

  return (
    <HeroNavbar 
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="ondo-nav"
      maxWidth="full"
      height="120px"
      
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-white dark:text-white light:text-black"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 group-hover:scale-110 transition-transform"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <RefreshCw className="w-4 h-4 text-blue-400 sync-pulse" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white dark:text-white light:text-black">
                YieldSync
              </span>
              <span className="text-xs text-gray-500 -mt-1">Synchronizing Yields</span>
            </div>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {allNavigation.length > 0 && (
        <NavbarContent className="hidden sm:flex gap-8" justify="center">
          {allNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAdminRoute = item.href === '/admin';
            
            return (
              <NavbarItem key={item.name} isActive={isActive}>
                <Link
                  href={item.href}
                  className={cn(
                    "ondo-nav-item flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                    isActive && "active bg-blue-500/10 border border-blue-500/20",
                    isAdminRoute && "border border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {isAdminRoute && !isAdmin && (
                    <span className="ondo-chip-danger text-xs ml-1">Admin</span>
                  )}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>
      )}

      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <div className="ondo-chip ondo-chip-success flex items-center">
            <RefreshCw className="w-3 h-3 mr-1 sync-pulse" />
            <span>Syncing +12.5% APY</span>
          </div>
        </NavbarItem>
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>
        <NavbarItem>
          <ConnectWalletButton />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className="bg-black/95 dark:bg-black/95 light:bg-white/95 backdrop-blur-xl">
        {allNavigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isAdminRoute = item.href === '/admin';
          
          return (
            <NavbarMenuItem key={`${item.name}-${index}`}>
              <Link
                className={cn(
                  "ondo-nav-item flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm transition-all duration-200",
                  isActive && "active bg-blue-500/10 border border-blue-500/20",
                  isAdminRoute && "border border-red-500/20 bg-red-500/5"
                )}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {isAdminRoute && (
                  <span className="ondo-chip-danger text-xs ml-auto">Admin</span>
                )}
              </Link>
            </NavbarMenuItem>
          );
        })}
      </NavbarMenu>
    </HeroNavbar>
  );
}