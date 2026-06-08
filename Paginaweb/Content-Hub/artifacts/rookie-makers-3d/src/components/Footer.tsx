import { SiInstagram, SiTiktok, SiFacebook } from 'react-icons/si';
import { erpLoginUrl } from '@/lib/erpLoginUrl';

const INSTAGRAM_URL = "https://www.instagram.com/rookiemakers3d";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61553700448358";
const TIKTOK_URL = "https://www.tiktok.com/@rookiemakers3d";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-2xl font-bold font-sans text-foreground mb-2 tracking-tighter">
              Rookie Makers <span className="text-primary">3D</span>
            </h3>
            <p className="text-muted-foreground font-mono text-xs">
              Hecho con pasión y filamento en México 🇲🇽
            </p>
          </div>

          <div className="flex gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-instagram"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/20 transition-colors border border-border hover:border-pink-500/50"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-tiktok"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border"
            >
              <SiTiktok className="w-4 h-4" />
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-facebook"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/20 transition-colors border border-border hover:border-blue-500/50"
            >
              <SiFacebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <ul className="flex flex-wrap gap-4 md:gap-6 text-xs font-mono text-muted-foreground">
            <li><a href="#services" className="hover:text-primary transition-colors">Servicios</a></li>
            <li><a href="#calculator" className="hover:text-primary transition-colors">Cotizador</a></li>
            <li><a href="#galeria" className="hover:text-primary transition-colors">Proyectos</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contacto</a></li>
            <li>
              <a href={erpLoginUrl()} className="hover:text-primary transition-colors font-medium text-primary/90">
                Entrar al sistema
              </a>
            </li>
          </ul>
          <p className="text-xs font-mono text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Rookie Makers 3D. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
