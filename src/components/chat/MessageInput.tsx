'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (messageText: string) => Promise<void>;
  isSending: boolean;
}

export function MessageInput({ onSendMessage, isSending }: MessageInputProps) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputText.trim() && !isSending) {
      const textToSend = inputText.trim();
      setInputText(''); // Clear input immediately for better UX
      await onSendMessage(textToSend);
      // Textarea auto-resize might need to be handled after clearing if it doesn't reset automatically
      adjustTextareaHeight();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);
  

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 border-t border-border bg-background p-3 md:p-4"
    >
      <div className="relative flex items-end space-x-2">
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask LucasMed anything..."
          className="flex-grow resize-none overflow-y-auto pr-12 leading-tight"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSending}
          style={{ maxHeight: '120px' }} /* Corresponds to approx 5 rows */
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
          disabled={isSending || !inputText.trim()}
          aria-label="Send message"
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
