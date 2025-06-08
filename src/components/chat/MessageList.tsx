'use client';
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { Message } from './ChatInterface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoadingAiResponse: boolean;
}

export function MessageList({ messages, isLoadingAiResponse }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoadingAiResponse]);

  return (
    <ScrollArea className="flex-grow" ref={scrollAreaRef}>
      <div className="p-4 space-y-4 h-full" ref={viewportRef}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoadingAiResponse && (
          <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300 justify-start">
            <Skeleton className="h-8 w-8 rounded-full bg-accent" />
            <div className="max-w-[70%] rounded-xl px-3 py-2 shadow-md bg-card text-card-foreground rounded-bl-none">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-75" />
                <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-150" />
                <Skeleton className="h-3 w-3 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
