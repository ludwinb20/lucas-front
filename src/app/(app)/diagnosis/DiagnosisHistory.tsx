import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Stethoscope, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DiagnosisHistory() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'diagnoses'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDiagnoses(data);
      } catch (err) {
        setError('No se pudo cargar el historial.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Filtro por búsqueda
  const filtered = diagnoses.filter(item => {
    const text = `${item.sintomas || ''} ${item.result?.diagnósticos?.map((d:any) => d.condición).join(' ') || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Card className="bg-muted/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-5 w-5 text-primary" />
          Historial de diagnósticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="flex-1"
            placeholder="Buscar por síntoma o diagnóstico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm py-4">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4">No hay diagnósticos previos.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="border rounded p-3 bg-background hover:bg-accent/30 transition-colors cursor-pointer mt-3"
                onClick={() => setSelected(item)}
                title="Ver detalles"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Sin fecha'}
                </div>
                <div className="font-medium truncate" title={item.sintomas || ''}>{item.sintomas || 'Sin resumen'}</div>
                <div className="text-sm text-primary">
                  {item.result?.diagnósticos?.[0]?.condición || 'Sin diagnóstico'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {/* Modal de detalles */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalle del diagnóstico
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-1">
                {selected.createdAt?.toDate ? selected.createdAt.toDate().toLocaleString() : 'Sin fecha'}
              </div>
              <div><b>Síntomas:</b> {selected.sintomas || '-'}</div>
              <div><b>Signos:</b> {selected.signos || '-'}</div>
              <div><b>Hallazgos:</b> {selected.hallazgos || '-'}</div>
              <div><b>Tipo de diagnóstico:</b> {selected.modo === 'obvios' ? 'Obvios (comunes)' : 'Raros (menos obvios)'}</div>
              <div className="mt-2">
                <b>Diagnósticos sugeridos:</b>
                <ul className="list-disc ml-6 mt-1">
                  {selected.result?.diagnósticos?.map((d: any, i: number) => (
                    <li key={i} className="mb-1">
                      <span className="font-semibold text-primary">{d.condición}</span> ({d.probabilidad}%)
                      <div className="text-xs text-muted-foreground">{d.justificación}</div>
                      <div className="text-xs">{d.recomendación}</div>
                      <span className="inline-block text-xs rounded px-2 ml-2 bg-muted border">{d.tipo === 'obvio' ? 'Obvio' : 'Raro'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 text-xs text-yellow-800 bg-yellow-50 border-l-4 border-yellow-400 rounded p-2">
                {selected.result?.disclaimer}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 