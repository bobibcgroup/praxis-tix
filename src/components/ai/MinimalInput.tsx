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
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative">
        {/* Input field */}
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Input container */}
          <div
            className={`relative rounded-full bg-white dark:bg-gray-900 border-2 transition-all duration-300 ${
              isFocused
                ? 'border-blue-500 dark:border-blue-400 shadow-lg'
                : 'border-gray-200 dark:border-gray-700'
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
                className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-sm md:text-base"
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
                  className="shrink-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={onVoiceRecord}
                  disabled={disabled}
                  className="shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.form>
  );
}
