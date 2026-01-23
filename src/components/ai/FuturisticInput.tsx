import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface FuturisticInputProps {
  onSendMessage: (text: string) => void;
  onVoiceRecord: () => void;
  onAttachment: () => void;
  isRecording?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function FuturisticInput({
  onSendMessage,
  onVoiceRecord,
  onAttachment,
  isRecording = false,
  disabled = false,
  placeholder = 'Tell me what you need...',
}: FuturisticInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
      <div className="flex items-end gap-2 p-3 md:p-4 futuristic-input-container rounded-2xl">
        {/* Attachment button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttachment}
            disabled={disabled}
            className="shrink-0 futuristic-icon-button"
            aria-label="Attach photo or video"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Input field */}
        <div className="flex-1 relative">
          <motion.div
            className="relative"
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Animated border gradient */}
            {isFocused && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-green-500 p-[1px]">
                <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-xl" />
              </div>
            )}
            
            {/* Glass background */}
            <div className={`relative rounded-2xl bg-black/40 backdrop-blur-xl border transition-all duration-300 ${
              isFocused 
                ? 'border-cyan-500/60 shadow-[0_0_30px_rgba(0,240,255,0.3),inset_0_0_20px_rgba(0,240,255,0.1)]' 
                : 'border-cyan-500/20'
            }`} />
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className="absolute inset-0 w-full px-4 py-3 bg-transparent text-cyan-100 placeholder:text-cyan-500/50 focus:outline-none text-sm rounded-2xl z-10"
            />
          </motion.div>
        </div>

        {/* Send/Voice button */}
        {input.trim() ? (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              type="submit"
              variant="default"
              size="icon"
              disabled={disabled}
              className="shrink-0 futuristic-icon-button bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'ghost'}
              size="icon"
              onClick={onVoiceRecord}
              disabled={disabled}
              className={`shrink-0 futuristic-icon-button ${isRecording ? 'animate-pulse' : ''}`}
              aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </form>
  );
}
