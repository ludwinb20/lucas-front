"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";

interface MessageListProps {
  messages: Message[];
  isLoadingAiResponse: boolean;
  loadMoreMessages: () => Promise<Message[]>;
  isStreamingPending?: boolean;
}

const INITIAL_LOAD = 15;

export function MessageList({ messages, isLoadingAiResponse, loadMoreMessages, isStreamingPending = false }: MessageListProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Cargar los últimos mensajes al inicio en orden cronológico
    const initialMessages = messages;
    setDisplayedMessages(initialMessages);
  }, [messages]);

  useEffect(() => {
    // Mantener el scroll en el final mientras llegan tokens (con inverse + column-reverse usar top=0)
    if (!isLoadingMore && containerRef.current) {
      requestAnimationFrame(() => {
        try {
          containerRef.current?.scrollTo({ top: 0 });
        } catch {}
      });
    }
  }, [displayedMessages, isLoadingMore]);

  useEffect(() => {
    // Limpiar timeout si el componente se desmonta
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const fetchMoreData = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const moreMessages = await loadMoreMessages();
    if (moreMessages.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }
    setDisplayedMessages((prev) => {
      return [...prev, ...moreMessages];
    });
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    setIsLoadingMore(false);
    return;
  };

  return (
    <div
      id="scrollableDiv"
      ref={containerRef}
      style={{
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column-reverse",
      }}
    >
      <InfiniteScroll
        dataLength={displayedMessages.length}
        next={() => {
          fetchMoreData();
        }}
        hasMore={hasMore}
        inverse={true}
        loader={
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
            <span className="text-sm text-muted-foreground font-medium">Cargando más mensajes...</span>
          </div>
        }
        scrollableTarget="scrollableDiv"
        style={{ display: "flex", flexDirection: "column-reverse", paddingRight: "1rem", paddingLeft: "1rem", paddingBottom: "1rem", paddingTop: "1rem"}}
      >
        {/* Loader de espera de primer token: renderizado antes para que aparezca al fondo con column-reverse */}
        {isStreamingPending && (
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

        {displayedMessages.map((msg) => {
          return <ChatMessage key={msg.id} message={msg} />;
        })}
      </InfiniteScroll>
    </div>
  );
}
