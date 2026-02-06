import Image from 'next/image';
import Link from 'next/link';
import { ThemeHoverCard } from '@/components/ThemeHoverCard';

const links = [
  { name: 'Docs', href: 'https://docs.pnth.io' },
  { name: 'Support', href: 'https://t.me/pantheon_io' },
  { name: 'Twitter', href: 'https://x.com/pikitrader' },
];

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
        <ThemeHoverCard />
      </div>
      <div className="flex space-x-6 text-xs font-normal text-textSecondary">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-success transition-colors pnth-text-glow"
          >
            {link.name}
          </Link>
        ))}
      </div>
    </footer>
  );
}
