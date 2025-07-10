'use client';

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCompanyAction } from '@/app/(app)/companies/actions';

interface CreateCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function CreateCompanyDialog({ isOpen, onOpenChange, onSuccess }: CreateCompanyDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const resetForm = () => {
      setFile(null);
      setPreviewUrl(null);
      setIsLoading(false);
      formRef.current?.reset();
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    
    const name = formData.get('name') as string;
    const logoFile = formData.get('logo') as File;

    if (!name.trim() || !logoFile || logoFile.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, introduce un nombre y sube un logo.',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await createCompanyAction(formData);

      if (result.success) {
         toast({
            title: 'Empresa Creada',
            description: `La empresa ha sido creada exitosamente.`,
          });
          resetForm();
          onSuccess(); // Refetch companies
          onOpenChange(false); // Close dialog
      } else {
          toast({
            variant: 'destructive',
            title: 'Error al crear empresa',
            description: result.error || 'Ocurrió un problema al guardar la nueva empresa.',
          });
      }
    } catch (error) {
      console.error("Error submitting create company form:", error);
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Hubo un problema al procesar la solicitud. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isLoading) {
            onOpenChange(open);
            if (!open) resetForm();
        }
    }}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if(isLoading) e.preventDefault()}}>
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Rellena los datos para registrar una nueva empresa en el sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Empresa</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Nombre de la empresa"
                        required
                        disabled={isLoading}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="logo">Logo de la Empresa</Label>
                    <div 
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="space-y-1 text-center">
                            {previewUrl ? (
                                <Image src={previewUrl} alt="Vista previa del logo" width={80} height={80} className="mx-auto h-20 w-20 rounded-full object-cover" />
                            ) : (
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            )}
                            <div className="flex text-sm text-muted-foreground">
                                <p className="pl-1">{file ? file.name : 'Sube o arrastra una imagen'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">PNG, JPG, etc.</p>
                        </div>
                    </div>
                     <Input
                        id="logo"
                        name="logo"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Empresa
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    