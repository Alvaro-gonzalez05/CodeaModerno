import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Clients from "@/components/Clients";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Header />
      <main>
        <Hero />
        <div className="relative z-20">
          <Gallery />
        </div>
        <Clients />
      </main>
    </div>
  );
}
