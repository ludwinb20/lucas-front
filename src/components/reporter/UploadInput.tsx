'use client';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface UploadInputProps {
  onFileUpload: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function UploadInput({ onFileUpload, fileInputRef }: UploadInputProps) {
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileUpload(e.target.files)}
        className="hidden"
        accept="image/*,.dicom,.dcm"
        multiple
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className="w-full h-16 border-dashed hover:bg-muted/50"
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Arrastra imágenes o haz clic para subir
          </span>
          <span className="text-xs text-muted-foreground/70">
            Formatos soportados: JPG, PNG, DICOM
          </span>
        </div>
      </Button>
    </div>
  );
}