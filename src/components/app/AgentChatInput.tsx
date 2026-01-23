import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgentChatInputProps {
  onSendMessage: (text: string) => void;
  onVoiceRecord: () => void;
  onAttachment: () => void;
  isRecording?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const AgentChatInput = ({
  onSendMessage,
  onVoiceRecord,
  onAttachment,
  isRecording = false,
  disabled = false,
  placeholder = 'Tell me what you need...',
}: AgentChatInputProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 p-4 bg-background border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onAttachment}
          disabled={disabled}
          className="shrink-0"
          aria-label="Attach photo or video"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {input.trim() ? (
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={disabled}
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            onClick={onVoiceRecord}
            disabled={disabled}
            className="shrink-0"
            aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
          </Button>
        )}
      </div>
    </form>
  );
};
