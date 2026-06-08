import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, CheckCircle2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ProductoComprable } from "@/data/productosComprables";
import { landingApiUrl } from "@/lib/publicLandingApi";

interface Props {
  producto: ProductoComprable;
  variant?: "card" | "floating";
}

function formatPrecio(precio: number): string {
  return precio.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

export function ComprarProductoButton({ producto, variant = "card" }: Props) {
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [precioCliente, setPrecioCliente] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const reset = () => {
    setNombre("");
    setPrecioCliente("");
    setMensaje("");
    setWhatsappUrl(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Por favor, ingrese su nombre para continuar");
      return;
    }
    let precioFinal: number;
    if (producto.precio !== null) {
      precioFinal = producto.precio;
    } else {
      const p = parseFloat(precioCliente);
      if (!precioCliente || isNaN(p) || p <= 0) {
        toast.error("Por favor, indique el precio estimado que tiene en mente");
        return;
      }
      precioFinal = p;
    }
    setEnviando(true);
    try {
      const res = await fetch(landingApiUrl("/api/compras"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: null,
          producto_catalogo_id: typeof producto.id === "number" ? producto.id : null,
          producto_descripcion: producto.nombre,
          precio_unitario: precioFinal,
          precio_ingresado_por_cliente: producto.precio === null,
          cliente_nombre: nombre.trim(),
          cliente_mensaje: mensaje.trim() || null,
          user_agent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setWhatsappUrl(data.whatsapp_url);
      toast.success("Su solicitud ha sido registrada. Nos pondremos en contacto a la brevedad.");
    } catch (err) {
      toast.error(
        "No fue posible registrar su solicitud. Por favor, intente nuevamente o contáctenos directamente por WhatsApp."
      );
    } finally {
      setEnviando(false);
    }
  };

  const triggerButton =
    variant === "floating" ? (
      <Button
        size="lg"
        className="bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.5)] font-mono uppercase tracking-wider"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Comprar {producto.precio !== null && `(${formatPrecio(producto.precio)})`}
      </Button>
    ) : (
      <Button className="w-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.5)] font-mono uppercase tracking-wider text-xs">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Comprar{" "}
        {producto.precio !== null && `(${formatPrecio(producto.precio)})`}
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        else setOpen(true);
      }}
    >
      {/* Trigger accesible (button con role de button) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.5)] font-mono uppercase tracking-wider text-xs py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ShoppingCart className="w-4 h-4" />
        Comprar{" "}
        {producto.precio !== null && `(${formatPrecio(producto.precio)})`}
      </button>

      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-primary/30">
        <AnimatePresence mode="wait">
          {!whatsappUrl ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  Comprar: {producto.nombre}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {producto.categoria} · {producto.descripcion}
                </p>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Nombre completo *
                  </label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ingrese su nombre completo"
                    required
                    disabled={enviando}
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                {producto.precio === null && (
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Precio estimado (MXN) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioCliente}
                      onChange={(e) => setPrecioCliente(e.target.value)}
                      placeholder="Ejemplo: 250.00"
                      required
                      disabled={enviando}
                      className="bg-black/60 border-white/20 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-amber-400/80 font-mono mt-1">
                      Este producto no cuenta con un precio público definido. Le solicitamos su propuesta para que podamos confirmar la viabilidad del pedido.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Mensaje (opcional)
                  </label>
                  <Textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Detalle sus requerimientos: color, dimensiones, acabados, fecha de entrega, etc."
                    rows={3}
                    disabled={enviando}
                    className="bg-black/60 border-white/20 text-white placeholder:text-white/40 resize-none"
                  />
                </div>

                {producto.precio !== null && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-xs font-mono text-muted-foreground">
                      Precio del producto:
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrecio(producto.precio)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={enviando}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={enviando}
                    className="flex-1 bg-primary text-primary-foreground font-mono uppercase tracking-wider"
                  >
                    {enviando ? "Enviando..." : "Confirmar solicitud"}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white text-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  Solicitud registrada
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <p className="text-sm text-white/90">
                  Hemos recibido correctamente su interés en el producto{" "}
                  <strong className="text-primary">{producto.nombre}</strong>.
                  Nuestro equipo se pondrá en contacto con usted en breve para
                  confirmar los detalles y coordinar la entrega.
                </p>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-xs font-mono text-green-300 mb-3">
                    Si lo prefiere, puede contactarnos directamente por WhatsApp para una atención más inmediata:
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-mono uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir WhatsApp
                  </a>
                </div>

                <Button
                  onClick={reset}
                  className="w-full"
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
