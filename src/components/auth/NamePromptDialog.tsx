'use client';

import { useState, type FormEvent } from 'react';
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
import { Loader2 } from 'lucide-react';

interface NamePromptDialogProps {
  isOpen: boolean;
  onSubmit: (name: string) => Promise<void>;
}

export function NamePromptDialog({ isOpen, onSubmit }: NamePromptDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    await onSubmit(name.trim());
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>¡Bienvenido a LucasMed!</DialogTitle>
          <DialogDescription>
            Para personalizar tu experiencia, por favor dinos tu nombre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nombre
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        placeholder="Tu nombre"
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading || !name.trim()}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar y Continuar
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
