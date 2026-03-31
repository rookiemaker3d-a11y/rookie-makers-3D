import dynamic from "next/dynamic";
import { JetBrains_Mono } from "next/font/google";
import QuoteModuleSkeleton from "@/components/QuoteModuleSkeleton";

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

const QuoteModule = dynamic(() => import("@/components/ui/QuoteModule"), {
  ssr: false,
  loading: () => <QuoteModuleSkeleton />,
});

const MakerBot = dynamic(() => import("@/components/ui/MakerBot"), { ssr: false });

export default function Home() {
  return (
    <main
      className={`${jetbrains.variable} bg-background min-h-screen text-white selection:bg-precision selection:text-black relative`}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,242,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,242,255,0.4) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <nav className="sticky top-0 z-[90] h-20 flex items-center justify-between px-6 md:px-10 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="text-xl font-black tracking-tighter text-precision">
          ROOKIEMAKERS<span className="text-white">3D</span>
        </div>
        <span className="hidden sm:inline text-[10px] font-mono text-white/35 uppercase tracking-widest border border-white/10 rounded-full px-3 py-1">
          Preview nv · local
        </span>
      </nav>

      <section className="py-16 md:py-24 text-center px-4">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-white/90 to-white/35 bg-clip-text text-transparent leading-[0.95]">
          CORTA EL
          <br />
          LÍMITE.
        </h1>
        <p className="font-mono text-precision/70 tracking-[0.35em] sm:tracking-[0.5em] text-[10px] sm:text-xs uppercase">
          Industrial Manufacturing 2.0
        </p>
      </section>

      <QuoteModule />

      {/* Bento Grid Visual (Diseño) */}
      <section className="max-w-6xl mx-auto py-24 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-80 bg-industrial-900 rounded-[2.5rem] border border-white/5 overflow-hidden group">
          <div className="p-10 h-full flex flex-col justify-end">
            <span className="text-action font-mono text-xs">// ART_TECH</span>
            <h2 className="text-4xl font-bold">Prototipado rápido</h2>
          </div>
        </div>
        <div className="h-80 bg-precision/5 border border-precision/20 rounded-[2.5rem] p-10 flex flex-col justify-between">
          <div className="w-12 h-12 bg-precision rounded-full" />
          <p className="font-mono text-xs text-precision uppercase">Envío mundial 24/48h</p>
        </div>
      </section>

      <MakerBot />
    </main>
  );
}
