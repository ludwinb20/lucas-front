'use client';
import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { chatAIConsultation, type ChatAIConsultationOutput } from '@/ai/flows/chat-ai-consultation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: string;
  createdAt?: Timestamp;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (user) {
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      const q = query(messagesCollection, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const msgs: Message[] = [];
          if (querySnapshot.empty) {
             msgs.push({
                id: crypto.randomUUID(),
                text: "Hello! I'm LucasMed, your AI assistant. How can I help you today?",
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
                ?.toDate()
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          });
          setMessages(msgs);
        },
        (error) => {
          console.error('Error fetching messages:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load chat history.',
          });
        }
      );

      return () => unsubscribe();
    } else if (!isAuthLoading) {
      setMessages([
        {
          id: crypto.randomUUID(),
          text: "Hello! I'm LucasMed, your AI assistant. Please log in to start a conversation.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user, isAuthLoading, toast]);

  const handleSendMessage = async (text: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to send a message.',
      });
      return;
    }

    const userMessage = {
      text,
      sender: 'user' as const,
      createdAt: serverTimestamp(),
    };
    
    setIsSending(true);

    try {
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, userMessage);

      const aiResponse: ChatAIConsultationOutput = await chatAIConsultation({ query: text });
      
      const aiMessage = {
        text: aiResponse.response,
        sender: 'ai' as const,
        createdAt: serverTimestamp(),
      };
      await addDoc(messagesCollection, aiMessage);
    } catch (error) {
      console.error('Error sending message or fetching AI response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response from AI. Please try again.',
      });
      const errorMessage = {
        text: "Sorry, I couldn't process your request right now. Please try again later.",
        sender: 'ai' as const,
        createdAt: serverTimestamp(),
      };
       const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.32))] shadow-2xl overflow-hidden rounded-lg border">
      <MessageList messages={messages} isLoadingAiResponse={isSending} />
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </Card>
  );
}
