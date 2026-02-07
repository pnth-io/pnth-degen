import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-borderDefault bg-bgBase/90 py-[6px] px-4 flex items-center justify-center mt-auto">
      <Link 
        href="https://twitter.com/pnth_io" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-textSecondary hover:text-pnthGreen text-xs transition-colors"
      >
        @pnth_io
      </Link>
    </footer>
  );
}
