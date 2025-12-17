import type { Metadata } from "next";
import Header from "@/components/Header";
import UnderDevelopmentSection from "@/components/UnderDevelopmentSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Trabajos",
  description: "Explora nuestro portafolio de proyectos de desarrollo web y software. Codea Desarrollos.",
};

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Header />
      <main className="w-full">
        <UnderDevelopmentSection id="work" line1="TRABAJOS" line2="EN" line3="DESARROLLO" />
        <Footer />
      </main>
    </div>
  );
}
