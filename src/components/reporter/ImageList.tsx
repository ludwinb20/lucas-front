'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MedicalImage } from '@/types/ui';
import { X, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface ImageListProps {
  images: MedicalImage[];
  report: string | null;
  isGenerating: boolean;
  onRemoveImage: (id: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
}

export function ImageList({ 
  images, 
  report, 
  isGenerating, 
  onRemoveImage, 
  onUpdateDescription 
}: ImageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const handleStartEditing = (image: MedicalImage) => {
    setEditingId(image.id);
    setEditDescription(image.description || '');
  };

  const handleSaveDescription = (id: string) => {
    onUpdateDescription(id, editDescription);
    setEditingId(null);
  };

  return (
    <ScrollArea className="flex-grow">
      <div className="p-4 space-y-4 h-full">
        {/* Lista de imágenes subidas */}
        {images.map((image) => (
          <div key={image.id} className="group relative rounded-lg border p-3 bg-card">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-md overflow-hidden">
                <img 
                  src={image.previewUrl} 
                  alt="Imagen médica" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1">
                {editingId === image.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Añade notas sobre esta imagen..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSaveDescription(image.id)}
                        className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
                      >
                        Guardar
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="text-xs px-2 py-1 bg-muted rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {image.description || 'Sin descripción...'}
                    </p>
                    <button
                      onClick={() => handleStartEditing(image)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Edit className="h-3 w-3" />
                      {image.description ? 'Editar' : 'Añadir'} notas
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onRemoveImage(image.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
        
        {/* Estado de carga */}
        {isGenerating && (
          <div className="p-4 rounded-lg bg-muted/50 animate-in fade-in">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full bg-accent" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px] bg-accent" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-75" />
                  <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-150" />
                  <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reporte generado */}
        {report && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-medium text-primary mb-2">Reporte Médico Generado</h3>
            <div className="prose prose-sm max-w-none">
              {report.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}