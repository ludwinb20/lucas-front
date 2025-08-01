'use client';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { SidebarMenu } from '@/components/SidebarMenu';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Loader2, MessageCircle, Stethoscope, FileText, LayoutDashboard, Users, Building, User } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
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
    const adminItems = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin'] },
      { href: '/users', label: 'Usuarios', icon: Users, roles: ['admin', 'superadmin'] },
    ];

    const superAdminItems = [
      { href: '/companies', label: 'Empresas', icon: Building, roles: ['superadmin'] },
    ];

    const doctorItems = [
      { href: '/dashboard', label: 'Estadísticas', icon: LayoutDashboard, roles: ['doctor'] },
    ];

    const baseItems = [
      { href: '/chat', label: 'Chat', icon: MessageCircle, roles: ['doctor', 'admin', 'superadmin'] },
      { href: '/diagnosis', label: 'Diagnóstico', icon: Stethoscope, roles: ['doctor', 'admin', 'superadmin'] },
      { href: '/exams', label: 'Exámenes', icon: FileText, roles: ['doctor', 'admin', 'superadmin'] },
      { href: '/profile', label: 'Mi Perfil', icon: User, roles: ['doctor', 'admin', 'superadmin'] },
    ];

    
    const allItems = [...adminItems, ...superAdminItems, ...doctorItems, ...baseItems];

    if (!userProfile?.role) return [];
    
    return allItems.filter(item => item.roles.includes(userProfile.role));

  }, [userProfile?.role]);

  if (isLoading || !isAuthenticated) {
    console.log('LAYOUT: isLoading or not authenticated, showing loader...');
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  console.log('LAYOUT: Authenticated and not loading. Rendering app layout for role:', userProfile?.role);

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border/10 px-4 py-6">
              <div className="flex items-center justify-center">
                <Logo size="text-xl" />
              </div>
          </SidebarHeader>
          <SidebarContent className="flex-1 px-3 py-4">
              <SidebarMenu items={menuItems} userRole={userProfile?.role} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <div className="flex-1 container mx-auto p-4 md:p-6 flex flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
