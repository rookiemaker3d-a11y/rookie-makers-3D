import React, { useState } from 'react';
import { Upload, FileText, Calculator as CalcIcon, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MATERIALS = [
  { id: 'pla', name: 'PLA+', basePrice: 2.5, type: 'FDM' },
  { id: 'petg', name: 'PETG', basePrice: 3.0, type: 'FDM' },
  { id: 'abs', name: 'ABS', basePrice: 3.5, type: 'FDM' },
  { id: 'resin-std', name: 'Resina Standard', basePrice: 5.0, type: 'SLA' },
  { id: 'resin-pro', name: 'Resina Premium', basePrice: 8.0, type: 'SLA' },
];

const COLORS = [
  { id: 'black', hex: '#111111', name: 'Negro Mate' },
  { id: 'white', hex: '#EEEEEE', name: 'Blanco Nieve' },
  { id: 'gray', hex: '#888888', name: 'Gris Industrial' },
  { id: 'cyan', hex: '#00F5FF', name: 'Cian Neón' },
  { id: 'magenta', hex: '#FF006E', name: 'Magenta' },
  { id: 'orange', hex: '#FF6B35', name: 'Naranja' },
  { id: 'clear', hex: '#E0F7FA', name: 'Translúcido' },
];

export function Calculator() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [infill, setInfill] = useState(20);
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);

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
    
    // Simulate complex calculation
    setTimeout(() => {
      // Fake formula: basePrice * (fileSize in MB) * (1 + (infill/100)) * random factor
      const fileSizeMb = Math.max(1, file.size / (1024 * 1024));
      const sizeMultiplier = Math.min(fileSizeMb, 50); // cap at 50mb equivalent
      const infillMultiplier = material.type === 'FDM' ? 1 + (infill / 100) : 1;
      
      const calculated = (material.basePrice * sizeMultiplier * infillMultiplier) * 15; // To MXN approx
      setEstimate(Math.round(calculated));
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <section className="py-24 bg-background relative" id="cotizador">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Info Side */}
          <div>
            <h2 className="text-3xl md:text-5xl font-bold font-sans mb-6">
              Smart Quote <span className="text-primary neon-text-primary">Calculator</span>
            </h2>
            <p className="text-muted-foreground font-mono mb-8 text-lg">
              Sube tu modelo 3D y obtén un estimado instantáneo. Nuestro sistema analiza el volumen, material y densidad para darte el mejor precio del mercado.
            </p>
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

          {/* Calculator UI */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-primary/30 relative overflow-hidden">
            {/* Glow effect behind panel */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-10 -z-10" />

            <div className="space-y-6 relative z-10">
              
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".stl,.obj" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-primary mb-3" />
                    <span className="font-mono text-foreground font-bold">{file.name}</span>
                    <span className="font-mono text-muted-foreground text-sm mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    <button 
                      className="mt-4 text-xs font-mono text-primary underline"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setEstimate(null); }}
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

              {/* Settings */}
              <div className={`space-y-6 transition-opacity duration-300 ${!file ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                
                {/* Material Select */}
                <div>
                  <label className="font-mono text-sm text-muted-foreground mb-2 block">Material</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MATERIALS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMaterial(m)}
                        className={`py-2 px-3 rounded-md font-mono text-xs border transition-all ${
                          material.id === m.id 
                            ? 'border-primary bg-primary/20 text-primary' 
                            : 'border-white/10 hover:border-white/30 text-muted-foreground'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Select */}
                <div>
                  <label className="font-mono text-sm text-muted-foreground mb-2 block">Color Base</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setColor(c)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          color.id === c.id ? 'border-primary scale-110' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Infill Slider (Only for FDM) */}
                {material.type === 'FDM' && (
                  <div>
                    <div className="flex justify-between font-mono text-sm mb-2">
                      <label className="text-muted-foreground">Densidad (Infill)</label>
                      <span className="text-primary">{infill}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="10" 
                      value={infill}
                      onChange={(e) => setInfill(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                {/* Calculate Button */}
                <button 
                  onClick={calculateEstimate}
                  disabled={!file || isCalculating}
                  className="w-full py-4 bg-white/5 border border-primary/50 text-primary font-bold font-mono uppercase tracking-wider rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CalcIcon className="w-5 h-5" />
                  )}
                  {isCalculating ? 'Procesando modelo...' : 'Calcular Estimado'}
                </button>
              </div>

              {/* Results Area */}
              <AnimatePresence>
                {estimate !== null && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-white/10"
                  >
                    <div className="text-center">
                      <span className="font-mono text-muted-foreground text-sm">Estimado aprox:</span>
                      <div className="text-4xl md:text-5xl font-bold font-sans text-primary neon-text-primary my-2">
                        ${estimate} <span className="text-lg">MXN</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-6">
                        *Precio sujeto a revisión de geometría y soportes necesarios.
                      </p>
                      <button className="w-full py-4 bg-primary text-primary-foreground font-bold font-mono text-lg uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,245,255,0.3)]">
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
