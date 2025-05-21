import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConeObjectProps {
  position: [number, number, number];
  isSelected: boolean;
}

function ConeObject({ position, isSelected }: ConeObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Hover animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isSelected) {
        // Gentle floating animation when selected
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        
        // Pulsing glow effect
        if (materialRef.current) {
          materialRef.current.emissive = new THREE.Color(0x1a85ff);
          materialRef.current.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
      } else {
        // Reset position when not selected
        meshRef.current.position.y = position[1];
        
        // Reset material
        if (materialRef.current) {
          materialRef.current.emissive = new THREE.Color(0x000000);
          materialRef.current.emissiveIntensity = 0;
        }
      }
    }
  });

  return (
    <mesh 
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <coneGeometry args={[0.1, 0.2, 32]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={isSelected ? 0x4299e1 : 0x16a1b7}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

export default ConeObject;