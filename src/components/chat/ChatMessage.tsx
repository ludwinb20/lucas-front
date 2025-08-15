import type { Message } from './ChatInterface'; // Assuming Message type will be defined here
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import React from 'react';

function renderMarkdown(text: string): React.ReactNode {
  // Very lightweight markdown: bold **text**, italic *text*, unordered lists, and paragraphs
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul className="list-disc pl-5 space-y-1" key={`ul-${elements.length}`}>
          {listBuffer.map((item, idx) => (
            <li key={idx}>{inlineMd(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const inlineMd = (s: string) => {
    // bold
    let parts: (string | React.ReactNode)[] = [];
    let remaining = s;

    const pushItalic = (str: string) => {
      const italicParts: (string | React.ReactNode)[] = [];
      let r = str;
      while (true) {
        const i = r.indexOf('*');
        if (i === -1) { italicParts.push(r); break; }
        const j = r.indexOf('*', i + 1);
        if (j === -1) { italicParts.push(r); break; }
        italicParts.push(r.slice(0, i));
        italicParts.push(<em key={`em-${italicParts.length}`}>{r.slice(i + 1, j)}</em>);
        r = r.slice(j + 1);
      }
      return italicParts;
    };

    while (true) {
      const i = remaining.indexOf('**');
      if (i === -1) { parts.push(...pushItalic(remaining)); break; }
      const j = remaining.indexOf('**', i + 2);
      if (j === -1) { parts.push(...pushItalic(remaining)); break; }
      parts.push(...pushItalic(remaining.slice(0, i)));
      parts.push(<strong key={`b-${parts.length}`}>{remaining.slice(i + 2, j)}</strong>);
      remaining = remaining.slice(j + 2);
    }

    return parts;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bullet = /^[-*]\s+/.test(trimmed);
    if (bullet) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }
    flushList();
    if (trimmed.length === 0) {
      elements.push(<div className="h-2" key={`br-${elements.length}`} />);
    } else {
      elements.push(
        <p className="text-sm whitespace-pre-wrap" key={`p-${elements.length}`}>
          {inlineMd(line)}
        </p>
      );
    }
  }
  flushList();
  return <>{elements}</>;
}

export function ChatMessage({ message }: { message: Message }) {
  const { userProfile } = useAuth();
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300 my-4 ${
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
        <div className="prose prose-sm dark:prose-invert max-w-none [&_strong]:text-lg [&_em]:font-bold">
          {renderMarkdown(message.text || '')}
        </div>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Imagen adjunta"
            className="mt-2 max-w-xs max-h-48 rounded border"
          />
        )}
        {message.timestamp && (
          <p className={`mt-1 text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {message.timestamp}
          </p>
        )}
      </div>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
