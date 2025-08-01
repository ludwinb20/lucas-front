'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu as BaseSidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface SidebarMenuProps {
  items: MenuItem[];
  userRole?: string;
}

export function SidebarMenu({ items, userRole }: SidebarMenuProps) {
  const pathname = usePathname();

  const filteredItems = items.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <BaseSidebarMenu className="space-y-1">
      {filteredItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton 
            asChild 
            isActive={pathname.startsWith(item.href)} 
            tooltip={{children: item.label, side: 'right'}}
            className={cn(
              "w-full justify-start transition-all duration-200",
              "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
              "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium",
              "text-sidebar-foreground"
            )}
          >
            <Link href={item.href} className="flex items-center w-full">
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </BaseSidebarMenu>
  );
} 