import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X, LogIn } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { erpLoginUrl } from "@/lib/erpLoginUrl";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Servicios", href: "#services" },
    { label: "Cotizar", href: "#calculator" },
    { label: "Proyectos", href: "#galeria" },
    { label: "Redes", href: "#redes" },
    { label: "Contacto", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-bold text-xl font-sans tracking-tight text-foreground flex items-center gap-2">
          <span className="text-primary font-mono">RM</span>
          <span className="hidden sm:inline">Rookie Makers 3D</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-wider"
            >
              {l.label}
            </a>
          ))}
          <a
            href={erpLoginUrl()}
            className="text-sm font-mono uppercase tracking-wider px-3 py-1.5 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-colors duration-200 inline-flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="button-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-primary/20 px-4 pb-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider border-b border-border/30"
            >
              {l.label}
            </a>
          ))}
          <a
            href={erpLoginUrl()}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-3 text-sm font-mono text-primary uppercase tracking-wider border-b border-border/30"
          >
            <LogIn className="w-4 h-4" />
            Entrar al sistema (ERP)
          </a>
        </div>
      )}
    </nav>
  );
}
