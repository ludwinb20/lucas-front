'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, X } from 'lucide-react';
import { MessageCircle, Users, Stethoscope, FileText, ActivitySquare, Sparkles } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Establecer período por defecto (último mes)
  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      setStartDate(formatDate(monthAgo));
      setEndDate(formatDate(today));
    }
  }, []);

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

  // Convertir fechas string a Date objects
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

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

  // Agregar filtros de fecha si están configurados
  if (startDateObj) statsProps.startDate = startDateObj;
  if (endDateObj) statsProps.endDate = endDateObj;
  
  console.log('DASHBOARD: statsProps final:', statsProps);
  const { stats, loading } = useDashboardStats(statsProps);

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Todos los datos';
    if (startDate && endDate) return `${startDate} - ${endDate}`;
    if (startDate) return `Desde ${startDate}`;
    if (endDate) return `Hasta ${endDate}`;
    return 'Todos los datos';
  };

  const setDatePreset = (preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(formatDate(weekAgo));
        setEndDate(formatDate(today));
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(formatDate(monthAgo));
        setEndDate(formatDate(today));
        break;
      case 'quarter':
        const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        setStartDate(formatDate(quarterAgo));
        setEndDate(formatDate(today));
        break;
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        setStartDate(formatDate(yearAgo));
        setEndDate(formatDate(today));
        break;
    }
  };

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
        <CardHeader className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          </div>

          {/* Filtros de fecha compactos */}
          <div className="border-t pt-4">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              {/* Presets de fechas */}
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2 block">Período:</Label>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePreset('today')}
                    className="text-xs h-7 px-2"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePreset('week')}
                    className="text-xs h-7 px-2"
                  >
                    Semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePreset('month')}
                    className="text-xs h-7 px-2"
                  >
                    Mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePreset('quarter')}
                    className="text-xs h-7 px-2"
                  >
                    Trimestre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePreset('year')}
                    className="text-xs h-7 px-2"
                  >
                    Año
                  </Button>
                </div>
              </div>
              
              {/* Selectores de fecha personalizados */}
              <div className="flex gap-2 items-end">
                <div>
                  <Label htmlFor="startDate" className="text-xs">Desde</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs">Hasta</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilters}
                  className="h-8 w-8 p-0"
                  title="Limpiar filtros"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de líneas - Actividad general */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-blue-600" />
              Evolución de Actividad
            </CardTitle>
            <CardDescription>
              Tendencias de mensajes, diagnósticos y exámenes a lo largo del tiempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : stats?.activityByDay?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.activityByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value, name) => [value, name === 'messages' ? 'Mensajes' : name === 'diagnoses' ? 'Diagnósticos' : 'Exámenes']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="messages" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="diagnoses" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="exams" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - Mensajes por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Mensajes por Día
            </CardTitle>
            <CardDescription>
              Cantidad de mensajes generados diariamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.messagesByDay?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.messagesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value) => [value, 'Mensajes']}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay mensajes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de líneas - Diagnósticos por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              Diagnósticos por Día
            </CardTitle>
            <CardDescription>
              Evolución de diagnósticos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.diagnosesByDay?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.diagnosesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value) => [value, 'Diagnósticos']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay diagnósticos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico circular - Síntomas más comunes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-pink-600" />
              Síntomas Más Comunes
            </CardTitle>
            <CardDescription>
              Distribución de síntomas reportados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.commonSymptoms?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.commonSymptoms}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.commonSymptoms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Ocurrencias']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay síntomas registrados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - Exámenes por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              Exámenes por Día
            </CardTitle>
            <CardDescription>
              Cantidad de exámenes analizados diariamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.examsByDay?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.examsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value) => [value, 'Exámenes']}
                  />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay exámenes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de métricas */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-600" />
              Resumen de Métricas
            </CardTitle>
            <CardDescription>
              Totales del período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalMessages ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Mensajes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats?.totalDiagnoses ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Diagnósticos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.totalExams ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Exámenes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats?.avgMessagesPerUser?.toFixed(1) ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Promedio/Usuario</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
