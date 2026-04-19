import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiciosContent from "@/components/ServiciosContent";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Conoce todos nuestros servicios y soluciones tecnológicas: Landing Pages, E-commerce, Sistemas a Medida, Ucobot, y Gestión de Redes y Contenido.",
  alternates: {
    canonical: '/servicios',
  },
};

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#c2f254] selection:text-black">
      <Header />
      <main className="w-full relative overflow-hidden bg-black">
        {/* Stars Layer background similar to about page */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-10 left-0 -translate-x-1/4 w-32 h-32 md:w-64 md:h-64 text-neutral-800 opacity-50">
               <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                  <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
               </svg>
            </div>
            
            <div className="absolute top-20 right-10 w-24 h-24 md:w-48 md:h-48 text-neutral-800 opacity-50">
               <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                  <path className="shape-star" d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" />
               </svg>
            </div>

            <div className="absolute bottom-10 right-0 translate-x-1/4 w-40 h-40 md:w-80 md:h-80 text-neutral-800 opacity-50">
               <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                  <path className="shape-star" d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" />
               </svg>
            </div>
            
            <div className="absolute bottom-20 left-10 w-20 h-20 md:w-40 md:h-40 text-neutral-800 opacity-50">
               <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                  <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
               </svg>
            </div>
        </div>

        <ServiciosContent />
        <Footer />
      </main>
    </div>
  );
}
