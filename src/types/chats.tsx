// types/chat.ts
export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderType: "user" | "assistant";
  timestamp: number;
};

export type Chat = {
  id: string;
  participants: string[]; // IDs de usuarios
  createdAt: number;
  lastMessage?: Message;
  // Otros campos del chat según necesidad
};
