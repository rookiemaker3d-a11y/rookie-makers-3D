import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Images, ChevronDown, ChevronUp } from "lucide-react";
import { ALL_PORTFOLIO_IMAGES } from "@/data/portfolio";

export function PortfolioMosaic() {
  const [open, setOpen] = useState(false);
  const visible = useMemo(() => (open ? ALL_PORTFOLIO_IMAGES : ALL_PORTFOLIO_IMAGES.slice(0, 4)), [open]);

  return (
    <section className="py-20 bg-background relative" id="fotos">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-4xl font-bold font-sans text-foreground flex items-center gap-3">
            <Images className="w-6 h-6 text-primary" />
            Fotos de proyectos
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-mono mt-2 max-w-2xl">
            Mostramos 4 por defecto para que el inicio se vea limpio. Si quieres ver todo el portafolio, abre “Ver más”.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {visible.map(({ src, alt }) => (
            <div
              key={src}
              className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-muted/20 group"
            >
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary/30 bg-primary/10 text-primary font-mono font-bold hover:bg-primary/15 transition-colors"
            data-testid="portfolio-toggle"
          >
            {open ? (
              <>
                <ChevronUp className="w-4 h-4" /> Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Ver más
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

