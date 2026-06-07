import { NeonCursor } from "@/components/NeonCursor";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Calculator } from "@/components/Calculator";
import { Gallery } from "@/components/Gallery";
import { SocialFeed } from "@/components/SocialFeed";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { PortfolioMosaic } from "@/components/PortfolioMosaic";
import { ProductosComprables } from "@/components/ProductosComprables";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <NeonCursor />
      <Navbar />
      <Hero />
      <Services />
      <Calculator />
      <Gallery />
      <SocialFeed />
      <Testimonials />
      <Contact />
      <PortfolioMosaic />
      <ProductosComprables />
      <Footer />
      <Chatbot />
    </main>
  );
}
