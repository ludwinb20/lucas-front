// hooks/useChat.ts
import { useState, useEffect, useCallback } from 'react';
import { chatRef, push, onValue, off, DatabaseReference, database } from '../lib/firebase';
import { Message } from '@/types/chats';
import { DataSnapshot, ref, set } from 'firebase/database';

type UseChatReturn = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  sendAIResponse: (text: string) => Promise<void>;
  error: Error | null;
};

export function useChat(chatId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Escuchar cambios en los mensajes (versión mejorada)
  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    const messagesRef: DatabaseReference = chatRef(`${chatId}`);
    setIsLoading(true);
    
    const handleSnapshot = (snapshot: DataSnapshot) => {
      try {
        const messagesData = snapshot.val() || {};
        const messagesArray: Message[] = Object.entries(messagesData).map(([id, message]) => ({
          id,
          ...(message as Omit<Message, 'id'>),
          // Aseguramos que timestamp sea número
          timestamp: typeof (message as any)?.timestamp === 'number' 
            ? (message as any).timestamp 
            : Date.now()
        }));
        
        // Ordenar por timestamp (descendente para chat)
        messagesArray.sort((a, b) => b.timestamp + a.timestamp);
        
        setMessages(messagesArray);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error processing messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const errorCallback = (error: Error) => {
      setError(error);
      setIsLoading(false);
    };

    // Usamos onValue con manejo de errores
    onValue(messagesRef, handleSnapshot, errorCallback);

    return () => {
      off(messagesRef);
    };
  }, [chatId]);

  // Función para enviar mensajes (mejorada)
  const sendMessage = useCallback(async (messageData: {
    text: string;
    senderId: string;
    senderType: 'user' | 'assistant';
  }) => {
    setIsLoading(true);
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      await push(messagesRef, {
        ...messageData,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Función para enviar respuestas de IA
  const sendAIResponse = useCallback(async (text: string) => {
    return sendMessage({
      text,
      senderId: 'assistant1', // ID de tu IA
      senderType: 'assistant'
    });
  }, [sendMessage]);


  return { messages, isLoading, sendMessage, sendAIResponse, error };
}