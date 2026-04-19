import type { Metadata } from "next";
import Header from "@/components/Header";
import TrabajosContent from "@/components/TrabajosContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Trabajos",
  description: "Explora nuestro portafolio de proyectos de desarrollo web y software. Codea Desarrollos.",
  alternates: {
    canonical: '/trabajos',
  },
};

export default function TrabajosPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Fondo de estrellas igual al de servicios */}
      <div className="fixed inset-0 z-0 bg-transparent" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 130px 80px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 160px 120px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px', opacity: 0.15 }} />

      <Header />
      <main className="w-full">
        <TrabajosContent />
        <Footer />
      </main>
    </div>
  );
}
