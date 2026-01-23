import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HumanoidHeadProps {
  mousePosition?: { x: number; y: number };
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export function HumanoidHead({ 
  mousePosition = { x: 0, y: 0 },
  isSpeaking = false,
  isThinking = false
}: HumanoidHeadProps) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  
  // Eye scale for blinking
  const [eyeScale, setEyeScale] = useState({ left: 1, right: 1 });

  // Smooth head rotation following mouse
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const targetX = mousePosition.y * 0.2;
    const targetY = mousePosition.x * 0.2;
    
    setHeadRotation(prev => ({
      x: prev.x + (targetX - prev.x) * 0.1,
      y: prev.y + (targetY - prev.y) * 0.1,
    }));
  }, [mousePosition]);

  // Blink animation
  useEffect(() => {
    const blink = () => {
      setEyeScale({ left: 0.1, right: 0.1 });
      
      setTimeout(() => {
        setEyeScale({ left: 1, right: 1 });
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

    scheduleNextBlink();
  }, [isSpeaking, isThinking]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (headRef.current) {
      headRef.current.rotation.x = headRotation.x;
      headRef.current.rotation.y = headRotation.y;
      
      // Subtle breathing animation
      const breathe = Math.sin(time * 0.5) * 0.01;
      headRef.current.position.y = breathe;
    }

    // Eye glow pulsing
    const eyeIntensity = isSpeaking ? 0.6 : isThinking ? 0.5 : 0.3;
    
    if (leftEyeRef.current && leftEyeRef.current.material) {
      const material = leftEyeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = eyeIntensity + Math.sin(time * 2) * 0.1;
    }
    if (rightEyeRef.current && rightEyeRef.current.material) {
      const material = rightEyeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = eyeIntensity + Math.sin(time * 2) * 0.1;
    }

    // Subtle jaw movement when speaking
    if (jawRef.current && isSpeaking) {
      const jawOpen = Math.sin(time * 4) * 0.05;
      jawRef.current.position.y = -1.1 + jawOpen;
    } else if (jawRef.current) {
      jawRef.current.position.y = -1.1;
    }
  });

  // Create materials
  const headMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      metalness: 0.1,
      roughness: 0.6,
      transparent: false,
    })
  ).current;

  const eyeMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x60a5fa,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    })
  ).current;

  return (
    <group ref={headRef} position={[0, 0, 0]}>
      {/* Main head - smooth sphere, elongated vertically */}
      <mesh position={[0, 0, 0]} scale={[1, 1.2, 0.9]}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <primitive object={headMaterial} />
      </mesh>

      {/* Left eye - almond shaped (flattened sphere) */}
      <mesh 
        ref={leftEyeRef} 
        position={[-0.3, 0.2, 1.05]} 
        scale={[1, eyeScale.left * 0.6, 0.3]}
        rotation={[0, 0, 0]}
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Right eye - almond shaped */}
      <mesh 
        ref={rightEyeRef} 
        position={[0.3, 0.2, 1.05]} 
        scale={[1, eyeScale.right * 0.6, 0.3]}
        rotation={[0, 0, 0]}
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <primitive object={eyeMaterial} />
      </mesh>

      {/* Subtle neck connection */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 32]} />
        <meshStandardMaterial
          color={0xf0f0f0}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Jaw - subtle movement when speaking */}
      <mesh ref={jawRef} position={[0, -1.1, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={0xf0f0f0}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}
