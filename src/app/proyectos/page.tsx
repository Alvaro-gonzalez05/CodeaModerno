import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProyectosContent from "@/components/ProyectosContent";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Explorá todos los proyectos de desarrollo web y software creados por Codea Desarrollos. Sitios en vivo, landing pages, e-commerce y sistemas a medida.",
  alternates: {
    canonical: '/proyectos',
  },
};

export default function ProyectosPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#c2f254] selection:text-black">
      {/* Fondo de estrellas igual al de servicios */}
      <div className="fixed inset-0 z-0 bg-transparent" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 130px 80px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 160px 120px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px', opacity: 0.15 }} />

      <Header />
      <main className="w-full">
        <ProyectosContent />
        <Footer />
      </main>
    </div>
  );
}
