'use client';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Loader2, MessageCircle, Stethoscope, FileText, LayoutDashboard, Users, Building } from 'lucide-react';
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
  const { userProfile, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`%cLAYOUT: Auth guard check. isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`, 'color: blue; font-weight: bold;');
    if (!isLoading && !isAuthenticated) {
      console.log('LAYOUT: Not loading and not authenticated. Redirecting to /login...');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const menuItems = useMemo(() => {
    const baseItems = [
      { href: '/chat', label: 'Chat', icon: MessageCircle, roles: ['doctor', 'admin', 'superadmin'] },
      { href: '/diagnosis', label: 'Diagnóstico', icon: Stethoscope, roles: ['doctor', 'admin', 'superadmin'] },
      { href: '/exams', label: 'Exámenes', icon: FileText, roles: ['doctor', 'admin', 'superadmin'] },
    ];

    const adminItems = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin'] },
      { href: '/users', label: 'Usuarios', icon: Users, roles: ['admin', 'superadmin'] },
    ];

    const superAdminItems = [
      { href: '/companies', label: 'Empresas', icon: Building, roles: ['superadmin'] },
    ];
    
    const allItems = [...baseItems, ...adminItems, ...superAdminItems];

    if (!userProfile?.role) return [];
    
    return allItems.filter(item => item.roles.includes(userProfile.role));

  }, [userProfile?.role]);

  if (isLoading || !userProfile) {
    console.log('LAYOUT: isLoading or no user profile, showing loader...');
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
  
  console.log('LAYOUT: Authenticated and not loading. Rendering app layout for role:', userProfile.role);

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
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={{children: item.label, side: 'right'}}>
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
