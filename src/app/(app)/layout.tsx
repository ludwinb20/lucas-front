'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { BriefcaseMedicalIcon, File, FolderIcon, LayoutDashboardIcon, Loader2, MessageCircle, MessageSquareCode, MessageSquareDashed, MessagesSquare, SettingsIcon } from 'lucide-react';
import { NavItem } from '@/types/nav'; // Tipo para los items de navegación

// Define el tipo para los items del sidebar
interface SidebarItem extends NavItem {
  icon?: React.ReactNode;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Ejemplo de items para el sidebar (personaliza según tu necesidad)
  const sidebarItems: SidebarItem[] = [
    { title: 'Chat', href: '/chat', icon: <MessagesSquare size={24} /> },
    { title: 'Generación de reportes', href: '/projects', icon: <File size={24} /> },
    { title: 'Diagnostico', href: '/settings', icon: <BriefcaseMedicalIcon size={24} /> },
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <div className="flex h-full flex-col gap-2 p-4">
            <div className="flex h-14 items-center border-b px-4">
              <h2 className="text-lg font-semibold">Herramientas</h2>
            </div>
            
            <nav className="flex-1 space-y-1">
              {sidebarItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                >
                  {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                  {item.title}
                </a>
              ))}
            </nav>
            
            <div className="mt-auto p-4">
              {/* Aquí puedes añadir un footer para el sidebar */}
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}