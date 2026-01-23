import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AICoreProps {
  aiState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  intensity?: number;
}

export function AICore({ aiState = 'idle', intensity = 1 }: AICoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // State-based rotation speed
    let rotationSpeed = 0.5;
    let pulseSpeed = 1;
    let pulseIntensity = 1;

    switch (aiState) {
      case 'listening':
        rotationSpeed = 0.8;
        pulseSpeed = 1.5;
        pulseIntensity = 1.3;
        break;
      case 'thinking':
        rotationSpeed = 1.5;
        pulseSpeed = 2;
        pulseIntensity = 1.8;
        break;
      case 'speaking':
        rotationSpeed = 1.2;
        pulseSpeed = 1.8;
        pulseIntensity = 1.5;
        break;
    }

    // Rotate core
    if (coreRef.current) {
      coreRef.current.rotation.x = time * rotationSpeed * 0.3;
      coreRef.current.rotation.y = time * rotationSpeed * 0.5;
      const pulse = Math.sin(time * pulseSpeed) * 0.1 + 1;
      coreRef.current.scale.setScalar(pulse * intensity * pulseIntensity);
    }

    // Rotate rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * rotationSpeed * 0.7;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = time * rotationSpeed * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * rotationSpeed * 0.6;
    }
  });

  return (
    <group>
      {/* Central core - Icosahedron */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={0x00f0ff}
          emissive={0x00f0ff}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Orbiting rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.8, 0.02, 8, 50]} />
        <meshBasicMaterial
          color={0xb026ff}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.8, 0.02, 8, 50]} />
        <meshBasicMaterial
          color={0xb026ff}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 3, 0]}>
        <torusGeometry args={[0.8, 0.02, 8, 50]} />
        <meshBasicMaterial
          color={0xb026ff}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
