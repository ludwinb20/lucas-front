import Link from 'next/link';
import { Bot } from 'lucide-react';

export function Logo({ size = "text-2xl" }: { size?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-headline font-bold text-primary hover:text-primary/90 transition-colors ${size}`}>
      <Bot className="h-7 w-7" />
      LucasMed
    </Link>
  );
}
