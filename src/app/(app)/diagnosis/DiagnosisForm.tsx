import React, { useState } from 'react';
import { diagnoseSymptoms } from '@/ai/flows/diagnose-flow';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function DiagnosisForm({ onResult }: { onResult: (result: any) => void }) {
  const { user } = useAuth();
  const [sintomas, setSintomas] = useState('');
  const [signos, setSignos] = useState('');
  const [hallazgos, setHallazgos] = useState('');
  const [modo, setModo] = useState<'obvios' | 'raros'>('obvios');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await diagnoseSymptoms({ sintomas, signos, hallazgos, modo });
      // Guardar en Firestore si hay resultado válido y usuario autenticado
      if (user && result && result.diagnósticos) {
        await addDoc(collection(db, 'users', user.uid, 'diagnoses'), {
          sintomas,
          signos,
          hallazgos,
          modo,
          result,
          createdAt: serverTimestamp(),
        });
      }
      onResult(result);
    } catch (err) {
      onResult({ error: 'Error al obtener diagnóstico.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-2">Nuevo diagnóstico</h2>
      <div>
        <label className="block mb-1 font-medium">Síntomas principales</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Ej: Fiebre, Tos, Dolor..."
          value={sintomas}
          onChange={e => setSintomas(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Signos clínicos</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Ej: Taquicardia, Erupción..."
          value={signos}
          onChange={e => setSignos(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Hallazgos de laboratorio</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Ej: Leucocitosis, PCR alta..."
          value={hallazgos}
          onChange={e => setHallazgos(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Tipo de diagnóstico</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={modo}
          onChange={e => setModo(e.target.value as 'obvios' | 'raros')}
        >
          <option value="obvios">Diagnósticos más obvios (comunes)</option>
          <option value="raros">Diagnósticos menos obvios (raros)</option>
        </select>
      </div>
      <button type="submit" className="mt-4 px-4 py-2 bg-primary text-white rounded" disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar diagnósticos'}
      </button>
    </form>
  );
} 