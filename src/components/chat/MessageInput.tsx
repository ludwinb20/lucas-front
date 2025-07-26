'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (messageText: string, imageFile?: File | null) => Promise<void>;
  isSending: boolean;
  placeholder?: string;
}

export function MessageInput({ onSendMessage, isSending, placeholder = "Habla con LucasMed..." }: MessageInputProps) {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((inputText.trim() || imageFile) && !isSending) {
      const textToSend = inputText.trim();
      setInputText('');
      setImageFile(null);
      setImagePreview(null);
      await onSendMessage(textToSend, imageFile);
      adjustTextareaHeight();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          className="flex-grow resize-none overflow-y-auto leading-tight"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSending}
          style={{ maxHeight: '120px' }}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
          disabled={isSending}
        />
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 rounded-full"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Adjuntar imagen"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={isSending || (!inputText.trim() && !imageFile)}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {imagePreview && (
        <div className="mt-2 flex items-center gap-2">
          <img src={imagePreview} alt="Vista previa" className="h-16 w-16 object-cover rounded border" />
          <Button type="button" size="icon" variant="ghost" onClick={removeImage} aria-label="Quitar imagen">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  );
}
