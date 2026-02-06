'use client';
import { useState } from 'react';
import clsx from 'clsx';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { PaintbrushVertical } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

const themes = [
  { name: 'Pantheon', color: '#61CA87' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Mint', color: '#34d399' },
];

export function ThemeHoverCard() {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded hover:bg-success/10 transition group"
        >
          <PaintbrushVertical size={14} className="text-textSecondary group-hover:text-success transition-colors" />
        </button>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        className="w-[150px] h-[140px] p-0 border-borderDefault bg-bgBase/95 backdrop-blur-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-borderDefault">
          <h3 className="text-textPrimary text-xs font-medium">Theme</h3>
        </div>

        {/* Theme Options */}
        <div className="space-y-1">
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setTheme(t.name as any);
                setOpen(false);
              }}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold',
                'hover:bg-success/10 text-textSecondary hover:text-success transition border',
                theme === t.name ? 'border-success/40 bg-success/5' : 'border-transparent'
              )}
            >
              <span>{t.name}</span>
              <div
                className={clsx(
                  'w-2 h-2 rounded-sm transition-all',
                  theme === t.name ? 'opacity-100 shadow-[0_0_6px_rgba(97,202,135,0.5)]' : 'opacity-40'
                )}
                style={{ backgroundColor: t.color }}
              />
            </button>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
