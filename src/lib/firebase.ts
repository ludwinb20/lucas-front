// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  off, 
  DataSnapshot,
  DatabaseReference,
  Database
} from "firebase/database";
import { app } from "@/hooks/useAuth"; // Asegúrate de que este archivo exporta la instancia de app


const database: Database = getDatabase(app);

// Funciones específicas para el chat con tipos
const chatRef = (chatId: string): DatabaseReference => ref(database, `chats/${chatId}/messages`);

export { database, chatRef, push, onValue, off, type DatabaseReference };