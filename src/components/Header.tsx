'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApiSelectorDropdown } from './header/ApiSelectorDropdown';

const SearchModal = dynamic(() => import('./SearchModal').then(mod => ({ default: mod.SearchModal })), { ssr: false });

import { FiSearch } from 'react-icons/fi';
import { MenuIcon } from '@/assets/icons/MenuIcon';
import { ChevronDown } from 'lucide-react';
import { useApiStore } from '@/store/apiStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { initMobulaClient } from '@/lib/mobulaClient';
import { LatencyIndicator } from './header/LatencyIndicator';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileWarningBanner } from '@/components/MobileWarningBanner';
import DisplayModal from '@/features/pulse/components/DisplayModal';

const Header = () => {
  const apiButtonRef = useRef<HTMLButtonElement>(null);
  const latencyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const [isDisplayOpen, setDisplayOpen] = useState(false);

  const { currentUrl, getLabelForUrl } = useApiStore();

  const {
    isSearchOpen,
    isApiSelectorOpen,
    latency,
    openSearch,
    closeSearch,
    toggleApiSelector,
    closeApiSelector,
    setLatency,
  } = useHeaderStore();

  useEffect(() => {
    initMobulaClient(currentUrl);
  }, [currentUrl]);

  const checkLatency = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch(currentUrl, { method: 'GET', cache: 'no-cache' });
      const end = performance.now();

      const latencyMs = Math.round(end - start);
      const newLatency = `${latencyMs}ms`;
      
      const currentLatency = useHeaderStore.getState().latency;
      
      if (currentLatency !== newLatency) {
        setLatency(newLatency);
      }
    } catch {
      setLatency('offline');
    }
  }, [currentUrl, setLatency]);

  useEffect(() => {
    checkLatency();
    latencyIntervalRef.current = setInterval(checkLatency, 10000);

    return () => {
      if (latencyIntervalRef.current) clearInterval(latencyIntervalRef.current);
    };
  }, [checkLatency]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const handleSlashShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (isEditable) return;

      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        openSearch();
      }
    };

    window.addEventListener('keydown', handleSlashShortcut, { signal });
    return () => controller.abort();
  }, []);

  return (
    <>
      <header className="w-full bg-bgBase/90 text-white border-b border-borderDefault">
        <div className="flex items-center h-14 sm:h-16 justify-between px-3 sm:px-4">
          {/* Left side: Logo, Search, Nav */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1 min-w-0">
            {/* Logo - Pantheon */}
            <Link href="/" className="flex items-center flex-shrink-0 group">
              <SafeImage
                src="/pantheon-logo.svg"
                alt="Pantheon Logo"
                width={120}
                height={36}
                className="h-7 sm:h-8 w-auto transition-all group-hover:drop-shadow-[0_0_12px_rgba(97,202,135,0.6)]"
                priority
              />
            </Link>

            {/* Search - Hidden on small mobile, visible from sm */}
            <div
              onClick={openSearch}
              className="hidden sm:flex flex-1 max-w-xs md:max-w-md h-9 relative cursor-pointer pnth-brackets"
            >
              <input
                type="text"
                placeholder="Search tokens..."
                className="pnth-input w-full text-sm pl-10 pr-4 py-[6px] cursor-pointer"
                readOnly
              />
              <FiSearch className="absolute left-4 top-[10px] text-success/60" size={16} />
              <span className="absolute right-3 top-2.5 border border-success/30 text-[10px] font-semibold text-success/60 px-1.5 flex justify-center items-center">
                <span className="animate-spinSlow inline-block">/</span>
              </span>
            </div>

            {/* Search Icon for Mobile */}
            <button
              onClick={openSearch}
              className="sm:hidden p-1.5 text-textTertiary hover:text-success hover:bg-success/10 rounded-md transition"
              aria-label="Search"
            >
              <FiSearch size={18} />
            </button>

            {/* Nav - Hidden on mobile/tablet, visible from lg */}
            <nav className="hidden lg:flex gap-3 xl:gap-4">
              <Link 
                href="/" 
                className={`text-sm transition-all whitespace-nowrap ${
                  pathname === '/' 
                    ? 'text-success font-semibold pnth-text-glow' 
                    : 'text-textSecondary hover:text-success'
                }`}
              >
                Garden
              </Link>
              <Link 
                href="/pulse" 
                className={`text-sm transition-all whitespace-nowrap ${
                  pathname === '/pulse' 
                    ? 'text-success font-semibold pnth-text-glow' 
                    : 'text-textSecondary hover:text-success'
                }`}
              >
                Pulse
              </Link>
              <Link 
                href="/screener" 
                className={`text-sm transition-all whitespace-nowrap ${
                  pathname === '/screener' 
                    ? 'text-success font-semibold pnth-text-glow' 
                    : 'text-textSecondary hover:text-success'
                }`}
              >
                Screener
              </Link>
              <Link 
                href="/embed" 
                className={`text-sm transition-all whitespace-nowrap ${
                  pathname?.startsWith('/embed') 
                    ? 'text-success font-semibold pnth-text-glow' 
                    : 'text-textSecondary hover:text-success'
                }`}
              >
                Widgets
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 text-sm flex-shrink-0">
            {/* Display Dropdown */}
            <div className="relative hidden md:block">
              <button
                type="button"
                className="pnth-button-outline flex items-center px-4 space-x-2 h-8 py-1.5 cursor-pointer"
                onClick={() => setDisplayOpen((open) => !open)}
              >
                <MenuIcon />
                <span className="mr-2 text-sm text-textPrimary font-bold">Display</span>
                <ChevronDown className="h-4 w-4 text-textPrimary" />
              </button>
              <DisplayModal isOpen={isDisplayOpen} onClose={() => setDisplayOpen(false)} />
            </div>

            <div className="flex-shrink-0">
              <LatencyIndicator
                currentUrl={currentUrl}
                latency={latency}
                isApiSelectorOpen={isApiSelectorOpen}
                toggleSelector={toggleApiSelector}
                buttonRef={apiButtonRef}
                getLabelForUrl={getLabelForUrl}
              />
            </div>
          </div>
        </div>
        <MobileWarningBanner />
      </header>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <ApiSelectorDropdown
        isOpen={isApiSelectorOpen}
        onClose={closeApiSelector}
        buttonRef={apiButtonRef}
      />
    </>
  );
};

export default Header;
