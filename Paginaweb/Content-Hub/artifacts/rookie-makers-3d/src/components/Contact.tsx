import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle } from 'lucide-react';

export function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section className="py-24 bg-background relative" id="contacto">
      {/* Texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-3xl border-primary/20 relative">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Text Side */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-sans mb-4 text-white">
                Inicia tu <span className="text-secondary neon-text-secondary">Producción</span>
              </h2>
              <p className="text-muted-foreground font-mono mb-8 text-sm leading-relaxed">
                ¿Tienes el diseño listo o necesitas que te ayudemos a modelarlo? Escríbenos, sube tu idea y arranquemos motores.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-white text-sm font-sans mb-1">Taller HQ</h4>
                  <p className="text-muted-foreground text-xs font-mono">Guadalajara, Jalisco, México<br/>(Citas solo con previo aviso)</p>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm font-sans mb-1">Contacto Directo</h4>
                  <p className="text-primary text-xs font-mono hover:underline cursor-pointer">print@rookiemakers3d.mx</p>
                  <p className="text-primary text-xs font-mono hover:underline cursor-pointer">+52 33 1234 5678</p>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Nombre o Alias</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                    placeholder="mail@tuyo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">WhatsApp</label>
                  <input 
                    type="tel" 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                    placeholder="10 dígitos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">El Proyecto</label>
                <textarea 
                  rows={3}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] resize-none"
                  placeholder="Describe qué necesitas, dimensiones aproximadas..."
                />
              </div>

              {/* Fake file upload for demo */}
              <div className="relative group cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-full bg-black/40 border border-dashed border-white/20 rounded-lg px-4 py-4 flex items-center justify-center gap-2 group-hover:border-primary transition-colors">
                  <UploadCloud className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">Adjuntar STL/OBJ/ZIP</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`w-full py-4 rounded-lg font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isSubmitted 
                    ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                    : 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.5)]'
                }`}
              >
                {isSubmitted ? (
                  <><CheckCircle className="w-5 h-5" /> Enviado</>
                ) : (
                  'Enviar al Taller'
                )}
              </motion.button>
            </form>

          </div>
        </div>
      </div>
    </section>
  );
}
