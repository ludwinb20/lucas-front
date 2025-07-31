import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Query, collectionGroup, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardStats {
  totalMessages: number;
  avgMessagesPerUser: number;
  totalDiagnoses: number;
  totalExams: number;
  commonSymptoms: { name: string; count: number }[];
  // Datos para gráficos de evolución temporal
  messagesByDay: { date: string; count: number }[];
  diagnosesByDay: { date: string; count: number }[];
  examsByDay: { date: string; count: number }[];
  activityByDay: { date: string; messages: number; diagnoses: number; exams: number }[];
}

interface Options {
  companyId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useDashboardStats({ companyId, userId, startDate, endDate }: Options) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  // Convertir fechas a strings para las dependencias del useEffect
  const startDateString = startDate?.toISOString() || '';
  const endDateString = endDate?.toISOString() || '';

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      console.log('🔍 DASHBOARD: Iniciando fetch de estadísticas', { companyId, userId, startDate, endDate });
      
      try {
        let totalMessages = 0;
        let totalDiagnoses = 0;
        let totalExams = 0;
        let userSet = new Set<string>();
        let symptomCount: Record<string, number> = {};
        
        // Datos para gráficos de evolución temporal
        let messagesByDay: Record<string, number> = {};
        let diagnosesByDay: Record<string, number> = {};
        let examsByDay: Record<string, number> = {};

        // Función helper para filtrar por fecha
        const filterByDate = (doc: any) => {
          if (!startDate && !endDate) return true;
          
          const createdAt = doc.data().createdAt;
          if (!createdAt) return false;
          
          const docDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          
          if (startDate && docDate < startDate) return false;
          if (endDate && docDate > endDate) return false;
          
          return true;
        };

        // Función helper para agregar datos por día
        const addToDayCount = (doc: any, dayCount: Record<string, number>) => {
          const createdAt = doc.data().createdAt;
          if (createdAt) {
            const docDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            const dateKey = docDate.toISOString().split('T')[0];
            dayCount[dateKey] = (dayCount[dateKey] || 0) + 1;
          }
        };

        if (userId) {
          // Si hay userId específico, consultar solo las subcolecciones de ese usuario
          console.log('📊 DASHBOARD: Consultando datos del usuario específico:', userId);
          
          // Mensajes del usuario
          const userMessagesQuery = query(collection(db, 'users', userId, 'messages'));
          const messagesSnap = await getDocs(userMessagesQuery);
          const filteredMessages = messagesSnap.docs.filter(filterByDate);
          totalMessages = filteredMessages.length;
          userSet.add(userId);
          filteredMessages.forEach(doc => addToDayCount(doc, messagesByDay));
          console.log('✅ DASHBOARD: Mensajes obtenidos del usuario:', totalMessages);

          // Diagnósticos del usuario
          const userDiagnosesQuery = query(collection(db, 'users', userId, 'diagnoses'));
          const diagnosesSnap = await getDocs(userDiagnosesQuery);
          const filteredDiagnoses = diagnosesSnap.docs.filter(filterByDate);
          totalDiagnoses = filteredDiagnoses.length;
          filteredDiagnoses.forEach(doc => addToDayCount(doc, diagnosesByDay));
          console.log('✅ DASHBOARD: Diagnósticos obtenidos del usuario:', totalDiagnoses);

          // Procesar síntomas desde diagnósticos del usuario
          filteredDiagnoses.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.sintomas)) {
              data.sintomas.forEach((sintoma: string) => {
                symptomCount[sintoma] = (symptomCount[sintoma] || 0) + 1;
              });
            } else if (typeof data.sintomas === 'string') {
              symptomCount[data.sintomas] = (symptomCount[data.sintomas] || 0) + 1;
            }
          });

          // Exámenes del usuario
          const userExamsQuery = query(collection(db, 'users', userId, 'exams'));
          const examsSnap = await getDocs(userExamsQuery);
          const filteredExams = examsSnap.docs.filter(filterByDate);
          totalExams = filteredExams.length;
          filteredExams.forEach(doc => addToDayCount(doc, examsByDay));
          console.log('✅ DASHBOARD: Exámenes obtenidos del usuario:', totalExams);

        } else if (companyId) {
          // Si hay companyId, obtener todos los usuarios de esa empresa primero
          console.log('📊 DASHBOARD: Consultando datos por empresa:', companyId);
          const usersQuery = query(collection(db, 'users'), where('companyId', '==', companyId));
          const usersSnap = await getDocs(usersQuery);
          
          // Procesar cada usuario de la empresa
          const userPromises = usersSnap.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            userSet.add(userId);
            
            // Mensajes del usuario
            const userMessagesQuery = query(collection(db, 'users', userId, 'messages'));
            const messagesSnap = await getDocs(userMessagesQuery);
            const filteredMessages = messagesSnap.docs.filter(filterByDate);
            filteredMessages.forEach(doc => addToDayCount(doc, messagesByDay));
            
            // Diagnósticos del usuario
            const userDiagnosesQuery = query(collection(db, 'users', userId, 'diagnoses'));
            const diagnosesSnap = await getDocs(userDiagnosesQuery);
            const filteredDiagnoses = diagnosesSnap.docs.filter(filterByDate);
            filteredDiagnoses.forEach(doc => addToDayCount(doc, diagnosesByDay));
            
            // Procesar síntomas desde diagnósticos
            filteredDiagnoses.forEach(doc => {
              const data = doc.data();
              if (Array.isArray(data.sintomas)) {
                data.sintomas.forEach((sintoma: string) => {
                  symptomCount[sintoma] = (symptomCount[sintoma] || 0) + 1;
                });
              } else if (typeof data.sintomas === 'string') {
                symptomCount[data.sintomas] = (symptomCount[data.sintomas] || 0) + 1;
              }
            });
            
            // Exámenes del usuario
            const userExamsQuery = query(collection(db, 'users', userId, 'exams'));
            const examsSnap = await getDocs(userExamsQuery);
            const filteredExams = examsSnap.docs.filter(filterByDate);
            filteredExams.forEach(doc => addToDayCount(doc, examsByDay));
            
            return {
              messages: filteredMessages.length,
              diagnoses: filteredDiagnoses.length,
              exams: filteredExams.length
            };
          });
          
          const userResults = await Promise.all(userPromises);
          totalMessages = userResults.reduce((sum, result) => sum + result.messages, 0);
          totalDiagnoses = userResults.reduce((sum, result) => sum + result.diagnoses, 0);
          totalExams = userResults.reduce((sum, result) => sum + result.exams, 0);
          
          console.log('✅ DASHBOARD: Datos obtenidos por empresa - Mensajes:', totalMessages, 'Diagnósticos:', totalDiagnoses, 'Exámenes:', totalExams);

        } else {
          // Si no hay filtros, solo mostrar datos del usuario actual
          // (collectionGroup requiere permisos especiales que no tenemos)
          if (user) {
            console.log('📊 DASHBOARD: Consultando datos del usuario actual...');
            
            // Mensajes del usuario actual
            const userMessagesQuery = query(collection(db, 'users', user.uid, 'messages'));
            const messagesSnap = await getDocs(userMessagesQuery);
            const filteredMessages = messagesSnap.docs.filter(filterByDate);
            totalMessages = filteredMessages.length;
            userSet.add(user.uid);
            filteredMessages.forEach(doc => addToDayCount(doc, messagesByDay));
            console.log('✅ DASHBOARD: Mensajes obtenidos del usuario actual:', totalMessages);

            // Diagnósticos del usuario actual
            const userDiagnosesQuery = query(collection(db, 'users', user.uid, 'diagnoses'));
            const diagnosesSnap = await getDocs(userDiagnosesQuery);
            const filteredDiagnoses = diagnosesSnap.docs.filter(filterByDate);
            totalDiagnoses = filteredDiagnoses.length;
            filteredDiagnoses.forEach(doc => addToDayCount(doc, diagnosesByDay));
            console.log('✅ DASHBOARD: Diagnósticos obtenidos del usuario actual:', totalDiagnoses);

            // Procesar síntomas desde diagnósticos del usuario actual
            filteredDiagnoses.forEach(doc => {
              const data = doc.data();
              if (Array.isArray(data.sintomas)) {
                data.sintomas.forEach((sintoma: string) => {
                  symptomCount[sintoma] = (symptomCount[sintoma] || 0) + 1;
                });
              } else if (typeof data.sintomas === 'string') {
                symptomCount[data.sintomas] = (symptomCount[data.sintomas] || 0) + 1;
              }
            });

            // Exámenes del usuario actual
            const userExamsQuery = query(collection(db, 'users', user.uid, 'exams'));
            const examsSnap = await getDocs(userExamsQuery);
            const filteredExams = examsSnap.docs.filter(filterByDate);
            totalExams = filteredExams.length;
            filteredExams.forEach(doc => addToDayCount(doc, examsByDay));
            console.log('✅ DASHBOARD: Exámenes obtenidos del usuario actual:', totalExams);
          } else {
            console.log('📊 DASHBOARD: No hay usuario autenticado, no se pueden obtener datos');
          }
        }

        // Calcular promedio de mensajes por usuario
        const avgMessagesPerUser = userSet.size > 0 ? totalMessages / userSet.size : 0;

        // Procesar síntomas más comunes
        const commonSymptoms = Object.entries(symptomCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log('✅ DASHBOARD: Síntomas procesados:', commonSymptoms.length);

        // Convertir datos por día a arrays ordenados
        const messagesByDayArray = Object.entries(messagesByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const diagnosesByDayArray = Object.entries(diagnosesByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const examsByDayArray = Object.entries(examsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Crear datos combinados de actividad por día
        const allDates = new Set([
          ...Object.keys(messagesByDay),
          ...Object.keys(diagnosesByDay),
          ...Object.keys(examsByDay)
        ]);
        
        const activityByDay = Array.from(allDates)
          .sort()
          .map(date => ({
            date,
            messages: messagesByDay[date] || 0,
            diagnoses: diagnosesByDay[date] || 0,
            exams: examsByDay[date] || 0
          }));

        console.log('🎉 DASHBOARD: Todas las consultas exitosas, actualizando estado...');
        setStats({
          totalMessages,
          avgMessagesPerUser,
          totalDiagnoses,
          totalExams,
          commonSymptoms,
          messagesByDay: messagesByDayArray,
          diagnosesByDay: diagnosesByDayArray,
          examsByDay: examsByDayArray,
          activityByDay
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
  }, [companyId, userId, user, startDateString, endDateString]);

  return { stats, loading };
} 