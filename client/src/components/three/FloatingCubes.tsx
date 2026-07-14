import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A ring of small geometric shapes (icosahedrons + octahedrons) slowly
 * orbiting the central torus knot, alternating indigo and violet.
 */
export default function FloatingCubes() {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 4.2;
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle * 1.5) * 1.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        type: i % 2 === 0 ? 'ico' : 'octa',
        color: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
        scale: 0.35 + (i % 3) * 0.12,
        speed: 0.3 + (i % 4) * 0.1,
      };
    });
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x += delta * (0.4 + i * 0.05);
        child.rotation.y += delta * (0.3 + i * 0.04);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <mesh key={i} position={shape.position} scale={shape.scale}>
          {shape.type === 'ico' ? (
            <icosahedronGeometry args={[1, 0]} />
          ) : (
            <octahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            color={shape.color}
            emissive={shape.color}
            emissiveIntensity={0.4}
            wireframe
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}
