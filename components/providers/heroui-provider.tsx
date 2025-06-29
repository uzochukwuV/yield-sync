"use client";

import { HeroUIProvider as NextUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function HeroUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        themes={['light', 'dark']}
      >
        {children}
      </NextThemesProvider>
    </NextUIProvider>
  );
}