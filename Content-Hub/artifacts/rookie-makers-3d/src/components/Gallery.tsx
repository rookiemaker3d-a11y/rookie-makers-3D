import React from 'react';
import { motion } from 'framer-motion';

const b = import.meta.env.BASE_URL;

const projects = [
  { id: 1, title: 'Engranaje Prototipo', material: 'ABS Industrial', span: 'col-span-1 row-span-1', img: `${b}images/project-1.png` },
  { id: 2, title: 'Maqueta Arquitectónica', material: 'PLA Blanco', span: 'col-span-1 md:col-span-2 row-span-1', img: `${b}images/project-2.png` },
  { id: 3, title: 'Figura Coleccionable', material: 'Resina 8K', span: 'col-span-1 row-span-2', img: `${b}images/project-3.png` },
  { id: 4, title: 'Carcasa Electrónica', material: 'PETG Negro', span: 'col-span-1 row-span-1', img: `${b}images/project-4.png` },
  { id: 5, title: 'Estructura Lattice', material: 'Resina Tenaz', span: 'col-span-1 row-span-1', img: `${b}images/project-5.png` },
  { id: 6, title: 'Jarrón Paramétrico', material: 'PETG Translúcido', span: 'col-span-1 md:col-span-2 row-span-1', img: `${b}images/project-6.png` },
  { id: 7, title: 'Brazo Robótico', material: 'Fibra de Carbono', span: 'col-span-1 row-span-1', img: `${b}images/project-7.png` },
  { id: 8, title: 'Miniatura Tabletop', material: 'Resina Gris', span: 'col-span-1 row-span-1', img: `${b}images/project-8.png` },
];

export function Gallery() {
  return (
    <section className="py-24 bg-background relative" id="proyectos">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-sans mb-4">
            Arsenal de <span className="text-secondary neon-text-secondary">Proyectos</span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl">
            Del CAD a tus manos. Una selección de piezas fabricadas en nuestro estudio para ingenieros, artistas y makers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover="hover"
              className={`relative group overflow-hidden rounded-xl bg-card border border-white/5 cursor-pointer ${project.span}`}
            >
              {/* Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${project.img})` }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="font-mono text-xs text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 uppercase tracking-widest">
                  {project.material}
                </span>
                <h3 className="text-xl font-bold font-sans text-white">
                  {project.title}
                </h3>
              </div>

              {/* Shimmer Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-[150%]"
                variants={{
                  hover: { translateX: '150%', transition: { duration: 0.8, ease: "easeInOut" } }
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
