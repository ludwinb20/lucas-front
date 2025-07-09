'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userProfile && !['admin', 'superadmin'].includes(userProfile.role)) {
      router.replace('/chat'); // or a dedicated unauthorized page
    }
  }, [userProfile, isLoading, router]);

  if (isLoading || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            {userProfile.role === 'admin' 
              ? `Estadísticas para su empresa.`
              : `Estadísticas globales del sistema.`}
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Placeholder for stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Usuarios Activos</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">123</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Diagnósticos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">45</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Exámenes Analizados</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">67</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
