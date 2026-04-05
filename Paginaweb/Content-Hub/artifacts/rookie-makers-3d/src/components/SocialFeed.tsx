import { motion } from "framer-motion";
import { ExternalLink, Play, Images } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook } from "react-icons/si";
import { ALL_PORTFOLIO_IMAGES } from "@/data/portfolio";

const INSTAGRAM_URL = "https://www.instagram.com/rookiemakers3d";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61553700448358";
const TIKTOK_URL = "https://www.tiktok.com/@rookiemakers3d";

const platforms = [
  {
    name: "Instagram",
    handle: "@rookiemakers3d",
    url: INSTAGRAM_URL,
    icon: SiInstagram,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    bg: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10",
    border: "border-pink-500/30",
    followers: "Síguenos en IG",
    description: "Fotos y reels de nuestras impresiones, time-lapses y proyectos especiales.",
  },
  {
    name: "TikTok",
    handle: "@rookiemakers3d",
    url: TIKTOK_URL,
    icon: SiTiktok,
    gradient: "from-[#010101] via-[#EE1D52] to-[#69C9D0]",
    bg: "bg-gradient-to-br from-black/10 via-red-500/10 to-cyan-400/10",
    border: "border-red-400/30",
    followers: "Síguenos en TikTok",
    description: "Videos virales de impresión en tiempo real, retos maker y tutoriales.",
  },
  {
    name: "Facebook",
    handle: "Rookie Makers 3D",
    url: FACEBOOK_URL,
    icon: SiFacebook,
    gradient: "from-blue-600 to-blue-400",
    bg: "bg-gradient-to-br from-blue-600/10 to-blue-400/10",
    border: "border-blue-500/30",
    followers: "Síguenos en Facebook",
    description: "Actualizaciones, precios, promociones y atención al cliente directa.",
  },
];

const videoLinks = [
  {
    platform: "Instagram",
    icon: SiInstagram,
    color: "text-pink-500",
    borderColor: "border-pink-500/40",
    bgColor: "bg-pink-500/10",
    label: "Ver Reels en Instagram",
    url: `${INSTAGRAM_URL}/reels/`,
  },
  {
    platform: "TikTok",
    icon: SiTiktok,
    color: "text-red-400",
    borderColor: "border-red-400/40",
    bgColor: "bg-red-400/10",
    label: "Ver Videos en TikTok",
    url: TIKTOK_URL,
  },
  {
    platform: "Facebook",
    icon: SiFacebook,
    color: "text-blue-500",
    borderColor: "border-blue-500/40",
    bgColor: "bg-blue-500/10",
    label: "Ver Videos en Facebook",
    url: `${FACEBOOK_URL}&sk=videos`,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90 } },
};

export function SocialFeed() {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden" id="redes">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            CONTENIDO EN VIVO
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4">
            Síguenos en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-primary to-blue-500">
              Redes Sociales
            </span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Mira nuestros proyectos en tiempo real — videos, reels y behind-the-scenes de cada impresión.
          </p>
        </motion.div>

        {/* Platform Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <motion.a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-social-${p.name.toLowerCase()}`}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`glass-panel rounded-2xl p-7 flex flex-col gap-5 border ${p.border} ${p.bg} group cursor-pointer transition-all duration-300`}
              >
                {/* Icon & platform name */}
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div>
                  <h3 className="text-lg font-bold font-sans text-foreground mb-1">{p.name}</h3>
                  <p className="text-sm font-mono text-primary">{p.handle}</p>
                </div>

                <p className="text-sm text-muted-foreground font-mono leading-relaxed flex-1">
                  {p.description}
                </p>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${p.gradient} text-white text-sm font-bold font-mono w-full justify-center group-hover:opacity-90 transition-opacity`}>
                  {p.followers}
                  <ExternalLink className="w-3 h-3" />
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Connect CTA banner */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="glass-panel rounded-2xl overflow-hidden border border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Instagram big CTA */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cta-instagram"
                className="group flex flex-col items-center text-center p-10 gap-4 hover:bg-pink-500/5 transition-colors duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <SiInstagram className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg font-sans text-foreground">Instagram</p>
                  <p className="font-mono text-sm text-pink-500">@rookiemakers3d</p>
                </div>
                <p className="text-sm text-muted-foreground font-mono">Fotos, reels y stories de nuestros proyectos</p>
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-orange-400 text-white text-sm font-bold group-hover:opacity-90 transition-opacity">
                  Ver perfil <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              {/* TikTok big CTA */}
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cta-tiktok"
                className="group flex flex-col items-center text-center p-10 gap-4 hover:bg-red-500/5 transition-colors duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black via-[#EE1D52] to-[#69C9D0] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <SiTiktok className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg font-sans text-foreground">TikTok</p>
                  <p className="font-mono text-sm text-red-400">@rookiemakers3d</p>
                </div>
                <p className="text-sm text-muted-foreground font-mono">Videos virales de impresión en tiempo real</p>
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#EE1D52] to-[#69C9D0] text-white text-sm font-bold group-hover:opacity-90 transition-opacity">
                  Ver videos <ExternalLink className="w-3 h-3" />
                </span>
              </a>

              {/* Facebook big CTA */}
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cta-facebook"
                className="group flex flex-col items-center text-center p-10 gap-4 hover:bg-blue-500/5 transition-colors duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <SiFacebook className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg font-sans text-foreground">Facebook</p>
                  <p className="font-mono text-sm text-blue-500">Rookie Makers 3D</p>
                </div>
                <p className="text-sm text-muted-foreground font-mono">Actualizaciones, precios y atención directa</p>
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold group-hover:bg-blue-700 transition-colors">
                  Ver página <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Video section — quick links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h3 className="text-xl font-bold font-sans text-foreground mb-6 flex items-center gap-3">
            <Play className="text-primary w-5 h-5" />
            Videos y Reels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {videoLinks.map((v) => {
              const Icon = v.icon;
              return (
                <motion.a
                  key={v.platform}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-video-${v.platform.toLowerCase()}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-4 p-5 rounded-xl border ${v.borderColor} ${v.bgColor} glass-panel group transition-all duration-200`}
                >
                  <div className={`p-3 rounded-lg ${v.bgColor} border ${v.borderColor}`}>
                    <Icon className={`w-6 h-6 ${v.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm font-sans ${v.color}`}>{v.platform}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{v.label}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                </motion.a>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground font-mono mt-8 max-w-xl mx-auto">
            Haz click en cualquier red para ver nuestro contenido mas reciente de impresion 3D, time-lapses y proyectos especiales.
          </p>
        </motion.div>

        {/* Galería de fotos (mismo set que arriba; aquí todas visibles — luego puedes mezclar videos) */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.05 }}
        >
          <h3 className="text-xl font-bold font-sans text-foreground mb-2 flex items-center gap-3">
            <Images className="text-primary w-5 h-5" />
            Fotos de proyectos
          </h3>
          <p className="text-sm text-muted-foreground font-mono mb-6 max-w-2xl">
            Todas las referencias fotográficas de nuestros trabajos. Más adelante aquí podrán ir videos embebidos junto a esta galería.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {ALL_PORTFOLIO_IMAGES.map(({ src, alt }) => (
              <div
                key={src}
                className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-muted/20 group"
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
        </motion.div>
      </div>
    </section>
  );
}
