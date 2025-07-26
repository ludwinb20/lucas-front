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
}

const INITIAL_LOAD = 15;

export function MessageList({ messages, isLoadingAiResponse, loadMoreMessages }: MessageListProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cargar los últimos mensajes al inicio en orden cronológico
    const initialMessages = messages;
    console.log("initialMessages", initialMessages);
    setDisplayedMessages(initialMessages);
    // setHasMore(initialMessages.length < messages.length);
  }, [messages]);

  useEffect(() => {
    // Limpiar timeout si el componente se desmonta
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const fetchMoreData = async () => {
    console.log("isLoadingMore", isLoadingMore);
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    console.log("fetchMoreData");
    const moreMessages = await loadMoreMessages();
    console.log("moreMessages", moreMessages);
    if (moreMessages.length === 0) {
      console.log("no more messages");
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }
    console.log("setting displayedMessages");
    console.log(moreMessages);
    console.log(displayedMessages);
    setDisplayedMessages((prev) => {
      // Ya no es necesario filtrar ids repetidos
      return [...prev, ...moreMessages];
    });
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    setIsLoadingMore(false);
    return;
  };

  return (
    <div
      id="scrollableDiv"
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
          console.log("next");
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
        {displayedMessages.map((msg) => (
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
      </InfiniteScroll>
    </div>
  );
}
