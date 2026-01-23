import { Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { HumanoidHead } from './HumanoidHead';
import { ParticleField } from './ParticleField';
import { VoiceWave } from './VoiceWave';

interface MinimalAISceneProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  particleCount?: number;
}

// Detect mobile device
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function MinimalAIScene({ 
  isSpeaking = false,
  isThinking = false,
  particleCount = 800 
}: MinimalAISceneProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Performance-optimized settings
  const canvasSettings = useMemo(() => ({
    shadows: false, // Disable shadows for better performance
    antialias: window.devicePixelRatio === 1, // Only on non-retina
    powerPreference: 'high-performance' as const,
    pixelRatio: Math.min(window.devicePixelRatio, 2), // Cap at 2x
  }), []);

  useEffect(() => {
    // Mouse tracking for desktop
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      setMousePosition({
        x: (e.clientX - centerX) / centerX,
        y: (centerY - e.clientY) / centerY, // Inverted Y for natural movement
      });
    };

    // Gyroscope for mobile
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // beta: -180 to 180 (X axis, pitch)
        // gamma: -90 to 90 (Y axis, roll)
        setMousePosition({
          x: (e.gamma + 90) / 180, // Normalize to 0-1
          y: (e.beta + 180) / 360, // Normalize to 0-1
        });
      }
    };

    if (isMobileDevice) {
      // Request permission for device orientation on iOS
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {
            // Fallback to touch if permission denied
            window.addEventListener('touchmove', (e) => {
              const touch = e.touches[0];
              if (touch) {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                setMousePosition({
                  x: (touch.clientX - centerX) / centerX,
                  y: (centerY - touch.clientY) / centerY,
                });
              }
            });
          });
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    } else {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-[50vh] min-h-[400px] z-0" 
      aria-label="AI Assistant 3D Avatar" 
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: canvasSettings.antialias,
          powerPreference: canvasSettings.powerPreference,
        }}
        dpr={[1, canvasSettings.pixelRatio]}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
          
          {/* Soft lighting for humanoid appearance */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 5]} intensity={0.5} />
          <directionalLight position={[-2, 1, -3]} intensity={0.3} />
          
          {/* Subtle particle background */}
          <ParticleField 
            particleCount={particleCount} 
            mousePosition={mousePosition}
            aiState={isThinking ? 'thinking' : isSpeaking ? 'speaking' : 'idle'}
          />
          
          {/* Humanoid Head */}
          <HumanoidHead 
            mousePosition={mousePosition}
            isSpeaking={isSpeaking}
            isThinking={isThinking}
          />
          
          {/* Voice Wave Visualization */}
          <VoiceWave isActive={isSpeaking} intensity={isSpeaking ? 1 : 0} />
          
          <OrbitControls enabled={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
