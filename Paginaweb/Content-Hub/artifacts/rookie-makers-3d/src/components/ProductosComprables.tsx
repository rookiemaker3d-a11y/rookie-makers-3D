import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

import { PRODUCTOS_COMPRABLES } from "@/data/productosComprables";
import { ComprarProductoButton } from "@/components/ComprarProductoButton";

export function ProductosComprables() {
  // Si no hay productos, no renderizar la sección (Norberto aún no ha llenado el array)
  if (!PRODUCTOS_COMPRABLES || PRODUCTOS_COMPRABLES.length === 0) {
    return null;
  }

  return (
    <section
      id="productos-comprables"
      className="py-24 bg-background relative"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4"
          >
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono uppercase tracking-wider text-primary">
              Compra directa
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold font-sans mb-4 text-white">
            Productos <span className="text-primary neon-text">Disponibles</span>
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto">
            Elige el producto que te interesa, deja tu nombre y nos pondremos en
            contacto contigo para finalizar tu pedido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PRODUCTOS_COMPRABLES.map((producto, idx) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="glass-panel p-6 rounded-2xl border-primary/20 hover:border-primary/50 transition-all group flex flex-col"
            >
              <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-black/40 border border-white/5">
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">
                  {producto.categoria}
                </p>
                <h3 className="text-lg font-bold text-white mb-2">
                  {producto.nombre}
                </h3>
                <p className="text-sm text-muted-foreground font-mono mb-4 flex-1">
                  {producto.descripcion}
                </p>

                {producto.precio !== null ? (
                  <p className="text-2xl font-bold text-primary mb-3">
                    ${producto.precio.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs text-muted-foreground">MXN</span>
                  </p>
                ) : (
                  <p className="text-sm text-amber-400 font-mono mb-3">
                    Precio a convenir
                  </p>
                )}

                <ComprarProductoButton producto={producto} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
