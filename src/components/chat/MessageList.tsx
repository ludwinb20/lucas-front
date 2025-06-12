// components/MessageList.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/types/chats";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  assistantId: string;
  isLoading: boolean;
  isAIThinking?: boolean; // Nuevo prop para indicar cuando la IA está respondiendo
}

export function MessageList({
  messages,
  isLoading,
  currentUserId,
  assistantId,
  isAIThinking = false,
}: MessageListProps) {
  const isUserMessage = (msg: Message) =>
    msg.senderType === "user" && msg.senderId === currentUserId;

  return (
    <div className="min-h-[33rem] max-h-[33rem] overflow-hidden">
      {" "}
      {/* Contenedor principal con altura fija */}
      <ScrollArea className="h-[33rem] w-full">
        {" "}
        {/* Altura igual al contenedor padre */}
        <div className="p-4 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 items-start",
                isUserMessage(msg) ? "justify-end" : "justify-start"
              )}
            >
              {/* Avatar (solo para mensajes de IA) */}
              {!isUserMessage(msg) && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}

              {/* Contenedor del mensaje */}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 space-y-1",
                  isUserMessage(msg)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {/* Nombre del remitente (opcional) */}
                {!isUserMessage(msg) && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {msg.senderId === assistantId ? "Asistente" : msg.senderId}
                  </p>
                )}

                {/* Texto del mensaje */}
                <p
                  className={cn(
                    "whitespace-pre-wrap",
                    isUserMessage(msg)
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {msg.text}
                </p>

                {/* Timestamp */}
                <p
                  className={cn(
                    "text-xs mt-1",
                    isUserMessage(msg)
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {format(new Date(msg.timestamp), "HH:mm", { locale: es })}
                </p>
              </div>

              {/* Avatar para mensajes de usuario */}
              {isUserMessage(msg) && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de carga para mensajes nuevos */}
          {(isLoading || isAIThinking) && (
            <div className="flex items-start gap-3 justify-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="space-y-2 max-w-[80%]">
                <Skeleton className="h-4 w-[200px] bg-muted" />
                <Skeleton className="h-3 w-[150px] bg-muted" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
