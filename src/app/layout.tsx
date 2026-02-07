// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/sonner"
import { EIP6963Initializer } from '@/components/wallet/EIP6963Initializer';
import { WalletPortfolioModalWrapper } from '@/components/shared/WalletPortfolioModalWrapper';

export const metadata = {
  title: 'Pantheon Degen Terminal',
  description: 'Advanced trading terminal powered by Pantheon - Real-time data, charts, and trading tools for DeFi',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme-storage');
                  if (stored) {
                    const { state } = JSON.parse(stored);
                    if (state?.colors) {
                      const c = state.colors;
                      const root = document.documentElement.style;
                      root.setProperty('--pnth-bg-primary', c.bgPrimary || '#0a0a0f');
                      root.setProperty('--pnth-green', c.success || '#61CA87');
                      root.setProperty('--pnth-bg-secondary', c.bgOverlay || '#0f1116');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-geist w-full bg-bgBase text-textSecondary" suppressHydrationWarning>
        {/* Pantheon Grid Background */}
        <div className="pnth-grid-background" />
        
        <EIP6963Initializer />
        <Toaster />
          <div className="flex flex-col min-h-screen relative z-10">
            <header className="sticky top-0 z-50">
              <Header />
            </header>
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
            <Footer />
          </div>
          <WalletPortfolioModalWrapper />
      </body>
    </html>
  );
}
