'use client';

import { useAuth, type UserProfile } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { InviteUserDialog } from '@/components/user/InviteUserDialog';
import { ChangePasswordDialog } from '@/components/user/ChangePasswordDialog';

interface DisplayUser extends UserProfile {
  id: string;
  companyName?: string;
}

interface Company {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);

  useEffect(() => {
    if (!isAuthLoading && userProfile && !['admin', 'superadmin'].includes(userProfile.role)) {
      router.replace('/chat');
    }
  }, [userProfile, isAuthLoading, router]);

  const fetchUsersAndCompanies = useCallback(async () => {
    if (!userProfile) return;
    setIsDataLoading(true);

    try {
      let usersQuery;
      const usersCollection = collection(db, 'users');
      
      const companyMap = new Map<string, string>();

      // Superadmin fetches all companies to pass to the invite dialog
      if (userProfile.role === 'superadmin') {
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesList: Company[] = [];
        companiesSnapshot.forEach(doc => {
          const companyData = { id: doc.id, name: doc.data().name as string };
          companyMap.set(doc.id, doc.data().name as string);
          companiesList.push(companyData);
        });
        setCompanies(companiesList);
      }

      if (userProfile.role === 'superadmin') {
        usersQuery = query(usersCollection);
      } else if (userProfile.role === 'admin' && userProfile.companyId) {
        usersQuery = query(usersCollection, where('companyId', '==', userProfile.companyId));
      } else {
          setUsers([]);
          setIsDataLoading(false);
          return;
      }

      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data() as UserProfile;
        const displayUser: DisplayUser = {
          ...data,
          id: doc.id,
        };
        if (data.companyId) {
          // Admin can't see company name, so we only need map for superadmin
          if (userProfile.role === 'superadmin') {
              displayUser.companyName = companyMap.get(data.companyId) || 'Sin Asignar';
          }
        }
        return displayUser;
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      fetchUsersAndCompanies();
    }
  }, [userProfile, fetchUsersAndCompanies]);

  if (isAuthLoading || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
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
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                    {userProfile.role === 'admin'
                    ? `Usuarios de su empresa.`
                    : `Todos los usuarios del sistema.`}
                </CardDescription>
            </div>
            <Button onClick={() => setIsInviteOpen(true)}>Invitar Usuario</Button>
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
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            {userProfile.role === 'superadmin' && <TableHead>Empresa</TableHead>}
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        user.role === 'superadmin' ? 'default' :
                                        user.role === 'admin' ? 'secondary' :
                                        'outline'
                                    }>{user.role}</Badge>
                                </TableCell>
                                {userProfile.role === 'superadmin' && <TableCell>{user.companyName || 'N/A'}</TableCell>}
                                <TableCell>
                                    {userProfile.role === 'superadmin' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsChangePasswordOpen(true);
                                            }}
                                        >
                                            Cambiar Contraseña
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
      <InviteUserDialog isOpen={isInviteOpen} onOpenChange={setIsInviteOpen} onSuccess={fetchUsersAndCompanies} companies={companies} />
      {selectedUser && (
        <ChangePasswordDialog
          isOpen={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
          user={selectedUser}
        />
      )}
    </div>
  );
}
