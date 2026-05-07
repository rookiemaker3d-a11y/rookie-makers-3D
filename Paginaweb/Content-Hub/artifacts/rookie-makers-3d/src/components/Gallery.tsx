import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/data/portfolio";

const ROTATE_MS = 4500;

function RotatingTile({ project, index }: { project: PortfolioCategory; index: number }) {
  const [idx, setIdx] = useState(0);
  const images = project.images;
  const n = images.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), ROTATE_MS);
    return () => clearInterval(t);
  }, [n]);

  const img = images[Math.min(idx, n - 1)];

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      whileHover="hover"
      className={`relative group overflow-hidden rounded-xl bg-card border border-white/5 cursor-pointer ${project.span}`}
    >
      <div
        key={img}
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${img})` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <span className="font-mono text-xs text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 uppercase tracking-widest">
          {project.tag}
        </span>
        <h3 className="text-xl font-bold font-sans text-white">{project.label}</h3>
        {n > 1 && (
          <p className="font-mono text-[10px] text-muted-foreground mt-1 opacity-70">
            {idx + 1}/{n} fotos
          </p>
        )}
      </div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-[150%]"
        variants={{
          hover: { translateX: "150%", transition: { duration: 0.8, ease: "easeInOut" } },
        }}
      />
    </motion.div>
  );
}

export function Gallery() {
  const [categories, setCategories] = useState<PortfolioCategory[]>(PORTFOLIO_CATEGORIES);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/web-gallery")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const mapped: PortfolioCategory[] = data.map((cat: any, i: number) => ({
          id: String(cat.slug || cat.id || i),
          label: cat.label || "Sin nombre",
          tag: cat.tag || "Proyecto",
          span: cat.span || "col-span-1 row-span-1",
          images: Array.isArray(cat.images)
            ? cat.images.map((img: any) => String(img.src || img))
            : [],
        }));
        setCategories(mapped);
      })
      .catch(() => {
        /* fallback to hardcoded portfolio.ts */
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-24 bg-background relative" id="galeria">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-sans mb-4">
            Arsenal de <span className="text-secondary neon-text-secondary">Proyectos</span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl">
            Trabajos reales: funkos, soportes, moldes, letreros e ingeniería inversa. En categorías con varias fotos, la imagen cambia sola cada pocos segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {categories.map((project, i) => (
            <RotatingTile key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
