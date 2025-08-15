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
  const [pendingAiMessage, setPendingAiMessage] = useState<Message | null>(null);

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

          const merged = pendingAiMessage && pendingAiMessage.text.trim().length > 0 ? [pendingAiMessage, ...msgs] : msgs;
          setMessages(merged);
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
  }, [user, userProfile, isAuthLoading, toast, pendingAiMessage]);

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
    let imageDataUri: string | undefined = undefined;
    
    if (imageFile) {
      // Convertir la imagen a data URI para el endpoint
      const reader = new FileReader();
      imageDataUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      
      // También subir a Firebase Storage para mostrar en la UI
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

    // Crear mensaje temporal de IA para streaming
    const tempAiMessageId = crypto.randomUUID();
    const tempAiMessage: Message = {
      id: tempAiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, userMessage);

      // Obtener los 4 mensajes más recientes (excluyendo el mensaje actual del usuario)
      const filteredMessages = messages
        .filter((m) => !m.text.includes('Soy LucasMed, tu asistente de IA. ¿Cómo puedo ayudarte hoy?'));
      
      console.log('🔍 Debug - Array completo de mensajes:', messages.map(m => ({ sender: m.sender, text: m.text?.substring(0, 50) + '...' })));
      console.log('🔍 Debug - Mensajes filtrados:', filteredMessages.map(m => ({ sender: m.sender, text: m.text?.substring(0, 50) + '...' })));
      
      const previousMessages = filteredMessages
        .slice(-4) // Tomar los 4 más recientes del array filtrado
        .reverse() // Invertir el orden para que esté cronológicamente correcto (más antiguos primero)
        .map((m) => ({
          role: m.sender,
          content: m.text,
          imageUrl: m.imageUrl,
        }));

      // Agregar mensaje temporal a la UI (al fondo visual con column-reverse => al inicio del array)
      // NO agregar el mensaje vacío a la lista de mensajes hasta que tenga contenido
      setPendingAiMessage(tempAiMessage);
      // setMessages(prev => [tempAiMessage, ...prev]); // Comentado: no mostrar mensaje vacío

      try {
        // Usar el endpoint de Next.js como proxy para evitar CORS
        console.log('Llamando a MedGemma a través de proxy Next.js');

        // Construir contexto con los mensajes anteriores
        console.log('🔍 Debug - previousMessages:', JSON.stringify(previousMessages, null, 2));
        
        const context = previousMessages
          .map((msg: any) => {
            console.log('🔍 Debug - Procesando mensaje:', { role: msg.role, content: msg.content?.substring(0, 100) + '...' });
            const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
            const content = msg.content;
            const imageInfo = msg.imageUrl ? ` [Imagen: ${msg.imageUrl}]` : '';
            const formattedMessage = `[${role}] ${content}${imageInfo}`;
            console.log('🔍 Debug - Mensaje formateado:', formattedMessage);
            return formattedMessage;
          })
          .join('\n');

        const prompt = text;

        console.log('🔍 Debug - Contexto final:', context);
        console.log('🔍 Debug - Prompt:', prompt);
        console.log('🔍 Debug - Image URL:', imageUrl);
        console.log('🔍 Debug - Image Data URI:', imageDataUri ? 'data:image/...' : 'No image');

        // Determinar el endpoint basado en si hay imagen o no
        const endpoint = imageDataUri ? '/api/process-image-stream' : '/api/process-text-stream';
        console.log('🔍 Debug - Usando endpoint:', endpoint);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context,
            ...(imageDataUri && { imageDataUri }), // Incluir imageDataUri solo si existe
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body available for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          let handled = false;
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  // Manejar error del stream - mostrar alerta y no guardar en BD
                  console.error('Error recibido en stream:', data.error);
                  setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId));
                  setPendingAiMessage(null);
                  toast({
                    variant: 'destructive',
                    title: 'Error de conexión',
                    description: 'No se pudo obtener una respuesta de la IA. Verifica tu conexión e intenta de nuevo.',
                  });
                  return;
                }
                if (typeof data.token === 'string') {
                  fullResponse += data.token;
                  handled = true;
                  setPendingAiMessage(prev => (prev ? { ...prev, text: fullResponse } : prev));
                  
                  // Solo agregar el mensaje a la lista cuando tenga contenido
                  setMessages(prev => {
                    const exists = prev.some(m => m.id === tempAiMessageId);
                    if (!exists && fullResponse.trim().length > 0) {
                      return [{ ...tempAiMessage, text: fullResponse }, ...prev];
                    }
                    if (exists) {
                      const others = prev.filter(m => m.id !== tempAiMessageId);
                      return [{ ...tempAiMessage, text: fullResponse }, ...others];
                    }
                    return prev;
                  });
                }
                if (data.finished) {
                  const finalAiMessage = {
                    text: fullResponse,
                    sender: 'ai' as const,
                    createdAt: serverTimestamp(),
                  };
                  await addDoc(messagesCollection, finalAiMessage);
                  setPendingAiMessage(null);
                  
                  // Asegurar que el mensaje esté en la lista si no estaba
                  setMessages(prev => {
                    const exists = prev.some(m => m.id === tempAiMessageId);
                    if (!exists && fullResponse.trim().length > 0) {
                      return [{ ...tempAiMessage, text: fullResponse }, ...prev];
                    }
                    return prev.filter(msg => msg.id !== tempAiMessageId);
                  });
                  return;
                }
              } catch (e) {
                // ignore JSON parse errors for non-SSE chunks
              }
            }
          }

          // Fallback: si no vino en formato SSE, tratamos el chunk como texto plano
          if (!handled) {
            fullResponse += chunk;
            setPendingAiMessage(prev => (prev ? { ...prev, text: fullResponse } : prev));
            setMessages(prev => {
              const exists = prev.some(m => m.id === tempAiMessageId);
              if (!exists && fullResponse.trim().length > 0) {
                return [{ ...tempAiMessage, text: fullResponse }, ...prev];
              }
              if (exists) {
                const others = prev.filter(m => m.id !== tempAiMessageId);
                return [{ ...tempAiMessage, text: fullResponse }, ...others];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('Error en streaming:', error);
        // Remover mensaje temporal en caso de error
        setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId));
        setPendingAiMessage(null);
        
        // Mostrar toast de error
        toast({
          variant: 'destructive',
          title: 'Error de conexión',
          description: 'No se pudo obtener una respuesta de la IA. Verifica tu conexión e intenta de nuevo.',
        });
        
        // NO propagar el error para evitar el catch exterior
        return;
      }
    } catch (error) {
      console.error('Error en chat:', error);
      
      // Remover mensaje temporal si existe
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId));
      setPendingAiMessage(null);
      
      // Mostrar toast de error
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: 'No se pudo obtener una respuesta de la IA. Verifica tu conexión e intenta de nuevo.',
      });
      
      // NO guardar mensaje de error en la base de datos
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.32))] shadow-2xl overflow-hidden rounded-lg border">
      <MessageList 
        messages={messages} 
        isLoadingAiResponse={isSending} 
        loadMoreMessages={loadMoreMessages}
        isStreamingPending={!!pendingAiMessage && pendingAiMessage.text.trim().length === 0}
      />
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </Card>
  );
}