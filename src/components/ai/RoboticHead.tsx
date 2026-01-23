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
    const targetX = mousePosition.y * 0.3;
    const targetY = mousePosition.x * 0.3;
    
    setHeadRotation(prev => ({
      x: prev.x + (targetX - prev.x) * 0.1,
      y: prev.y + (targetY - prev.y) * 0.1,
    }));
  }, [mousePosition]);

  // Blink animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
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
    
    if (leftEyeRef.current && leftEyeRef.current.material) {
      const material = leftEyeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = pulse;
    }
    if (rightEyeRef.current && rightEyeRef.current.material) {
      const material = rightEyeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = pulse;
    }

    // Jaw movement when speaking
    if (jawRef.current && isSpeaking) {
      const jawOpen = Math.sin(time * 4) * 0.1;
      jawRef.current.rotation.x = jawOpen;
    } else if (jawRef.current) {
      jawRef.current.rotation.x = 0;
    }
  });

  // Create materials once
  const headMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    })
  ).current;

  const eyeMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.0,
      transparent: true,
    })
  ).current;

  const jawMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    })
  ).current;

  return (
    <group ref={headRef} position={[0, 0, 0]}>
      {/* Main head - larger and more visible */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2.4, 1.8]} />
        <meshStandardMaterial
          color={0x00f0ff}
          emissive={0x00f0ff}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Left eye - larger */}
      <mesh ref={leftEyeRef} position={[-0.5, 0.5, 1.0]} scale={[1, eyeScale.left, 1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={0x00f0ff}
          emissive={0x00f0ff}
          emissiveIntensity={1.0}
          transparent
        />
      </mesh>

      {/* Right eye - larger */}
      <mesh ref={rightEyeRef} position={[0.5, 0.5, 1.0]} scale={[1, eyeScale.right, 1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={0x00f0ff}
          emissive={0x00f0ff}
          emissiveIntensity={1.0}
          transparent
        />
      </mesh>

      {/* Jaw - moves when speaking */}
      <mesh ref={jawRef} position={[0, -1.2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.4, 0.5, 1.2]} />
        <meshStandardMaterial
          color={0x00f0ff}
          emissive={0x00f0ff}
          emissiveIntensity={0.3}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Decorative lines/panels - more visible */}
      <mesh position={[0, 0.8, 1.01]}>
        <boxGeometry args={[1.4, 0.08, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-1.0, 0, 1.01]}>
        <boxGeometry args={[0.08, 1.0, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.0, 0, 1.01]}>
        <boxGeometry args={[0.08, 1.0, 0.02]} />
        <meshStandardMaterial color={0xb026ff} emissive={0xb026ff} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
