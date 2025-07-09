'use client';
import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { chatAIConsultation, type ChatAIConsultationOutput } from '@/ai/flows/chat-ai-consultation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Initial greeting from AI
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        text: "Hello! I'm LucasMed, your AI assistant. How can I help you today?",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsSending(true);

    try {
      const aiResponse: ChatAIConsultationOutput = await chatAIConsultation({ query: text });
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: aiResponse.response,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get response from AI. Please try again.',
      });
      // Optionally add an error message to the chat
       const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: "Sorry, I couldn't process your request right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-theme(spacing.28))] md:h-[calc(100vh-theme(spacing.32))] shadow-2xl overflow-hidden rounded-lg border">
      {/* Subtract header height and some padding. Adjust if header height changes. */}
      <MessageList messages={messages} isLoadingAiResponse={isSending} />
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </Card>
  );
}
