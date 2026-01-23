import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface AIPresenceOrbProps {
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  intensity?: number;
}

export function AIPresenceOrb({ state = 'idle', intensity = 1 }: AIPresenceOrbProps) {
  // State-based animation variants
  const getAnimationVariants = () => {
    const base = {
      scale: 1,
      opacity: 0.8,
    };

    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 1.5, repeat: Infinity },
        };
      case 'thinking':
        return {
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 0.8, repeat: Infinity },
        };
      case 'speaking':
        return {
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
          transition: { duration: 1, repeat: Infinity },
        };
      default:
        return {
          scale: [1, 1.05, 1],
          opacity: [0.8, 0.9, 0.8],
          transition: { duration: 2, repeat: Infinity },
        };
    }
  };

  const getGlowIntensity = () => {
    switch (state) {
      case 'listening':
        return '0 0 30px rgba(0, 240, 255, 0.6)';
      case 'thinking':
        return '0 0 40px rgba(176, 38, 255, 0.8)';
      case 'speaking':
        return '0 0 35px rgba(0, 255, 136, 0.7)';
      default:
        return '0 0 20px rgba(0, 240, 255, 0.4)';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <motion.div
        className="absolute w-16 h-16 rounded-full border-2 border-cyan-500/30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-purple-500/20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />

      {/* Central orb */}
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, rgba(0, 240, 255, 0.3), rgba(176, 38, 255, 0.2))`,
          boxShadow: getGlowIntensity(),
        }}
        animate={getAnimationVariants()}
      >
        {/* Inner core */}
        <motion.div
          className="w-8 h-8 rounded-full"
          style={{
            background: `linear-gradient(135deg, #00f0ff, #b026ff)`,
            filter: 'blur(4px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Icon */}
        <Bot className="absolute w-5 h-5 text-white/90" />
      </motion.div>

      {/* Particle effects */}
      {state === 'thinking' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-cyan-400"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 6) * 30],
                y: [0, Math.sin((i * Math.PI * 2) / 6) * 30],
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
