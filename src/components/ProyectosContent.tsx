"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useModal } from '@/context/ModalContext';
import { proyectos } from '@/lib/proyectos';

gsap.registerPlugin(ScrollTrigger);

export default function ProyectosContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  useGSAP(() => {
    // Título principal
    gsap.from(".main-title span", {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
    });

    // Aparición de cada tarjeta de proyecto
    const cards = gsap.utils.toArray<HTMLElement>('.project-card');
    cards.forEach((card) => {
      gsap.fromTo(card,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none reverse",
          }
        }
      );
    });

    // CTA final
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
      <div className="text-center mb-20 md:mb-32 uppercase pt-10">
        <p className="text-xs md:text-sm tracking-[0.3em] font-bold mb-6" style={{ color: 'hsl(76, 85%, 67%)' }}>PORTAFOLIO · {proyectos.length} PROYECTOS</p>
        <h1 className="text-[14vw] leading-[0.85] font-black tracking-tighter text-white overflow-hidden main-title flex flex-col justify-center items-center">
          <span className="inline-block text-transparent w-full break-words" style={{ WebkitTextStroke: '2px white' }}>NUESTROS</span>
          <span className="inline-block w-full break-words">PROYECTOS</span>
        </h1>
        <p className="mt-8 max-w-2xl mx-auto text-xs md:text-base tracking-[0.1em] font-semibold leading-relaxed text-gray-400 normal-case">
          Una selección de experiencias digitales que diseñamos y desarrollamos a medida. Hacé click en cualquiera para explorar el sitio en vivo.
        </p>
      </div>

      {/* Grilla de proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {proyectos.map((project) => (
          <a
            key={project.slug}
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="project-card group relative block rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-white/40"
          >
            <div className="relative w-full aspect-[16/9] overflow-hidden">
              <Image
                src={project.cover}
                alt={`Portada del proyecto ${project.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay degradado */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Glow de acento */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `inset 0 0 100px -30px ${project.accent}` }}
              />
            </div>

            {/* Info inferior */}
            <div className="flex items-center justify-between gap-4 p-5 md:p-7">
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs tracking-[0.2em] font-bold uppercase text-gray-500 truncate">
                  {project.category}
                </p>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white truncate mt-1 group-hover:text-[hsl(76,85%,67%)] transition-colors duration-300">
                  {project.name}
                </h2>
              </div>
              <span className="shrink-0 flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-transparent border border-white/30 text-white text-[10px] md:text-xs font-bold tracking-widest uppercase rounded-full group-hover:bg-[hsl(76,85%,67%)] group-hover:border-[hsl(76,85%,67%)] group-hover:text-black transition-all duration-300">
                Ver
                <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
              </span>
            </div>

            {/* Badge de año */}
            <span className="absolute top-4 right-4 md:top-5 md:right-5 px-3 py-1 text-[10px] md:text-xs font-bold tracking-widest text-white bg-black/50 backdrop-blur-sm border border-white/20 rounded-full">
              {project.year}
            </span>
          </a>
        ))}
      </div>

      {/* CTA Final */}
      <div className="mt-32 md:mt-40 cta-section bg-gradient-to-b from-neutral-900 to-black border border-white/10 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 md:mb-8">
          ¿LISTO PARA QUE <span style={{ color: 'hsl(76, 85%, 67%)' }}>TU PROYECTO</span> SEA EL PRÓXIMO?
        </h2>
        <p className="max-w-2xl text-xs md:text-sm font-bold tracking-widest leading-relaxed uppercase text-gray-400 mb-10">
          AGENDÁ UNA LLAMADA CON NOSOTROS Y VEAMOS CÓMO PODEMOS AYUDARTE A LOGRAR TUS OBJETIVOS DIGITALES.
        </p>
        <button
          onClick={openModal}
          className="group flex items-center gap-2 px-8 py-4 bg-[hsl(76,85%,67%)] text-black text-sm font-bold tracking-widest uppercase rounded-full hover:bg-white transition-colors duration-300"
        >
          Empezar un proyecto
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

    </div>
  );
}
