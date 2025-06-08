import type { Message } from './ChatInterface'; // Assuming Message type will be defined here
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-xl px-3 py-2 shadow-md ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        {message.timestamp && (
          <p className={`mt-1 text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {message.timestamp}
          </p>
        )}
      </div>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
