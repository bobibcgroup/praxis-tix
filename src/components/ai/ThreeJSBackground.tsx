import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleField } from './ParticleField';
import { AICore } from './AICore';

interface ThreeJSBackgroundProps {
  aiState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  particleCount?: number;
}

export function ThreeJSBackground({ 
  aiState = 'idle',
  particleCount = 1500 
}: ThreeJSBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      setMousePosition({
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 opacity-40">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#00f0ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.4} color="#b026ff" />
          
          {/* Particle field */}
          <ParticleField 
            particleCount={particleCount} 
            mousePosition={mousePosition}
            aiState={aiState}
          />
          
          {/* AI Core (positioned behind content) */}
          <AICore aiState={aiState} intensity={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}
