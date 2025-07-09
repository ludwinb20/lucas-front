'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function CompaniesPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userProfile && userProfile.role !== 'superadmin') {
      router.replace('/chat');
    }
  }, [userProfile, isLoading, router]);

  if (isLoading || !userProfile || userProfile.role !== 'superadmin') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Placeholder data
  const companies = [
    { id: '1', name: 'Clínica Central', users: 25, createdAt: '2023-01-15' },
    { id: '2', name: 'Hospital del Sur', users: 58, createdAt: '2023-03-22' },
    { id: '3', name: 'Consultorios Norte', users: 12, createdAt: '2023-05-10' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestión de Empresas</CardTitle>
              <CardDescription>Crear y administrar empresas en el sistema.</CardDescription>
            </div>
            <Button>Crear Nueva Empresa</Button>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre de Empresa</TableHead>
                        <TableHead>Nro. Usuarios</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map(company => (
                        <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.users}</TableCell>
                            <TableCell>{company.createdAt}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
