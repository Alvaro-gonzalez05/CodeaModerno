"use client";
import { Slide } from "react-awesome-reveal";
import { useState, useEffect } from "react";
import { useModal } from "@/context/ModalContext";

export default function Hero() {
  const { openModal } = useModal();
  const [key, setKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Hero is 100vh. When scrollY > windowHeight, it's fully covered by the next section.
      if (scrollY > windowHeight) {
        if (isVisible) setIsVisible(false);
      } else {
        if (!isVisible) {
          setIsVisible(true);
          setKey(prev => prev + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  return (
    <>
    <div className="h-screen w-full relative z-0" /> {/* Spacer to preserve layout flow */}
    <section className="fixed top-0 left-0 h-screen w-full flex items-center justify-center overflow-hidden bg-black z-0">
      {/* Background video - put /hero-video.mp4 or /hero-video.webm into public/ */}
      <div className="absolute inset-0 bg-black">
        <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.jpg"
        >
            <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* dark overlay so the white text stays readable */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 text-center px-4 py-8">
        <Slide key={`title-${key}`} direction="left" triggerOnce={false}>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-6 text-white">
            codea desarrollos
          </h1>
        </Slide>
        <Slide key={`subtitle-${key}`} direction="right" triggerOnce={false}>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg md:text-xl leading-relaxed">
            Ayudamos a emprendedores visionarios a construir marcas del mañana a través de sitios webs y diversas soluciones tecnológicas.
          </p>
        </Slide>

        <Slide key={`buttons-${key}`} direction="up" triggerOnce={false} delay={200}>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-10 items-center">
             <button onClick={openModal} className="group flex items-center gap-3 px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform duration-300 hover:bg-gray-200">
                Empezar un proyecto
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
             </button>
             <button className="px-8 py-4 bg-transparent border border-white text-white text-lg font-bold rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-300">
                Contáctanos
             </button>
          </div>
        </Slide>
      </div>
    </section>
    </>
  );
}
