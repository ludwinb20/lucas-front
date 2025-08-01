'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { LogOut, User, Settings, Shield, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export function ProfileDropdown() {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();

  if (!userProfile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrador';
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Doctor';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="h-4 w-4 text-destructive" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'doctor':
        return <User className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={userProfile.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <p className="text-sm font-medium leading-none">{userProfile.name}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getRoleIcon(userProfile.role)}
              <span className="text-xs text-muted-foreground">{getRoleLabel(userProfile.role)}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="flex items-center gap-2">
          <Link href="/profile">
            <Settings className="h-4 w-4" />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={toggleTheme}
          disabled={!mounted}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Modo Oscuro</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 