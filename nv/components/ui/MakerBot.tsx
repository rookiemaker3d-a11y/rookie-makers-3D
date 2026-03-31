"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MakerBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 h-[450px] bg-industrial-900 border border-precision/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-6"
          >
            <div className="p-4 bg-precision/10 border-b border-precision/20 flex justify-between items-center font-mono text-[10px] text-precision">
              <span>MAKER_BOT_PRO_V2</span>
              <button type="button" onClick={() => setIsOpen(false)}>
                _CLOSE
              </button>
            </div>

            <div className="flex-1 p-4 font-mono text-[11px] space-y-4 overflow-y-auto">
              <div className="text-precision">
                {" "}
                [SYSTEM]: Hola. Soy el asistente de Rookiemakers. ¿Qué material buscas para tu proyecto?{" "}
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 italic text-white/60">
                Pista: Prueba preguntando por &quot;Material para exterior&quot;
              </div>
            </div>

            <div className="p-4 bg-black border-t border-white/5">
              <input
                type="text"
                placeholder="Escribe comando..."
                className="w-full bg-transparent border-none focus:ring-0 font-mono text-xs text-precision outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-precision rounded-full shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center justify-center text-black"
        aria-label="Abrir asistente"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 8V4m0 0L8 8m4-4l4 4m-4 12v-4m0 0l-4 4m4-4l4 4M4 12h4m0 0l-4-4m4 4l-4 4m12-4h-4m0 0l4-4m-4 4l4 4" />
        </svg>
      </motion.button>
    </div>
  );
}
