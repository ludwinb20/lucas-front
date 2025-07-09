'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userProfile && !['admin', 'superadmin'].includes(userProfile.role)) {
      router.replace('/chat');
    }
  }, [userProfile, isLoading, router]);

  if (isLoading || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Placeholder data
  const users = [
    { id: '1', name: 'Dr. Juan Pérez', email: 'juan.perez@example.com', role: 'doctor', company: 'Clínica Central' },
    { id: '2', name: 'Dra. Ana Gómez', email: 'ana.gomez@example.com', role: 'doctor', company: 'Clínica Central' },
    { id: '3', name: 'Admin Gral.', email: 'admin@example.com', role: 'admin', company: 'Clínica Central' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                    {userProfile.role === 'admin'
                    ? `Usuarios de su empresa.`
                    : `Todos los usuarios del sistema.`}
                </CardDescription>
            </div>
            <Button>Invitar Usuario</Button>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        {userProfile.role === 'superadmin' && <TableHead>Empresa</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                            {userProfile.role === 'superadmin' && <TableCell>{user.company}</TableCell>}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
