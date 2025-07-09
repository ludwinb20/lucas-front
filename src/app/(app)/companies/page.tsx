'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateCompanyDialog } from '@/components/company/CreateCompanyDialog';


interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    createdAt: Timestamp | Date; // Firestore returns Timestamp
}

export default function CompaniesPage() {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && userProfile && userProfile.role !== 'superadmin') {
      router.replace('/chat');
    }
  }, [userProfile, isAuthLoading, router]);

  const fetchCompanies = useCallback(async () => {
    if (!userProfile || userProfile.role !== 'superadmin') return;
    setIsDataLoading(true);

    try {
        const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
        const companiesSnapshot = await getDocs(q);
        const companiesList = companiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Company));
        setCompanies(companiesList);
    } catch (error) {
        console.error("Error fetching companies:", error);
    } finally {
        setIsDataLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
        fetchCompanies();
    }
  }, [userProfile, fetchCompanies]);

  if (isAuthLoading || !userProfile || userProfile.role !== 'superadmin') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestión de Empresas</CardTitle>
              <CardDescription>Crear y administrar empresas en el sistema.</CardDescription>
            </div>
            <Button onClick={()=> setIsCreateOpen(true)}>Crear Nueva Empresa</Button>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          {isDataLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Logo</TableHead>
                        <TableHead>Nombre de Empresa</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map(company => (
                        <TableRow key={company.id}>
                            <TableCell>
                                <Avatar>
                                    <AvatarImage src={company.logoUrl} alt={company.name} />
                                    <AvatarFallback><Building /></AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>
                                {company.createdAt instanceof Timestamp 
                                    ? format(company.createdAt.toDate(), 'yyyy-MM-dd') 
                                    : 'N/A'
                                }
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <CreateCompanyDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchCompanies} />
    </div>
  );
}
