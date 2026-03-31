"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

function Scene() {
  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[80, 120, 60]} intensity={1.2} castShadow />
      <directionalLight position={[-40, 20, -30]} intensity={0.35} color="#00F2FF" />
      <group rotation={[0, Math.PI / 4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[40, 40, 40]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.75} />
        </mesh>
        <mesh>
          <boxGeometry args={[40.6, 40.6, 40.6]} />
          <meshBasicMaterial color="#00F2FF" wireframe transparent opacity={0.35} />
        </mesh>
      </group>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enablePan={false} minDistance={120} maxDistance={280} />
    </>
  );
}

export default function STLViewer() {
  return (
    <div className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing bg-[#050505]">
      <Canvas shadows camera={{ position: [140, 100, 140], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
