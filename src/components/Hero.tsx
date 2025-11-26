"use client";
import { Slide } from "react-awesome-reveal";
import { useState, useEffect } from "react";

export default function Hero() {
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
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

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
      </div>
    </section>
    </>
  );
}
