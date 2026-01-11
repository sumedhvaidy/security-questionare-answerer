"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 4D Tesseract vertices (hypercube)
const tesseractVertices4D = [
  [-1, -1, -1, -1], [1, -1, -1, -1], [-1, 1, -1, -1], [1, 1, -1, -1],
  [-1, -1, 1, -1], [1, -1, 1, -1], [-1, 1, 1, -1], [1, 1, 1, -1],
  [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
  [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1],
];

// Edges of a tesseract (pairs of vertex indices)
const tesseractEdges = [
  // Inner cube
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
  // Outer cube
  [8, 9], [8, 10], [8, 12], [9, 11], [9, 13], [10, 11], [10, 14], [11, 15], [12, 13], [12, 14], [13, 15], [14, 15],
  // Connections between cubes
  [0, 8], [1, 9], [2, 10], [3, 11], [4, 12], [5, 13], [6, 14], [7, 15],
];

// Project 4D to 3D using stereographic projection
function project4Dto3D(vertex4D: number[], angleXW: number, angleYW: number, angleZW: number): [number, number, number] {
  let [x, y, z, w] = vertex4D;
  
  // Rotate in XW plane
  const cosXW = Math.cos(angleXW);
  const sinXW = Math.sin(angleXW);
  const x1 = x * cosXW - w * sinXW;
  const w1 = x * sinXW + w * cosXW;
  
  // Rotate in YW plane
  const cosYW = Math.cos(angleYW);
  const sinYW = Math.sin(angleYW);
  const y1 = y * cosYW - w1 * sinYW;
  const w2 = y * sinYW + w1 * cosYW;
  
  // Rotate in ZW plane
  const cosZW = Math.cos(angleZW);
  const sinZW = Math.sin(angleZW);
  const z1 = z * cosZW - w2 * sinZW;
  const w3 = z * sinZW + w2 * cosZW;
  
  // Perspective projection from 4D to 3D
  const distance = 3;
  const scale = distance / (distance - w3);
  
  return [x1 * scale, y1 * scale, z1 * scale];
}

function TesseractMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Create geometry
  const { lineGeometry, pointGeometry } = useMemo(() => {
    const lineGeom = new THREE.BufferGeometry();
    const pointGeom = new THREE.BufferGeometry();
    
    // Initialize with placeholder positions
    const linePositions = new Float32Array(tesseractEdges.length * 6);
    const pointPositions = new Float32Array(tesseractVertices4D.length * 3);
    
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    pointGeom.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    
    return { lineGeometry: lineGeom, pointGeometry: pointGeom };
  }, []);

  useFrame((state, delta) => {
    timeRef.current += delta * 0.5;
    
    const angleXW = timeRef.current * 0.7;
    const angleYW = timeRef.current * 0.5;
    const angleZW = timeRef.current * 0.3;
    
    // Project all vertices
    const projectedVertices = tesseractVertices4D.map(v => 
      project4Dto3D(v, angleXW, angleYW, angleZW)
    );
    
    // Update line positions
    const linePositions = lineGeometry.attributes.position.array as Float32Array;
    tesseractEdges.forEach((edge, i) => {
      const [v1, v2] = edge;
      const p1 = projectedVertices[v1];
      const p2 = projectedVertices[v2];
      
      linePositions[i * 6] = p1[0];
      linePositions[i * 6 + 1] = p1[1];
      linePositions[i * 6 + 2] = p1[2];
      linePositions[i * 6 + 3] = p2[0];
      linePositions[i * 6 + 4] = p2[1];
      linePositions[i * 6 + 5] = p2[2];
    });
    lineGeometry.attributes.position.needsUpdate = true;
    
    // Update point positions
    const pointPositions = pointGeometry.attributes.position.array as Float32Array;
    projectedVertices.forEach((p, i) => {
      pointPositions[i * 3] = p[0];
      pointPositions[i * 3 + 1] = p[1];
      pointPositions[i * 3 + 2] = p[2];
    });
    pointGeometry.attributes.position.needsUpdate = true;
    
    // Gentle rotation of the whole group
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.2) * 0.1;
      groupRef.current.rotation.x = Math.cos(timeRef.current * 0.15) * 0.05;
    }
  });

  return (
    <group ref={groupRef} scale={0.8}>
      {/* Main edges with gradient-like appearance */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial 
          color="#0ea5e9" 
          transparent 
          opacity={0.7}
          linewidth={1}
        />
      </lineSegments>
      
      {/* Secondary glow lines */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial 
          color="#22d3ee" 
          transparent 
          opacity={0.3}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Vertices as glowing points */}
      <points ref={pointsRef} geometry={pointGeometry}>
        <pointsMaterial 
          color="#0ea5e9" 
          size={0.12} 
          transparent 
          opacity={0.9}
          sizeAttenuation
        />
      </points>
      
      {/* Outer glow on vertices */}
      <points ref={glowRef} geometry={pointGeometry}>
        <pointsMaterial 
          color="#22d3ee" 
          size={0.25} 
          transparent 
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function Tesseract() {
  return (
    <div className="w-48 h-48 relative">
      {/* Subtle shadow/glow underneath */}
      <div 
        className="absolute inset-0 rounded-full opacity-30 blur-2xl"
        style={{
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)",
          transform: "translateY(20px) scale(0.8)"
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <TesseractMesh />
      </Canvas>
    </div>
  );
}
