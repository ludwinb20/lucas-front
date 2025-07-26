import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Search, FileText, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ExamsHistory() {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
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
          collection(db, 'users', user.uid, 'exams'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExams(data);
      } catch (err) {
        setError('No se pudo cargar el historial de exámenes.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Filtro por búsqueda
  const filtered = exams.filter(item => {
    const findingsText = Array.isArray(item.findings)
      ? item.findings.join(' ')
      : (item.findings || '');
    const text = `${item.examType || ''} ${item.summary || ''} ${findingsText}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Card className="bg-muted/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-5 w-5 text-primary" />
          Historial de exámenes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="flex-1"
            placeholder="Buscar por tipo, hallazgo o resumen..."
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
          <div className="text-muted-foreground text-sm py-4">No hay exámenes previos.</div>
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
                <div className="font-medium truncate" title={item.examType || ''}>{item.examType || 'Sin tipo'}</div>
                <div className="text-sm text-primary truncate" title={item.summary || ''}>
                  {item.summary || 'Sin resumen'}
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
              Detalle del examen
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-1">
                {selected.createdAt?.toDate ? selected.createdAt.toDate().toLocaleString() : 'Sin fecha'}
              </div>
              <div><b>Tipo de examen:</b> {selected.examType || '-'}</div>
              {selected.imageUrl && (
                <div className="my-2">
                  <img src={selected.imageUrl} alt="Examen" className="max-w-full max-h-48 rounded border" />
                </div>
              )}
              <div><b>Resumen:</b> {selected.summary || '-'}</div>
              <div><b>Hallazgos:</b>
                <ul className="list-disc ml-6 mt-1">
                  {Array.isArray(selected.findings)
                    ? selected.findings.map((f: string, i: number) => <li key={i}>{f}</li>)
                    : selected.findings
                      ? <li>{selected.findings}</li>
                      : <li>-</li>
                  }
                </ul>
              </div>
              <div className="mt-2 text-xs text-yellow-800 bg-yellow-50 border-l-4 border-yellow-400 rounded p-2">
                {selected.disclaimer}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 