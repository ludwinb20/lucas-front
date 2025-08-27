'use client';

import DiagnosisForm from './DiagnosisForm';
import DiagnosisHistory from './DiagnosisHistory';
import DiagnosisResult from './DiagnosisResult';
import { useState } from 'react';

export default function DiagnosisPage() {
  const [result, setResult] = useState(null);

  return (
    <div className="flex gap-8 w-full min-h-[70vh]">
      {result ? (
        <>
          <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto">
            <DiagnosisResult result={result} />
            <button
              className="mt-8 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
              onClick={() => { setResult(null); }}
            >
              Nuevo diagnóstico
            </button>
          </div>
          <aside className="w-80 min-w-[280px] border-l pl-6 flex flex-col">
            <div className="mb-4 text-sm font-semibold text-muted-foreground">¿Quieres analizar otro caso?</div>
            <DiagnosisForm onResult={setResult} />
            <div className="mt-8 flex-1">
              <DiagnosisHistory />
            </div>
          </aside>
        </>
      ) : (
        <>
          <div className="flex-1 flex flex-col gap-6">
            <DiagnosisForm onResult={setResult} />
          </div>
          <aside className="w-96 min-w-[320px] border-l pl-6">
            <DiagnosisHistory />
          </aside>
        </>
      )}
    </div>
  );
}
