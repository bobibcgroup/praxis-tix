import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoboticHeadProps {
  mousePosition?: { x: number; y: number };
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export function RoboticHead({ 
  mousePosition = { x: 0, y: 0 },
  isSpeaking = false,
  isThinking = false
}: RoboticHeadProps) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  
  // Eye scale for blinking
  const [eyeScale, setEyeScale] = useState({ left: 1, right: 1 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Smooth head rotation following mouse
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (headRef.current) {
      const targetX = mousePosition.y * 0.3;
      const targetY = mousePosition.x * 0.3;
      
      setHeadRotation(prev => ({
        x: prev.x + (targetX - prev.x) * 0.1,
        y: prev.y + (targetY - prev.y) * 0.1,
      }));
    }
  }, [mousePosition]);

  // Blink animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      // Scale eyes down on Y axis
      setEyeScale({ left: 0.1, right: 0.1 });
      
      setTimeout(() => {
        setEyeScale({ left: 1, right: 1 });
        setTimeout(() => {
          setIsBlinking(false);
        }, 100);
      }, 100);
    };

    // Random blink interval (3-6 seconds)
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      const timeoutId = setTimeout(() => {
        if (!isSpeaking && !isThinking) {
          blink();
        }
        scheduleNextBlink();
      }, delay);
      
      return () => clearTimeout(timeoutId);
    };

    const cleanup = scheduleNextBlink();
    return cleanup;
  }, [isSpeaking, isThinking]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (headRef.current) {
      headRef.current.rotation.x = headRotation.x;
      headRef.current.rotation.y = headRotation.y;
      
      // Subtle breathing animation
      const breathe = Math.sin(time * 0.5) * 0.02;
      headRef.current.position.y = breathe;
    }

    // Eye glow pulsing
    const eyeIntensity = isSpeaking ? 1.5 : isThinking ? 1.2 : 0.8;
    const pulse = Math.sin(time * 2) * 0.2 + eyeIntensity;
    
    if (leftEyeRef.current) {
      (leftEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (rightEyeRef.current) {
      (rightEyeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }

    // Jaw movement when speaking
    if (jawRef.current && isSpeaking) {
      const jawOpen = Math.sin(time * 4) * 0.1;
      jawRef.current.rotation.x = jawOpen;
    } else if (jawRef.current) {
      jawRef.current.rotation.x = 0;
    }
  });

  // Holographic material
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.8,
    transparent: true,
  });

  const jawMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.2,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  return (
    <group ref={headRef} position={[0, 0, 0]}>
      {/* Main head - rounded box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 1.4, 1]} />
        <primitive object={headMaterial} />
      </mesh>

      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.3, 0.2, 0.55]} scale={[1, eyeScale.left, 1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.3, 0.2, 0.55]} scale={[1, eyeScale.right, 1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Jaw - moves when speaking */}
      <mesh ref={jawRef} position={[0, -0.6, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.6]} />
        <primitive object={jawMaterial} />
      </mesh>

      {/* Decorative lines/panels */}
      <mesh position={[0, 0.4, 0.51]}>
        <boxGeometry args={[0.8, 0.05, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.6, 0, 0.51]}>
        <boxGeometry args={[0.05, 0.6, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.6, 0, 0.51]}>
        <boxGeometry args={[0.05, 0.6, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
