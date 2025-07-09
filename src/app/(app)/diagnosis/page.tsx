import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function DiagnosisPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl">Diagnóstico</CardTitle>
                <CardDescription>Esta vista está en construcción.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Aquí podrás obtener diagnósticos basados en IA.</p>
      </CardContent>
    </Card>
  );
}
