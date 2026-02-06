'use client';

import { MenuIcon } from '@/assets/icons/MenuIcon';
import DisplayModal from './DisplayModal';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function PulseHeader() {
  const [isDisplayOpen, setDisplayOpen] = useState(false);

  return (
    <>
      {/* Desktop Header - Display controls only (title is now in tabs) */}
      <div className="hidden text-textPrimary md:flex items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
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
        </div>
      </div>
    </>
  );
}