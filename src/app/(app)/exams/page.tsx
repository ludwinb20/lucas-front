'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeExam, type AnalyzeExamOutput } from '@/ai/flows/analyze-exam-flow';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, FileText, Loader2, Wand2, AlertTriangle, FileUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ExamsHistory from './ExamsHistory';

const examTypes = [
  { value: "radiografia", label: "Radiografía (Rayos X)" },
  { value: "resonancia", label: "Resonancia Magnética (RM)" },
  { value: "tomografia", label: "Tomografía Computarizada (TC)" },
  { value: "ecografia", label: "Ecografía (Ultrasonido)" },
  { value: "mamografia", label: "Mamografía" },
  { value: "otro", label: "Otro" },
];


export default function ExamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [examType, setExamType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeExamOutput | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null); // Reset previous results
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(null);
      toast({
        variant: 'destructive',
        title: 'Archivo no válido',
        description: 'Por favor, selecciona un archivo de imagen.',
      });
    }
  };
  
  const handleAnalyze = async () => {
    if (!selectedFile || !examType || !user) {
      toast({
        variant: 'destructive',
        title: 'Información incompleta',
        description: 'Por favor, sube una imagen y selecciona un tipo de examen.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/exams/${Date.now()}_${selectedFile.name}`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Get image data URI for Genkit
      const imageDataUri = imagePreviewUrl!;

      // 3. Call AI flow
      const result = await analyzeExam({ imageDataUri, examType });

      // 4. Save result to Firestore
      await addDoc(collection(db, 'users', user.uid, 'exams'), {
        examType,
        imageUrl,
        summary: result.summary,
        findings: result.findings,
        disclaimer: result.disclaimer,
        createdAt: serverTimestamp(),
      });
      
      setAnalysisResult(result);
      toast({
        title: 'Análisis Completo',
        description: 'El reporte del examen ha sido generado y guardado.',
      });

    } catch (error) {
      console.error('Error durante el análisis del examen:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el Análisis',
        description: 'No se pudo completar el análisis. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setExamType('');
    setAnalysisResult(null);
    setIsLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex gap-8 w-full min-h-[70vh]">
      <div className="flex-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Análisis de Exámenes Médicos con IA</CardTitle>
                <CardDescription>Sube una imagen de tu examen, selecciona el tipo y obtén un análisis preliminar.</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {!analysisResult ? (
          <Card>
            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <Label htmlFor="exam-type">1. Selecciona el tipo de examen</Label>
                  <Select value={examType} onValueChange={setExamType} disabled={isLoading}>
                      <SelectTrigger id="exam-type">
                          <SelectValue placeholder="Elige un tipo de examen..." />
                      </SelectTrigger>
                      <SelectContent>
                          {examTypes.map(type => (
                              <SelectItem key={type.value} value={type.label}>{type.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                   <Label>2. Sube la imagen de tu examen</Label>
                   <div 
                      className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                   >
                      <Input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          disabled={isLoading}
                      />
                      {imagePreviewUrl ? (
                           <div className="relative w-full h-48">
                              <Image src={imagePreviewUrl} alt="Vista previa del examen" fill objectFit="contain" className="rounded-md" />
                           </div>
                      ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <UploadCloud className="h-10 w-10" />
                              <p className="font-semibold">Haz clic para subir o arrastra una imagen</p>
                              <p className="text-xs">PNG, JPG, etc.</p>
                          </div>
                      )}
                   </div>
              </div>
              <div className="flex flex-col justify-center items-center bg-card-foreground/5 rounded-lg p-6">
                   <Wand2 className="h-12 w-12 text-primary mb-4" />
                   <h3 className="text-lg font-semibold mb-2">Listo para el análisis</h3>
                   <p className="text-center text-sm text-muted-foreground mb-6">
                      Una vez que hayas subido una imagen y seleccionado el tipo de examen, presiona el botón para que nuestra IA genere un reporte.
                   </p>
                   <Button onClick={handleAnalyze} disabled={!selectedFile || !examType || isLoading} size="lg">
                      {isLoading ? (
                          <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analizando...
                          </>
                      ) : (
                          <>
                             <Wand2 className="mr-2 h-5 w-5" />
                             Analizar Examen
                          </>
                      )}
                  </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle>Resultados del Análisis</CardTitle>
              <CardDescription>A continuación se muestra el reporte generado por la IA para tu examen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Resumen Médico</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-4 rounded-md">{analysisResult.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Hallazgos Potenciales</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-4 rounded-md">{analysisResult.findings}</p>
              </div>
              
              <Separator />

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advertencia Importante</AlertTitle>
                <AlertDescription>
                  {analysisResult.disclaimer}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={resetState}>
                <FileUp className="mr-2 h-4 w-4"/>
                Analizar Otro Examen
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <aside className="w-96 min-w-[320px] border-l pl-6">
        <ExamsHistory />
      </aside>
    </div>
  );
}
