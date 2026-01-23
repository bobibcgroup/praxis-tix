import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface FuturisticSuggestionPillsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export function FuturisticSuggestionPills({ 
  prompts, 
  onSelectPrompt 
}: FuturisticSuggestionPillsProps) {
  return (
    <div className="px-4 pb-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {prompts.map((prompt, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onSelectPrompt(prompt)}
              className="relative futuristic-pill px-6 py-2.5 rounded-full text-sm font-medium text-cyan-100 whitespace-nowrap overflow-hidden group"
            >
              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              
              {/* Background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm border border-cyan-500/30 group-hover:border-cyan-500/60 transition-all duration-300" />
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
              
              {/* Text */}
              <span className="relative z-10">{prompt}</span>
              
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/0 group-hover:bg-cyan-500/20 blur-xl transition-all duration-300" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
