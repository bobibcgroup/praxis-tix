import { useState, useRef } from 'react';
import { Send, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

interface MinimalInputProps {
  onSendMessage: (text: string) => void;
  onVoiceRecord: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MinimalInput({
  onSendMessage,
  onVoiceRecord,
  disabled = false,
  placeholder = 'Ask me anything...',
}: MinimalInputProps) {
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
    <motion.form
      onSubmit={handleSubmit}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-xl px-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative">
        {/* Input field */}
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Glowing border on focus */}
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-green-500 blur-sm opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            />
          )}
          
          {/* Glass input */}
          <div
            className={`relative rounded-full bg-black/30 backdrop-blur-xl border transition-all duration-300 ${
              isFocused
                ? 'border-cyan-500/60 shadow-[0_0_30px_rgba(0,240,255,0.3)]'
                : 'border-cyan-500/20'
            }`}
          >
            <div className="flex items-center px-6 py-4 gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent text-cyan-100 placeholder:text-cyan-500/50 focus:outline-none text-sm md:text-base"
              aria-label="Message input"
              aria-describedby="input-help"
            />
            <div id="input-help" className="sr-only">
              Type your message and press Enter to send
            </div>
              
              {input.trim() ? (
                <motion.button
                  type="submit"
                  disabled={disabled}
                  className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center hover:scale-110 transition-transform"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={onVoiceRecord}
                  disabled={disabled}
                  className="shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center hover:border-cyan-500/60 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mic className="w-5 h-5 text-cyan-400" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.form>
  );
}
