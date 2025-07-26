import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Stethoscope } from 'lucide-react';

export default function DiagnosisResult({ result }: { result: any }) {
  if (!result || result.error) {
    return (
      <Card className="mt-6 bg-red-50 border-red-200 animate-in fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Stethoscope className="h-5 w-5" />
            {result?.error || 'Sin resultados.'}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card className="mt-6 animate-in fade-in shadow-lg">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Sparkles className="h-6 w-6 text-accent" />
        <CardTitle className="text-xl">Diagnósticos sugeridos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <ul className="space-y-4">
          {result.diagnósticos?.map((diag: any, idx: number) => (
            <li key={idx} className="border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-primary text-lg">{diag.condición}</span>
                <Badge variant={diag.tipo === 'obvio' ? 'default' : 'secondary'}>
                  {diag.tipo === 'obvio' ? 'Obvio' : 'Raro'}
                </Badge>
                <span className="ml-auto font-mono text-base text-green-700">{diag.probabilidad}%</span>
              </div>
              <Progress value={diag.probabilidad} className="my-2 h-2 bg-secondary" />
              <div className="text-sm text-gray-700 mb-1"><b>Justificación:</b> {diag.justificación}</div>
              <div className="text-sm text-gray-700"><b>Recomendación:</b> {diag.recomendación}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">{result.disclaimer}</span>
        </div>
      </CardContent>
    </Card>
  );
} 