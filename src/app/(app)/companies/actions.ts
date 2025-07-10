// src/app/(app)/companies/actions.ts
'use server';

import { z } from 'zod';
import { auth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase-admin'; // Using admin SDK on the server
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

const CompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
});

// We can't pass a File object directly to a server action from a form.
// We need to use FormData.
export async function createCompanyAction(formData: FormData) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No autenticado');
    }

    // Check user role on the server for security
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists() || userDoc.data()?.role !== 'superadmin') {
      return { success: false, error: 'No autorizado' };
    }

    const name = formData.get('name') as string;
    const file = formData.get('logo') as File;

    if (!file || !(file instanceof File)) {
        return { success: false, error: 'Logo es requerido.' };
    }

    const validation = CompanySchema.safeParse({ name });
    if (!validation.success) {
      return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
    }

    // 1. Upload logo to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageRef = ref(storage, `companies/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, buffer, { contentType: file.type });
    const logoUrl = await getDownloadURL(storageRef);

    // 2. Create company document in Firestore
    await addDoc(collection(db, 'companies'), {
      name: validation.data.name,
      logoUrl,
      createdAt: serverTimestamp(),
    });

    return { success: true };

  } catch (error) {
    console.error("Error creating company in server action:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error desconocido.' };
  }
}

    