import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MinimalResponseDisplayProps {
  text: string;
  isVisible: boolean;
  isTyping?: boolean;
}

export function MinimalResponseDisplay({ 
  text, 
  isVisible,
  isTyping = false 
}: MinimalResponseDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (isVisible && text) {
      setDisplayedText('');
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 15); // Fast typing speed

      return () => clearInterval(interval);
    } else if (!isVisible) {
      setDisplayedText('');
    }
  }, [text, isVisible]);

  if (!isVisible && !displayedText) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="absolute top-[55%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4"
        >
          <div className="text-center">
            <motion.p
              className="text-cyan-100 text-lg md:text-xl leading-relaxed font-light"
              style={{
                textShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
              }}
            >
              {displayedText}
              {isTyping && (
                <motion.span
                  className="inline-block w-0.5 h-6 bg-cyan-400 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
