import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  particleCount?: number;
  mousePosition?: { x: number; y: number };
  aiState?: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export function ParticleField({ 
  particleCount = 1500,
  mousePosition = { x: 0, y: 0 },
  aiState = 'idle'
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const connectionLinesRef = useRef<THREE.LineSegments>(null);

  // Create particles
  const { positions, colors, connections } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const connectionPairs: number[] = [];

    // AI color palette
    const colorPalette = [
      [0, 240, 255], // cyan
      [176, 38, 255], // purple
      [0, 255, 136], // green
    ];

    for (let i = 0; i < particleCount; i++) {
      // Random positions in 3D space
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Random color from palette
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const [r, g, b] = colorPalette[colorIndex];
      colors[i * 3] = r / 255;
      colors[i * 3 + 1] = g / 255;
      colors[i * 3 + 2] = b / 255;
    }

    // Create connections between nearby particles
    const connectionDistance = 2.5;
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < connectionDistance) {
          connectionPairs.push(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
            positions[j * 3],
            positions[j * 3 + 1],
            positions[j * 3 + 2]
          );
        }
      }
    }

    return {
      positions,
      colors,
      connections: new Float32Array(connectionPairs),
    };
  }, [particleCount]);

  // Animate particles
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    // State-based intensity
    let intensity = 1;
    let speed = 0.3;
    switch (aiState) {
      case 'listening':
        intensity = 1.3;
        speed = 0.5;
        break;
      case 'thinking':
        intensity = 1.8;
        speed = 0.8;
        break;
      case 'speaking':
        intensity = 1.5;
        speed = 0.6;
        break;
    }

    // Animate particles with gentle floating
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] += Math.sin(time * speed + i) * 0.001 * intensity;
      positions[i3 + 1] += Math.cos(time * speed * 0.7 + i) * 0.001 * intensity;
      positions[i3 + 2] += Math.sin(time * speed * 0.5 + i * 0.5) * 0.001 * intensity;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Mouse parallax effect
    if (meshRef.current) {
      meshRef.current.rotation.x += (mousePosition.y * 0.1 - meshRef.current.rotation.x) * 0.05;
      meshRef.current.rotation.y += (mousePosition.x * 0.1 - meshRef.current.rotation.y) * 0.05;
    }

    // Update connection lines
    if (connectionLinesRef.current) {
      connectionLinesRef.current.rotation.x = meshRef.current.rotation.x;
      connectionLinesRef.current.rotation.y = meshRef.current.rotation.y;
    }
  });

  return (
    <>
      {/* Particles */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      {connections.length > 0 && (
        <lineSegments ref={connectionLinesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={connections.length / 3}
              array={connections}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={0x00f0ff}
            transparent
            opacity={0.2}
          />
        </lineSegments>
      )}
    </>
  );
}
