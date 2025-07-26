'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { MessageCircle, Users, Stethoscope, FileText, ActivitySquare, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Cargar empresas solo si es superadmin
  useEffect(() => {
    if (userProfile?.role === 'superadmin') {
      (async () => {
        const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCompanies(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      })();
    }
  }, [userProfile]);

  // Redirección si no tiene acceso
  useEffect(() => {
    if (!isLoading && userProfile && !['admin', 'superadmin', 'doctor'].includes(userProfile.role)) {
      router.replace('/chat');
    }
  }, [userProfile, isLoading, router]);

  // Determinar filtros para estadísticas
  let statsProps: any = {};
  if (userProfile?.role === 'superadmin') {
    // Para superadmin, si no hay empresa seleccionada, no filtra (muestra global)
    if (selectedCompany) {
      statsProps.companyId = selectedCompany;
      console.log('DASHBOARD: Superadmin - filtrando por empresa:', selectedCompany);
    } else {
      console.log('DASHBOARD: Superadmin - mostrando estadísticas globales');
    }
  } else if (userProfile?.role === 'admin' && userProfile.companyId) {
    statsProps.companyId = userProfile.companyId;
    console.log('DASHBOARD: Admin - filtrando por empresa:', userProfile.companyId);
  } else if (userProfile?.role === 'doctor' && userProfile.id) {
    statsProps.userId = userProfile.id;
    console.log('DASHBOARD: Doctor - filtrando por usuario:', userProfile.id);
  } else {
    console.log('DASHBOARD: No se encontraron filtros válidos para el rol:', userProfile?.role);
  }
  
  console.log('DASHBOARD: statsProps final:', statsProps);
  const { stats, loading } = useDashboardStats(statsProps);

  if (isLoading || !userProfile || !['admin', 'superadmin', 'doctor'].includes(userProfile.role)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">Dashboard</CardTitle>
            <CardDescription className="text-lg">
              {userProfile.role === 'superadmin'
                ? 'Estadísticas globales o por empresa.'
                : userProfile.role === 'admin'
                ? 'Estadísticas de su empresa.'
                : 'Estadísticas personales.'}
            </CardDescription>
          </div>
          {userProfile.role === 'superadmin' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Empresa:</span>
              <select
                className="border rounded px-2 py-1 bg-background text-foreground"
                value={selectedCompany || ''}
                onChange={e => setSelectedCompany(e.target.value || null)}
              >
                <option value="">Global</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>
      </Card>
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="bg-gradient-to-br from-blue-100 to-blue-300 shadow-lg hover:scale-[1.03] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <MessageCircle className="h-10 w-10 text-blue-700 drop-shadow" />
            <CardTitle className="text-lg">Mensajes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold text-blue-900 animate-fade-in">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.totalMessages ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-100 to-green-300 shadow-lg hover:scale-[1.03] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <Users className="h-10 w-10 text-green-700 drop-shadow" />
            <CardTitle className="text-lg">Mensajes Promedio por Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold text-green-900 animate-fade-in">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.avgMessagesPerUser?.toFixed(2) ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-100 to-purple-300 shadow-lg hover:scale-[1.03] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <Stethoscope className="h-10 w-10 text-purple-700 drop-shadow" />
            <CardTitle className="text-lg">Diagnósticos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold text-purple-900 animate-fade-in">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.totalDiagnoses ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-lg hover:scale-[1.03] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <FileText className="h-10 w-10 text-yellow-700 drop-shadow" />
            <CardTitle className="text-lg">Exámenes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold text-yellow-900 animate-fade-in">{loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats?.totalExams ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-100 to-pink-300 shadow-lg hover:scale-[1.03] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <ActivitySquare className="h-10 w-10 text-pink-700 drop-shadow" />
            <CardTitle className="text-lg">Síntomas Más Comunes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : stats?.commonSymptoms?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.commonSymptoms.map(s => (
                  <span key={s.name} className="inline-flex items-center rounded-full bg-pink-200 px-3 py-1 text-sm font-semibold text-pink-800 shadow animate-fade-in">
                    {s.name}
                    <span className="ml-2 bg-pink-400 text-white rounded-full px-2 py-0.5 text-xs font-bold">{s.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span>-</span>
            )}
          </CardContent>
        </Card>
        {/* Espacio para futuras métricas */}
        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-dashed border-2 border-muted-foreground shadow-inner flex flex-col justify-center items-center hover:scale-[1.01] transition-transform">
          <CardHeader className="flex flex-row items-center gap-4">
            <Sparkles className="h-10 w-10 text-gray-400" />
            <CardTitle className="text-lg">Próximamente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-16 flex items-center justify-center text-muted-foreground text-center">Espacio reservado para futuras métricas</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
