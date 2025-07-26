'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { chatAIConsultation } from '@/ai/flows/chat-ai-consultation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  getDocs,
  startAfter,
  DocumentReference,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { unique } from 'next/dist/build/utils';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: string;
  createdAt?: Timestamp;
  imageUrl?: string;
  ref?: DocumentReference;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [lastLoaded, setLastLoaded] = useState<any>(null);

  const loadMoreMessages = async (): Promise<Message[]> => {
    console.log("loadMoreMessages");
    if (!user) return [];

    const messagesCollection = collection(db, 'users', user.uid, 'messages');
    let q;

    if (lastLoaded?.createdAt && lastLoaded?.ref) {
      console.log("lastLoaded", lastLoaded);
      q = query(
        messagesCollection,
        orderBy('createdAt', 'desc'),
        orderBy('__name__', 'desc'),
        startAfter(lastLoaded.createdAt, lastLoaded.ref.id),
        limit(15)
      );
    } else {
      q = query(
        messagesCollection,
        orderBy('createdAt', 'desc'),
        orderBy('__name__', 'desc'),
        limit(15)
      );
    }

    const snapshot = await getDocs(q);
    console.log("snapshot", snapshot);
    if (snapshot.empty) return [];
    const moreMessages: Message[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      moreMessages.push({
        id: doc.id,
        text: data.text,
        sender: data.sender,
        createdAt: data.createdAt,
        timestamp: data.createdAt
          ? data.createdAt.toDate().toLocaleString([], {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
        imageUrl: data.imageUrl,
      });
    });

    if (moreMessages.length > 0) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastLoaded({ createdAt: lastDoc.data().createdAt, ref: lastDoc.ref });
    }

    return moreMessages;
  };

  useEffect(() => {
    if (user) {
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      const q = query(messagesCollection, orderBy('createdAt', 'desc'), orderBy('__name__', 'desc'), limit(15));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const msgs: Message[] = [];

          if (querySnapshot.empty) {
            const welcomeMsg = userProfile?.name
              ? `¡Hola ${userProfile.name}! Soy LucasMed, tu asistente de IA. ¿Cómo puedo ayudarte hoy?`
              : "¡Hola! Soy LucasMed, tu asistente de IA. ¿Cómo puedo ayudarte hoy?";
            msgs.push({
              id: crypto.randomUUID(),
              text: welcomeMsg,
              sender: 'ai',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            msgs.push({
              id: doc.id,
              text: data.text,
              sender: data.sender,
              createdAt: data.createdAt,
              timestamp: data.createdAt
                ? data.createdAt.toDate().toLocaleString([], {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : undefined,
              imageUrl: data.imageUrl,
            });
          });

          setMessages(msgs);
          if (querySnapshot.docs.length > 0) {
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastLoaded({ createdAt: lastDoc.data().createdAt, ref: lastDoc.ref });
          }
        },
        (error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo cargar el historial del chat.',
          });
        }
      );

      return () => unsubscribe();
    }

    if (!isAuthLoading) {
      setMessages([
        {
          id: crypto.randomUUID(),
          text: "¡Hola! Soy LucasMed, tu asistente de IA. Por favor, inicia sesión para comenzar una conversación.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user, userProfile, isAuthLoading, toast]);

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'No autenticado',
        description: 'Debes iniciar sesión para enviar un mensaje.',
      });
      return;
    }

    let imageUrl: string | undefined = undefined;
    if (imageFile) {
      const storageRef = ref(storage, `users/${user.uid}/chat-images/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(uploadResult.ref);
    }

    const userMessage = {
      text,
      sender: 'user' as const,
      createdAt: serverTimestamp(),
      ...(imageUrl && { imageUrl }),
    };

    setIsSending(true);

    try {
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, userMessage);

      const last10 = [...messages, { ...userMessage, id: 'temp' }]
        .slice(-10)
        .map((m) => ({
          role: m.sender,
          content: m.text,
          imageUrl: m.imageUrl,
        }));

      const aiResponse = await chatAIConsultation({ history: last10 });

      const aiMessage = {
        text: aiResponse.response,
        sender: 'ai' as const,
        createdAt: serverTimestamp(),
      };

      await addDoc(messagesCollection, aiMessage);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo obtener una respuesta de la IA. Intenta de nuevo.',
      });

      const fallbackMessage = {
        text: "Lo siento, no pude procesar tu solicitud. Intenta nuevamente más tarde.",
        sender: 'ai' as const,
        createdAt: serverTimestamp(),
      };

      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, fallbackMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.32))] shadow-2xl overflow-hidden rounded-lg border">
      <MessageList messages={messages} isLoadingAiResponse={isSending} loadMoreMessages={loadMoreMessages} />
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </Card>
  );
}