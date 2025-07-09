import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ExamsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl">Exámenes</CardTitle>
                <CardDescription>Esta vista está en construcción.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Aquí podrás ver y gestionar los resultados de tus exámenes.</p>
      </CardContent>
    </Card>
  );
}
