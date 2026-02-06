import Image from 'next/image';
import Link from 'next/link';
import { ThemeHoverCard } from '@/components/ThemeHoverCard';

export function Footer() {
  return (
    <footer className="w-full border-t border-borderDefault bg-bgBase/90 backdrop-blur-md py-[6px] px-4 flex items-center justify-between mt-auto">
      <div className="flex items-center space-x-3">
        <Link href="https://pnth.io/" target="_blank" rel="noopener noreferrer" className="group">
          <Image 
            src="/pantheon-logo.svg" 
            alt="Pantheon Logo" 
            width={18} 
            height={18} 
            priority 
            className="transition-all group-hover:drop-shadow-[0_0_6px_rgba(97,202,135,0.5)]"
          />
        </Link>
        <Link 
          href="https://twitter.com/pnth_io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-textSecondary hover:text-pnthGreen text-xs transition-colors"
        >
          @pnth_io
        </Link>
        <ThemeHoverCard />
      </div>
    </footer>
  );
}
