import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 10 + 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] -= delta * (Math.random() * 2 + 1);
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * delta * 0.5;
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 10;
        positions[i * 3] = (Math.random() - 0.5) * 5;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.05;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00F5FF"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!ctx;
  } catch {
    return false;
  }
}

const AnimatedBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 40 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-px bg-gradient-to-b from-primary/60 to-transparent"
        style={{
          left: `${Math.random() * 100}%`,
          height: `${40 + Math.random() * 60}px`,
          animation: `filamentDrop ${1.5 + Math.random() * 2}s ${Math.random() * 3}s infinite linear`,
          opacity: 0.4 + Math.random() * 0.6,
        }}
      />
    ))}
  </div>
);

export function Hero() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  return (
    <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-background">
      <div 
        className="absolute inset-0 z-0 opacity-20 mix-blend-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-nozzle.png')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

      <div className="absolute inset-0 z-0 pointer-events-none">
        {webglSupported === true ? (
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
            onCreated={({ gl }) => {
              gl.setClearColor(new THREE.Color(0x0a0a0f), 0);
            }}
          >
            <ParticleSystem />
          </Canvas>
        ) : (
          <AnimatedBackground />
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono tracking-wider backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          EXTRUDING REALITY
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-sans tracking-tight text-foreground mb-6 max-w-4xl">
          Hacemos <span className="text-primary neon-text-primary">Real</span> lo que <span className="text-secondary neon-text-secondary">Imaginas</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 font-mono">
          Estudio de impresión 3D en México. Desde piezas funcionales hasta prototipos industriales con precisión técnica.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href="#cotizador"
            data-testid="button-cotizar"
            className="text-center px-8 py-4 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] font-mono text-lg uppercase tracking-wider"
          >
            Cotizar Ahora
          </a>
          <a
            href="#galeria"
            data-testid="button-proyectos"
            className="text-center px-8 py-4 bg-transparent border-2 border-primary text-primary font-bold rounded-md hover:bg-primary/10 transition-colors font-mono text-lg uppercase tracking-wider"
          >
            Ver Proyectos
          </a>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-10 text-muted-foreground pointer-events-none">
        <span className="text-xs font-mono mb-2 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
}
