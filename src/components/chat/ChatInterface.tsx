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
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    console.log(`%cCHAT: useEffect for messages triggered. Auth loading: ${isAuthLoading}, User: ${user?.uid}`, 'color: blue; font-weight: bold;');
    if (user) {
      console.log('CHAT: User exists. Setting up Firestore snapshot listener...');
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      const q = query(messagesCollection, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log(`%cCHAT: Snapshot received. Found ${querySnapshot.docs.length} messages.`, 'color: green;');
          const msgs: Message[] = [];
          
          const getWelcomeMessage = () => {
            if (userProfile?.name) {
                const msg = `¡Hola ${userProfile.name}! Soy LucasMed, tu asistente de IA. ¿Cómo puedo ayudarte hoy?`;
                console.log('CHAT: Welcome message with name:', msg);
                return msg;
            }
            const defaultMsg = "¡Hola! Soy LucasMed, tu asistente de IA. ¿Cómo puedo ayudarte hoy?";
            console.log('CHAT: Default welcome message:', defaultMsg);
            return defaultMsg;
          };

          if (querySnapshot.empty) {
             console.log('CHAT: No messages in history, adding welcome message.');
             msgs.push({
                id: crypto.randomUUID(),
                text: getWelcomeMessage(),
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
          console.error('%cERROR: Failed to fetch messages from Firestore snapshot.', 'color: red; font-size: 1.2em; font-weight: bold;', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load chat history.',
          });
        }
      );

      return () => {
        console.log('CHAT: Cleaning up Firestore snapshot listener.');
        unsubscribe();
      }
    } else if (!isAuthLoading) {
      console.log('CHAT: No user and not loading. Displaying default message for logged out state.');
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

  const handleSendMessage = async (text: string) => {
    console.log(`%cCHAT: handleSendMessage triggered with text: "${text}"`, 'color: blue; font-weight: bold;');
    if (!user) {
      console.error('%cERROR: Attempted to send message without a user.', 'color: red; font-size: 1.2em; font-weight: bold;');
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
      console.log('CHAT: Adding user message to Firestore...');
      const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, userMessage);
      console.log('%cCHAT: User message added. Calling AI...', 'color: green;');

      const aiResponse: ChatAIConsultationOutput = await chatAIConsultation({ query: text });
      console.log('%cCHAT: AI response received.', 'color: green;', aiResponse);
      
      const aiMessage = {
        text: aiResponse.response,
        sender: 'ai' as const,
        createdAt: serverTimestamp(),
      };
      console.log('CHAT: Adding AI message to Firestore...');
      await addDoc(messagesCollection, aiMessage);
      console.log('%cCHAT: AI message added.', 'color: green;');
    } catch (error) {
      console.error('%cERROR: Failed to send message or get AI response.', 'color: red; font-size: 1.2em; font-weight: bold;', error);
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
       console.log('CHAT: Adding error message to Firestore...');
       const messagesCollection = collection(db, 'users', user.uid, 'messages');
      await addDoc(messagesCollection, errorMessage);
    } finally {
      console.log('CHAT: Finished sending message. isSending set to false.');
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
