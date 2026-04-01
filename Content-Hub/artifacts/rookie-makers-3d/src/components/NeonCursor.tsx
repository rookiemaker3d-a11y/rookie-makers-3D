import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function NeonCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50 mix-blend-screen hidden md:block"
      animate={{
        x: mousePosition.x - 150,
        y: mousePosition.y - 150,
      }}
      transition={{ type: 'spring', damping: 40, stiffness: 300, mass: 1 }}
    >
      <div className="w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]" />
    </motion.div>
  );
}
