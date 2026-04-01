import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos R.',
    role: 'Ingeniero Mecatrónico',
    text: 'Imprimieron una pieza para mi tesis en ABS. La precisión fue brutal y los soportes fáciles de quitar. Tienen el mejor setup del DF.',
    rating: 5,
    project: 'Prototipo de Transmisión'
  },
  {
    name: 'Ana G.',
    role: 'Artista Visual',
    text: 'Mi jarrón paramétrico quedó increíble en PETG translúcido. Captaron exactamente la onda futurista que buscaba. Súper recomendados.',
    rating: 5,
    project: 'Escultura Translúcida'
  },
  {
    name: 'Javier M.',
    role: 'Coleccionista',
    text: 'La resina 8K que usan no tiene madre. Los detalles de la armadura y el rostro de la figura quedaron perfectos. Ya estoy armando mi próximo pedido.',
    rating: 5,
    project: 'Figura Custom 30cm'
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background relative overflow-hidden" id="testimonios">
      {/* Background blur effects */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4">
            Comunidad <span className="text-primary neon-text-primary">Maker</span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Lo que dicen los creadores que ya materializaron sus ideas con nosotros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="glass-panel p-8 rounded-2xl border-white/10 hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-1 mb-4 text-accent">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-foreground font-sans italic mb-6 leading-relaxed">"{t.text}"</p>
              <div className="mt-auto border-t border-white/10 pt-4">
                <p className="font-bold text-white text-sm">{t.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground font-mono">{t.role}</p>
                  <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-full">
                    {t.project}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
