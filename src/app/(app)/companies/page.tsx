'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface Company {
    id: string;
    name: string;
    createdAt: Timestamp | Date; // Firestore returns Timestamp
}

export default function CompaniesPage() {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && userProfile && userProfile.role !== 'superadmin') {
      router.replace('/chat');
    }
  }, [userProfile, isAuthLoading, router]);

  useEffect(() => {
    const fetchCompanies = async () => {
        if (!userProfile || userProfile.role !== 'superadmin') return;
        setIsDataLoading(true);

        try {
            const companiesSnapshot = await getDocs(collection(db, 'companies'));
            const companiesList = companiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Company));
            setCompanies(companiesList);
        } catch (error) {
            console.error("Error fetching companies:", error);
            // Optionally show an error message to the user
        } finally {
            setIsDataLoading(false);
        }
    };

    if (userProfile) {
        fetchCompanies();
    }
  }, [userProfile]);

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
            <Button>Crear Nueva Empresa</Button>
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
                        <TableHead>Nombre de Empresa</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map(company => (
                        <TableRow key={company.id}>
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
    </div>
  );
}
