'use client';
import { Logo } from '@/components/Logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="md:hidden">
              <Logo size="text-xl" />
            </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
