// components/MessageInput.tsx
'use client';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: { 
    text: string; 
    senderId: string;
    senderType: 'user' | 'assistant'; 
  }) => Promise<void>;
  isSending: boolean;
  currentUserId: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ 
  onSend, 
  isSending, 
  currentUserId,
  placeholder = 'Escribe tu mensaje...',
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-ajustar altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      try {
        await onSend({
          text: message.trim(),
          senderId: currentUserId,
          senderType: 'user' // Fijo para el input del usuario
        });
        setMessage('');
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4"
    >
      <div className="relative flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className="min-h-[40px] resize-none pr-10"
          rows={1}
          disabled={disabled}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          variant={message.trim() ? 'default' : 'ghost'}
          className="absolute right-2 bottom-2 h-8 w-8"
          disabled={!message.trim() || isSending || disabled}
          aria-label="Enviar mensaje"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}