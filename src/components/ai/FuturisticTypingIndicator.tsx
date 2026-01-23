import { motion } from 'framer-motion';

interface FuturisticTypingIndicatorProps {
  type?: 'neural' | 'quantum' | 'helix';
}

export function FuturisticTypingIndicator({ type = 'neural' }: FuturisticTypingIndicatorProps) {
  if (type === 'neural') {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Neural network nodes */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="relative">
            {/* Connection line */}
            {i < 4 && (
              <div
                className="absolute top-1/2 left-full w-4 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-50"
                style={{ transform: 'translateY(-50%)' }}
              />
            )}
            
            {/* Node */}
            <motion.div
              className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-400"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          </div>
        ))}
        
        {/* Data flow lines */}
        <motion.div
          className="ml-2 h-4 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-green-500"
          animate={{
            scaleY: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      </div>
    );
  }

  if (type === 'quantum') {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full border-2 border-cyan-400"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-400"
              animate={{
                scale: [1, 2.5, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  // Helix type
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-purple-400"
          animate={{
            scaleY: [0.3, 1, 0.3],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}
