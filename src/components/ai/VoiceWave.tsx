import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VoiceWaveProps {
  isActive: boolean;
  intensity?: number;
}

export function VoiceWave({ isActive, intensity = 1 }: VoiceWaveProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Shader for wave effect
  const shaderMaterial = useMemo(() => {
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uIntensity;
      uniform bool uActive;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        if (!uActive) {
          discard;
        }
        
        // Wave pattern
        float wave = sin(vUv.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
        wave += sin(vUv.x * 15.0 + uTime * 3.0) * 0.3;
        wave += sin(vUv.x * 5.0 + uTime * 1.0) * 0.2;
        
        // Gradient from center
        float dist = abs(vUv.y - 0.5) * 2.0;
        float alpha = (1.0 - dist) * wave * uIntensity;
        
        // Cyan to purple gradient
        vec3 color1 = vec3(0.0, 0.94, 1.0); // Cyan
        vec3 color2 = vec3(0.69, 0.15, 1.0); // Purple
        
        vec3 color = mix(color1, color2, vUv.x);
        
        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uActive: { value: isActive },
      },
    });
  }, [isActive, intensity]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uIntensity.value = intensity;
      materialRef.current.uniforms.uActive.value = isActive;
    }
  });

  if (!isActive) return null;

  return (
    <mesh ref={meshRef} position={[0, -0.5, 1]} visible={isActive}>
      <planeGeometry args={[1.5, 0.3, 32, 8]} />
      <primitive ref={materialRef} object={shaderMaterial} />
    </mesh>
  );
}
