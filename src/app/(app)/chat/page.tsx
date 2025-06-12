'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import { ChatContainer } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const [chatId, setChatId] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const db = getDatabase();
        
        try {
          // Accedemos directamente al chat del usuario usando su UID como ID
          const userChatRef = ref(db, `chats/${user.uid}`);
          const snapshot = await get(userChatRef);
          
          if (snapshot.exists()) {
            setChatId(user.uid);
          } else {
            // Crear nuevo chat usando el UID como clave
            await set(userChatRef, {
              userId: user.uid,
              createdAt: new Date().toISOString(),
              messages: {}
            });
            setChatId(user.uid);
          }
        } catch (error) {
          console.error("Error al manejar el chat:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  if (!chatId) return <div>Cargando chat...</div>;

  return (
    <div className="h-full">
      <ChatContainer chatId={chatId} currentUserId={auth.currentUser?.uid} />
    </div>
  );
}