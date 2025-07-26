import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Query, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DashboardStats {
  totalMessages: number;
  avgMessagesPerUser: number;
  totalDiagnoses: number;
  totalExams: number;
  commonSymptoms: { name: string; count: number }[];
}

interface Options {
  companyId?: string;
  userId?: string;
}

export function useDashboardStats({ companyId, userId }: Options) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      console.log('🔍 DASHBOARD: Iniciando fetch de estadísticas', { companyId, userId });
      
      try {
        // Mensajes
        console.log('📊 DASHBOARD: Consultando mensajes...');
        let messagesQuery: Query = collection(db, 'messages');
        if (companyId) {
          console.log('📊 DASHBOARD: Filtrando mensajes por empresa:', companyId);
          messagesQuery = query(messagesQuery, where('companyId', '==', companyId));
        }
        if (userId) {
          console.log('📊 DASHBOARD: Filtrando mensajes por usuario:', userId);
          messagesQuery = query(messagesQuery, where('userId', '==', userId));
        }
        console.log('📊 DASHBOARD: Ejecutando query de mensajes...');
        const messagesSnap = await getDocs(messagesQuery);
        console.log('✅ DASHBOARD: Mensajes obtenidos:', messagesSnap.size);
        const totalMessages = messagesSnap.size;
        const userSet = new Set<string>();
        messagesSnap.forEach(doc => {
          const data = doc.data();
          if (data.userId) userSet.add(data.userId);
        });
        const avgMessagesPerUser = userSet.size > 0 ? totalMessages / userSet.size : 0;

        // Diagnósticos
        console.log('📊 DASHBOARD: Consultando diagnósticos...');
        let diagQuery: Query = collection(db, 'diagnoses');
        if (companyId) {
          console.log('📊 DASHBOARD: Filtrando diagnósticos por empresa:', companyId);
          diagQuery = query(diagQuery, where('companyId', '==', companyId));
        }
        if (userId) {
          console.log('📊 DASHBOARD: Filtrando diagnósticos por usuario:', userId);
          diagQuery = query(diagQuery, where('userId', '==', userId));
        }
        console.log('📊 DASHBOARD: Ejecutando query de diagnósticos...');
        const diagSnap = await getDocs(diagQuery);
        console.log('✅ DASHBOARD: Diagnósticos obtenidos:', diagSnap.size);
        const totalDiagnoses = diagSnap.size;

        // Exámenes
        console.log('📊 DASHBOARD: Consultando exámenes...');
        let examQuery: Query = collectionGroup(db, 'exams');
        if (companyId) {
          console.log('📊 DASHBOARD: Filtrando exámenes por empresa:', companyId);
          examQuery = query(examQuery, where('companyId', '==', companyId));
        }
        if (userId) {
          console.log('📊 DASHBOARD: Filtrando exámenes por usuario:', userId);
          examQuery = query(examQuery, where('userId', '==', userId));
        }
        console.log('📊 DASHBOARD: Ejecutando query de exámenes...');
        const examSnap = await getDocs(examQuery);
        console.log('✅ DASHBOARD: Exámenes obtenidos:', examSnap.size);
        const totalExams = examSnap.size;

        // Síntomas más comunes (desde diagnósticos)
        console.log('📊 DASHBOARD: Procesando síntomas desde diagnósticos...');
        const symptomCount: Record<string, number> = {};
        diagSnap.forEach(doc => {
          const data = doc.data();
          if (Array.isArray(data.sintomas)) {
            data.sintomas.forEach((sintoma: string) => {
              symptomCount[sintoma] = (symptomCount[sintoma] || 0) + 1;
            });
          } else if (typeof data.sintomas === 'string') {
            symptomCount[data.sintomas] = (symptomCount[data.sintomas] || 0) + 1;
          }
        });
        const commonSymptoms = Object.entries(symptomCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log('✅ DASHBOARD: Síntomas procesados:', commonSymptoms.length);

        console.log('🎉 DASHBOARD: Todas las consultas exitosas, actualizando estado...');
        setStats({
          totalMessages,
          avgMessagesPerUser,
          totalDiagnoses,
          totalExams,
          commonSymptoms,
        });
      } catch (error) {
        console.error('❌ DASHBOARD: Error al obtener estadísticas:', error);
        console.error('❌ DASHBOARD: Detalles del error:', {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: (error as any)?.code,
          details: (error as any)?.details
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [companyId, userId]);

  return { stats, loading };
} 