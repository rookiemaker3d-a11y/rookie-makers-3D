import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Layers, Zap, Hexagon, Component } from 'lucide-react';

const services = [
  {
    title: "Impresión FDM",
    description: "Prototipos robustos, piezas mecánicas y funcionales en PLA, PETG y ABS. Máxima resistencia.",
    icon: Layers,
    color: "text-primary",
    border: "border-primary/30",
    shadow: "shadow-primary/10"
  },
  {
    title: "Resina SLA",
    description: "Ultra alta resolución para miniaturas, joyería y piezas dentales. Detalles milimétricos.",
    icon: Hexagon,
    color: "text-secondary",
    border: "border-secondary/30",
    shadow: "shadow-secondary/10"
  },
  {
    title: "Prototipado Industrial",
    description: "Desarrollo de carcasas, engranajes y reemplazos descontinuados listos para producción.",
    icon: Component,
    color: "text-accent",
    border: "border-accent/30",
    shadow: "shadow-accent/10"
  },
  {
    title: "Figuras Custom",
    description: "Personajes, props, cosplay y arte a medida. Modelado e impresión end-to-end.",
    icon: Zap,
    color: "text-purple-400",
    border: "border-purple-400/30",
    shadow: "shadow-purple-400/10"
  }
];

export function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <section className="py-24 bg-background relative overflow-hidden" id="services">
      {/* Decorative grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5" 
           style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4">
            Servicios <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Técnicos</span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Arsenal de impresión listo para materializar cualquier idea con precisión milimétrica.
          </p>
        </div>

        <motion.div 
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`glass-panel p-8 rounded-xl flex flex-col items-start text-left border ${service.border} hover:shadow-2xl hover:${service.shadow} transition-all duration-300 group`}
              >
                <div className={`p-4 rounded-lg bg-background/50 mb-6 border ${service.border} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${service.color}`} />
                </div>
                <h3 className="text-xl font-bold font-sans mb-3 text-foreground">{service.title}</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
