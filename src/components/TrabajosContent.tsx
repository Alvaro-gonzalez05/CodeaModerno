"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const trabajos = [
  {
    title: "EL SITIO RESTO",
    client: "Gestión de Redes & UCOBOT",
    description: "DESARROLLAMOS UNA ESTRATEGIA INTEGRAL DE CONTENIDO PARA SUS REDES SOCIALES E IMPLEMENTAMOS UCOBOT PARA AUTOMATIZAR LA RESERVA DE MESAS Y LA ATENCIÓN AL CLIENTE VÍA WHATSAPP, OPTIMIZANDO SUS TIEMPOS DE RESPUESTA.",
    align: "left",
    imageMock: "Mockup El Sitio", 
  },
  {
    title: "MOVE FEEL PERFORM",
    client: "E-Commerce",
    description: "CREAMOS UNA TIENDA ONLINE ESCALABLE Y DE ALTO RENDIMIENTO, ENFOCADA EN UNA EXPERIENCIA DE USUARIO FLUIDA PARA MAXIMIZAR SUS VENTAS Y AUTOMATIZAR LA GESTIÓN DE SU INVENTARIO.",
    align: "right",
    imageMock: "Mockup Move Feel", 
    imageColor: "bg-[hsl(76,85%,67%)]",
  },
  {
    title: "MÉTODO RAP",
    client: "Solución 360°",
    description: "IMPLEMENTAMOS UNA SOLUCIÓN DIGITAL COMPLETA: DESARROLLO DE UN SISTEMA A MEDIDA PARA SU OPERATIVA, DISEÑO DE UNA LANDING PAGE ORIENTADA A CONVERSIÓN Y GESTIÓN ACTIVA DE SUS REDES SOCIALES.",
    align: "left",
    imageMock: "Mockup Metodo RAP",
    imageColor: "bg-[hsl(76,85%,67%)]",
  }
];

export default function TrabajosContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Animación del título principal
    gsap.from(".main-title span", {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
    });

    // Animación de los bloques de trabajos usando matchMedia para responsiveness
    const mm = gsap.matchMedia();

    mm.add({
      isDesktop: "(min-width: 768px)",
      isMobile: "(max-width: 767px)"
    }, (context) => {
      const { isMobile } = context.conditions as { isMobile: boolean };
      
      const projectBlocks = gsap.utils.toArray<HTMLElement>('.project-block');
      
      projectBlocks.forEach((block, index) => {
        const isLeft = index % 2 === 0;
        const elementsToAnimate = block.querySelectorAll('.project-content');
        
        const xOffset = isMobile ? (isLeft ? -50 : 50) : (isLeft ? -150 : 150);
        
        gsap.fromTo(elementsToAnimate, 
          {
            x: xOffset,
            y: isMobile ? 50 : 0,
            opacity: 0.2,
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: block,
              start: isMobile ? "top 90%" : "top 95%",
              end: isMobile ? "center 70%" : "center 50%",
              scrub: 1,
            }
          }
        );
      });
    });

    // Animación del Call to Action Final
    gsap.from(".cta-section", {
      y: 100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".cta-section",
        start: "top 85%",
        toggleActions: "play none none reverse",
      }
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full pt-32 pb-40 px-4 md:px-8 max-w-[1400px] mx-auto min-h-screen relative z-10">
      
      {/* Título Principal */}
      <div className="text-center mb-24 md:mb-40 uppercase pt-10">
        <p className="text-xs md:text-sm tracking-[0.3em] font-bold mb-6" style={{ color: 'hsl(76, 85%, 67%)' }}>PORTAFOLIO</p>
        <h1 className="text-[14vw] leading-[0.85] font-black tracking-tighter text-white overflow-hidden main-title flex flex-col justify-center items-center">
          <span className="inline-block text-transparent w-full break-words" style={{ WebkitTextStroke: '2px white' }}>NUESTROS</span>
          <span className="inline-block w-full break-words">TRABAJOS</span>
        </h1>
      </div>

      {/* Lista de Trabajos */}
      <div className="space-y-24 md:space-y-48">
        {trabajos.map((trabajo, index) => (
          <div key={index} className={`project-block flex flex-col md:flex-row items-center gap-8 md:gap-24 ${trabajo.align === 'right' ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
            
            {/* Texto del Proyecto */}
            <div className={`w-full md:w-1/2 project-content ${trabajo.align === 'right' ? 'text-right' : 'text-left'}`}>
              <p className="text-xs md:text-sm tracking-[0.2em] font-bold uppercase mb-2 md:mb-4 text-gray-400">
                {trabajo.client}
              </p>
              <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-8 leading-none ${trabajo.align === 'right' ? 'text-[#c2f254]' : 'text-white'}`} style={{ color: trabajo.align === 'right' ? 'hsl(76, 85%, 67%)' : undefined }}>
                {trabajo.title}
              </h2>
              <div className="text-xs md:text-base tracking-[0.1em] font-semibold leading-relaxed text-gray-300 md:text-gray-200">
                <p>{trabajo.description}</p>
              </div>
              <button className="mt-8 group flex items-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white text-xs md:text-sm font-bold tracking-widest uppercase rounded-full hover:border-[hsl(76,85%,67%)] hover:text-[hsl(76,85%,67%)] transition-colors duration-300 w-fit">
                Ver Proyecto
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            {/* Imagen Mockup del trabajo (Placeholder visual) */}
            <div className="w-full md:w-1/2 flex justify-center project-content">
              <div className={`relative w-full max-w-[500px] aspect-[4/3] rounded-[2rem] overflow-hidden flex items-center justify-center p-8 transition-transform duration-500 hover:scale-105 ${trabajo.imageColor || 'bg-neutral-800'}`}>
                 {/* Visual Mock Text / Placeholder */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                 
                 <div className="bg-black/80 backdrop-blur-sm shadow-2xl rounded-2xl w-full h-full border border-white/10 flex items-center justify-center p-6 text-center z-10">
                    <span className="font-bold text-xl md:text-2xl tracking-tight opacity-80 uppercase uppercase-stroke" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)', color: 'transparent' }}>
                       [{trabajo.imageMock}]
                    </span>
                 </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* CTA Final */}
      <div className="mt-40 cta-section bg-gradient-to-b from-neutral-900 to-black border border-white/10 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 md:mb-8">
          ¿LISTO PARA QUE <span style={{ color: 'hsl(76, 85%, 67%)' }}>TU PROYECTO</span> SEA EL PRÓXIMO?
        </h2>
        <p className="max-w-2xl text-xs md:text-sm font-bold tracking-widest leading-relaxed uppercase text-gray-400 mb-10">
          AGENDA UNA LLAMADA CON NOSOTROS Y VEAMOS CÓMO PODEMOS AYUDARTE A LOGRAR TUS OBJETIVOS DIGITALES.
        </p>
      </div>

    </div>
  );
}