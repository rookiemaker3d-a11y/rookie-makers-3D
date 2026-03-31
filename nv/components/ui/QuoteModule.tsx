"use client";
import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useQuoteStore } from "@/store/useQuoteStore";

const STLViewer = dynamic(() => import("../3d/STLViewer"), { ssr: false });

export default function QuoteModule() {
  const { material, infill, price, setMaterial, setInfill, calculatePrice } = useQuoteStore();

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4">
      <div className="lg:col-span-8 bg-industrial-900 border border-white/10 rounded-[2rem] overflow-hidden relative min-h-[500px]">
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-precision/30">
            <div className="w-2 h-2 bg-precision animate-pulse rounded-full" />
            <span className="text-[10px] font-mono text-precision tracking-widest uppercase">Sistema de Análisis STL v2.0</span>
          </div>
        </div>

        <STLViewer />

        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="border-2 border-dashed border-precision/20 p-12 rounded-3xl text-center">
            <p className="text-white/40 font-mono text-sm uppercase tracking-tighter">Arrastra tu archivo .STL aquí</p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-industrial-800 p-8 rounded-[2rem] border border-white/5 space-y-8">
          <h3 className="text-xl font-bold font-mono border-l-4 border-action pl-4">PARÁMETROS_SPLICER</h3>

          <div className="space-y-4">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Tipo de Filamento</span>
            <div className="grid grid-cols-3 gap-2">
              {(["PLA", "PETG", "RESIN"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMaterial(m);
                    calculatePrice();
                  }}
                  className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${
                    material === m ? "border-precision bg-precision/10 text-precision" : "border-white/10 text-white/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Densidad de Relleno</span>
              <span className="text-precision font-mono">{infill}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={infill}
              onChange={(e) => {
                setInfill(parseInt(e.target.value, 10));
                calculatePrice();
              }}
              className="w-full h-1 bg-white/10 appearance-none rounded-full accent-precision cursor-pointer"
            />
          </div>

          <div className="pt-6 border-t border-white/5">
            <span className="text-[10px] text-white/40 block mb-1 uppercase tracking-widest">Coste de fabricación</span>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={price}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold font-mono tracking-tighter"
              >
                €{price.toFixed(2)}
              </motion.span>
              <span className="text-white/20 text-xs italic">+ envío base</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-action hover:bg-white text-black font-black py-5 rounded-2xl transition-all uppercase tracking-widest shadow-[0_0_30px_rgba(255,92,0,0.3)]"
          >
            Iniciar Producción
          </button>
        </div>
      </div>
    </div>
  );
}
