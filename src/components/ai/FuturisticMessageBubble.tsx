import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FuturisticMessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  isNew?: boolean;
}

export function FuturisticMessageBubble({ 
  content, 
  role, 
  isNew = false 
}: FuturisticMessageBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isNew && role === 'assistant') {
      setIsAnimating(true);
      let currentIndex = 0;
      setDisplayedText('');
      
      const interval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedText(content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 20); // 20ms per character

      return () => clearInterval(interval);
    } else {
      setDisplayedText(content);
      setIsAnimating(false);
    }
  }, [content, isNew, role]);

  const isUser = role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={isNew ? { opacity: 0, y: 20, filter: 'blur(10px)', scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground'
            : 'futuristic-ai-message'
        }`}
      >
        {/* Holographic shine effect for AI messages */}
        {!isUser && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{
                transform: 'skewX(-20deg)',
                width: '200%',
                height: '200%',
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          </div>
        )}

        {/* Content */}
        <p className="relative text-sm whitespace-pre-wrap break-words leading-relaxed">
          {displayedText}
          {isAnimating && (
            <motion.span
              className="inline-block w-0.5 h-4 bg-cyan-400 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </p>

        {/* Glow effect */}
        {!isUser && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-green-500/20 blur-xl -z-10" />
        )}
      </div>
    </motion.div>
  );
}
