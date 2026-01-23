import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { RoboticHead } from './RoboticHead';
import { ParticleField } from './ParticleField';

interface MinimalAISceneProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  particleCount?: number;
}

export function MinimalAIScene({ 
  isSpeaking = false,
  isThinking = false,
  particleCount = 800 
}: MinimalAISceneProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      setMousePosition({
        x: (e.clientX - centerX) / centerX,
        y: (centerY - e.clientY) / centerY, // Inverted Y for natural movement
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.6} color="#00f0ff" />
          <pointLight position={[-5, -5, -5]} intensity={0.3} color="#b026ff" />
          <directionalLight position={[0, 5, 5]} intensity={0.5} />
          
          {/* Subtle particle background */}
          <ParticleField 
            particleCount={particleCount} 
            mousePosition={mousePosition}
            aiState={isThinking ? 'thinking' : isSpeaking ? 'speaking' : 'idle'}
          />
          
          {/* Robotic Head */}
          <RoboticHead 
            mousePosition={mousePosition}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
          />
          
          <OrbitControls enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
