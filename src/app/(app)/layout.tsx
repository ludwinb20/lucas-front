'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Loader2, MessageCircle, Stethoscope, FileText } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`%cLAYOUT: Auth guard check. isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`, 'color: blue; font-weight: bold;');
    if (!isLoading && !isAuthenticated) {
      console.log('LAYOUT: Not loading and not authenticated. Redirecting to /login...');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    console.log('LAYOUT: isLoading is true, showing loader...');
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('LAYOUT: Not authenticated and not loading, returning null (should be redirected).');
    return null;
  }
  
  console.log('LAYOUT: Authenticated and not loading. Rendering app layout.');

  const menuItems = [
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/diagnosis', label: 'Diagnóstico', icon: Stethoscope },
    { href: '/exams', label: 'Exámenes', icon: FileText },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <Logo />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={{children: item.label, side: 'right'}}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 container mx-auto p-4 md:p-6 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
