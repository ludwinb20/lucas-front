// components/ChatContainer.tsx
"use client";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { generateAIResponse } from "@/lib/ai"; // Tu módulo de generación de IA
import { ChatHeader } from "./ChatHeader";

interface ChatContainerProps {
  chatId: string;
  currentUserId?: string;
  assistantId?: string; // Nuevo prop para el ID del asistente
}

export function ChatContainer({
  chatId,
  currentUserId,
  assistantId = "assistant1", // Valor por defecto
}: ChatContainerProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    sendAIResponse, // Nueva función del hook
    error,
  } = useChat(chatId);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error en el chat",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error en el chat:", error);
    }
  }, [error]);

  const handleSend = async (messageData: {
    text: string;
    senderId: string;
    senderType: "user" | "assistant";
  }) => {
    try {
      // Envía el mensaje del usuario
      await sendMessage({
        text: messageData.text,
        senderId: currentUserId || "",
        senderType: "user",
      });

      // Genera y envía la respuesta de IA
      const aiResponse = await generateAIResponse(messageData.text);
      await sendAIResponse(aiResponse);
    } catch (err) {
      toast({
        title: "Error al enviar mensaje",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      console.error("Error en el flujo del chat:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      {/* Contenido existente */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          currentUserId={currentUserId}
          assistantId={assistantId}
        />
      </div>

      <MessageInput
        onSend={(data) =>
          handleSend({
            ...data,
            senderId: currentUserId || "",
            senderType: "user",
          })
        }
        isSending={isLoading}
        currentUserId={currentUserId || ""}
        disabled={!chatId || !currentUserId}
      />
    </div>
  );
}
