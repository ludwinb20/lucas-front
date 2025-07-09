import Link from 'next/link';

const CustomLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 15.5H15.5V17H8.5V15.5H7V8.5H8.5V7H15.5V8.5H17V15.5ZM10 10H14V14H10V10Z" />
  </svg>
);


export function Logo({ size = "text-2xl" }: { size?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-headline font-bold text-primary hover:text-primary/90 transition-colors ${size}`}>
      <CustomLogo className="h-7 w-7" />
      LucasMed
    </Link>
  );
}
