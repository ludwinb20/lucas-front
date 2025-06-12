'use client';
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ImageList } from './ImageList';
import { UploadInput } from './UploadInput';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MedicalImage } from '@/types/ui';
const { v4: uuidv4 } = require('uuid');

export function ImageUploadReport() {
  const [uploadedImages, setUploadedImages] = useState<MedicalImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      description: ''
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleGenerateReport = async () => {
    if (uploadedImages.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Aquí iría la llamada a tu API/AI para generar el reporte
      const mockApiCall = new Promise<string>(resolve => {
        setTimeout(() => {
          resolve(`Reporte médico generado para ${uploadedImages.length} imágenes.\n\nHallazgos: ...`);
        }, 2000);
      });
      
      const generatedReport = await mockApiCall;
      setReport(generatedReport);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleUpdateDescription = (id: string, description: string) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, description } : img
      )
    );
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.32))] shadow-2xl overflow-hidden rounded-lg border">
      <ImageList 
        images={uploadedImages} 
        report={report}
        isGenerating={isGenerating}
        onRemoveImage={handleRemoveImage}
        onUpdateDescription={handleUpdateDescription}
      />
      
      <div className="sticky bottom-0 border-t border-border bg-background p-3 md:p-4 space-y-3">
        <UploadInput 
          onFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
        />
        
        <Button
          onClick={handleGenerateReport}
          disabled={uploadedImages.length === 0 || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando reporte...
            </>
          ) : (
            'Generar Reporte Médico'
          )}
        </Button>
      </div>
    </Card>
  );
}