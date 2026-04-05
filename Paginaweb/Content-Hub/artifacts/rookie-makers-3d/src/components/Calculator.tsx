import React, { useState, useEffect, useMemo } from "react";
import { Upload, FileText, Calculator as CalcIcon, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { landingApiUrl } from "@/lib/publicLandingApi";

type CalcMaterial = { id: string; name: string; costoPorKg: number; type: "FDM" | "SLA" };

const FALLBACK_MATERIALS: CalcMaterial[] = [
  { id: "pla_plus", name: "PLA+", costoPorKg: 330, type: "FDM" },
  { id: "petg", name: "PETG", costoPorKg: 420, type: "FDM" },
  { id: "abs", name: "ABS", costoPorKg: 380, type: "FDM" },
  { id: "resina_std", name: "Resina standard", costoPorKg: 900, type: "SLA" },
  { id: "resina_pro", name: "Resina premium", costoPorKg: 1100, type: "SLA" },
];

const COLORS = [
  { id: "black", hex: "#111111", name: "Negro Mate" },
  { id: "white", hex: "#EEEEEE", name: "Blanco Nieve" },
  { id: "gray", hex: "#888888", name: "Gris Industrial" },
  { id: "cyan", hex: "#00F5FF", name: "Cian Neón" },
  { id: "magenta", hex: "#FF006E", name: "Magenta" },
  { id: "orange", hex: "#FF6B35", name: "Naranja" },
  { id: "clear", hex: "#E0F7FA", name: "Translúcido" },
];

function normalizeMaterials(raw: unknown): CalcMaterial[] {
  if (!Array.isArray(raw) || raw.length === 0) return FALLBACK_MATERIALS;
  const out: CalcMaterial[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = String(o.id ?? "");
    const name = String(o.name ?? id);
    const costo = Number(o.costoPorKg ?? o.basePrice);
    const type = o.type === "SLA" ? "SLA" : "FDM";
    if (!id || !Number.isFinite(costo) || costo <= 0) continue;
    out.push({ id, name, costoPorKg: costo, type });
  }
  return out.length ? out : FALLBACK_MATERIALS;
}

/** Heurística MXN: gramos estimados desde tamaño de archivo + costo/kg + infill (FDM). */
function estimateMxn(
  fileSizeBytes: number,
  material: CalcMaterial,
  infillPercent: number,
): number {
  const fileMb = Math.max(0.25, fileSizeBytes / (1024 * 1024));
  const estGrams = Math.min(900, Math.max(12, fileMb * 38));
  const infillFactor = material.type === "FDM" ? 0.5 + 0.5 * (infillPercent / 100) : 1;
  const materialCost = (estGrams / 1000) * material.costoPorKg * infillFactor;
  const prepio = 45 + fileMb * 12;
  return Math.round(materialCost + prepio);
}

export function Calculator() {
  const [materials, setMaterials] = useState<CalcMaterial[]>(FALLBACK_MATERIALS);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    const url = landingApiUrl("/api/pagina-publica/landing");
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setMaterials(normalizeMaterials(data?.calculatorMaterials));
        setLoadErr(false);
      })
      .catch(() => {
        setLoadErr(true);
        setMaterials(FALLBACK_MATERIALS);
      });
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [material, setMaterial] = useState<CalcMaterial>(FALLBACK_MATERIALS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [infill, setInfill] = useState(20);
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);

  useEffect(() => {
    setMaterial((m) => materials.find((x) => x.id === m.id) ?? materials[0]);
  }, [materials]);

  const materialList = useMemo(() => materials, [materials]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setEstimate(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setEstimate(null);
    }
  };

  const calculateEstimate = () => {
    if (!file) return;

    setIsCalculating(true);
    setEstimate(null);

    setTimeout(() => {
      const calculated = estimateMxn(file.size, material, infill);
      setEstimate(calculated);
      setIsCalculating(false);
    }, 900);
  };

  return (
    <section className="py-24 bg-background relative" id="cotizador">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold font-sans mb-6">
              Smart Quote <span className="text-primary neon-text-primary">Calculator</span>
            </h2>
            <p className="text-muted-foreground font-mono mb-8 text-lg">
              Sube tu modelo 3D y obtén un estimado orientativo en MXN según el costo por kg de cada material (configurable desde el ERP).
            </p>
            {loadErr && (
              <p className="text-xs font-mono text-amber-500/90 mb-4">
                No se pudo cargar la config del servidor; se muestran precios por defecto.
              </p>
            )}
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">1</div>
                Sube tu archivo STL o OBJ
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">2</div>
                Configura material y especificaciones
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">3</div>
                Solicita la cotización exacta para revisión manual
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 md:p-8 rounded-2xl border-primary/30 relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-10 -z-10" />

            <div className="space-y-6 relative z-10">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input type="file" id="file-upload" className="hidden" accept=".stl,.obj" onChange={handleFileChange} />

                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-primary mb-3" />
                    <span className="font-mono text-foreground font-bold">{file.name}</span>
                    <span className="font-mono text-muted-foreground text-sm mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      className="mt-4 text-xs font-mono text-primary underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setEstimate(null);
                      }}
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                    <span className="font-mono text-muted-foreground">Arrastra tu archivo STL/OBJ aquí</span>
                    <span className="font-mono text-xs text-muted-foreground/70 mt-2">o haz clic para explorar</span>
                  </div>
                )}
              </div>

              <div className={`space-y-6 transition-opacity duration-300 ${!file ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                <div>
                  <label className="font-mono text-sm text-muted-foreground mb-2 block">Material ($/kg desde ERP)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {materialList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMaterial(m)}
                        className={`py-2 px-3 rounded-md font-mono text-xs border transition-all ${
                          material.id === m.id
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/10 hover:border-white/30 text-muted-foreground"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/80 mt-2">
                    {material.name}: ${material.costoPorKg}/kg · {material.type}
                  </p>
                </div>

                <div>
                  <label className="font-mono text-sm text-muted-foreground mb-2 block">Color Base</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          color.id === c.id ? "border-primary scale-110" : "border-transparent hover:scale-110"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {material.type === "FDM" && (
                  <div>
                    <div className="flex justify-between font-mono text-sm mb-2">
                      <label className="text-muted-foreground">Densidad (Infill)</label>
                      <span className="text-primary">{infill}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={10}
                      value={infill}
                      onChange={(e) => setInfill(parseInt(e.target.value, 10))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={calculateEstimate}
                  disabled={!file || isCalculating}
                  className="w-full py-4 bg-white/5 border border-primary/50 text-primary font-bold font-mono uppercase tracking-wider rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CalcIcon className="w-5 h-5" />
                  )}
                  {isCalculating ? "Procesando modelo..." : "Calcular Estimado"}
                </button>
              </div>

              <AnimatePresence>
                {estimate !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <div className="text-center">
                      <span className="font-mono text-muted-foreground text-sm">Estimado aprox:</span>
                      <div className="text-4xl md:text-5xl font-bold font-sans text-primary neon-text-primary my-2">
                        ${estimate} <span className="text-lg">MXN</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-6">
                        *Precio orientativo según costo/kg configurado; sujeto a geometría real y soportes.
                      </p>
                      <button
                        type="button"
                        className="w-full py-4 bg-primary text-primary-foreground font-bold font-mono text-lg uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                      >
                        Solicitar Cotización Exacta
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
