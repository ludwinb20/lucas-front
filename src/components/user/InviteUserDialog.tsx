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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, type UserProfile, type UserRole } from '@/hooks/useAuth';

interface Company {
    id: string;
    name: string;
}

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  companies: Company[];
}

// NOTE: This dialog creates a user profile in Firestore but DOES NOT create an
// authentication user in Firebase Auth. The user will need to be created
// separately (e.g., in the Firebase Console) with the same email to be able to log in.

export function InviteUserDialog({ isOpen, onOpenChange, onSuccess, companies }: InviteUserDialogProps) {
  const { userProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [companyId, setCompanyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
      setName('');
      setEmail('');
      setRole('doctor');
      setCompanyId('');
      setIsLoading(false);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) {
      toast({ variant: 'destructive', title: 'Campos incompletos' });
      return;
    }
    if (userProfile?.role === 'superadmin' && !companyId) {
        toast({ variant: 'destructive', title: 'Por favor, selecciona una empresa.' });
        return;
    }

    setIsLoading(true);

    try {
      const newUserProfile: Omit<UserProfile, 'createdAt'> & { companyId?: string } = {
        name,
        email,
        role,
        companyId: userProfile?.role === 'admin' ? userProfile.companyId : companyId,
      };

      // This is a placeholder for creating the user in Auth.
      // We are just creating the Firestore document.
      // A more robust solution would use a Firebase Function to create the Auth user.
      await addDoc(collection(db, 'users'), {
          ...newUserProfile,
          createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Usuario Invitado',
        description: `El perfil para ${name} ha sido creado.`,
      });

      resetForm();
      onSuccess(); // Refetch users
      onOpenChange(false); // Close dialog

    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        variant: 'destructive',
        title: 'Error al invitar usuario',
        description: 'Hubo un problema al crear el perfil. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if(isLoading) e.preventDefault()}}>
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Crea un perfil de usuario. Deberás crear su cuenta de autenticación por separado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as UserRole)} disabled={isLoading}>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Selecciona un rol..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {userProfile?.role === 'superadmin' && <SelectItem value="superadmin">Superadmin</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                {userProfile?.role === 'superadmin' && (
                     <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Select value={companyId} onValueChange={setCompanyId} disabled={isLoading || companies.length === 0}>
                            <SelectTrigger id="company">
                                <SelectValue placeholder="Selecciona una empresa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Invitar Usuario
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
