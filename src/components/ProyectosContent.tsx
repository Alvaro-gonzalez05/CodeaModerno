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

    // Bloques de proyectos entrando desde los costados (igual a /trabajos)
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
    <div ref={containerRef} className="w-full pt-32 pb-40 px-4 md:px-8 max-w-[1400px] mx-auto min-h-screen relative z-10 overflow-hidden">

      {/* Título Principal */}
      <div className="text-center mb-20 md:mb-40 uppercase pt-10">
        <p className="text-xs md:text-sm tracking-[0.3em] font-bold mb-6" style={{ color: 'hsl(76, 85%, 67%)' }}>PORTAFOLIO · {proyectos.length} PROYECTOS</p>
        <h1 className="text-[14vw] leading-[0.85] font-black tracking-tighter text-white overflow-hidden main-title flex flex-col justify-center items-center">
          <span className="inline-block text-transparent w-full break-words" style={{ WebkitTextStroke: '2px white' }}>NUESTROS</span>
          <span className="inline-block w-full break-words">PROYECTOS</span>
        </h1>
        <p className="mt-8 max-w-2xl mx-auto text-xs md:text-base tracking-[0.1em] font-semibold leading-relaxed text-gray-400 normal-case">
          Una selección de experiencias digitales que diseñamos y desarrollamos a medida. Hacé click en cualquiera para explorar el sitio en vivo.
        </p>
      </div>

      {/* Lista de Proyectos (bloques alternados) */}
      <div className="space-y-24 md:space-y-48">
        {proyectos.map((project, index) => {
          const isRight = index % 2 !== 0;
          return (
            <div
              key={project.slug}
              className={`project-block flex flex-col md:flex-row items-center gap-8 md:gap-24 ${isRight ? 'md:flex-row-reverse text-right' : 'text-left'}`}
            >
              {/* Texto del Proyecto */}
              <div className={`w-full md:w-1/2 project-content ${isRight ? 'text-right' : 'text-left'}`}>
                <p className="text-xs md:text-sm tracking-[0.2em] font-bold uppercase mb-2 md:mb-4 text-gray-400">
                  {project.category}
                </p>
                <h2
                  className={`text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-8 leading-none ${isRight ? 'text-[#c2f254]' : 'text-white'}`}
                  style={{ color: isRight ? 'hsl(76, 85%, 67%)' : undefined }}
                >
                  {project.name}
                </h2>
                <div className="text-xs md:text-base tracking-[0.1em] font-semibold leading-relaxed text-gray-300 md:text-gray-200">
                  <p>{project.description}</p>
                </div>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 group inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white text-xs md:text-sm font-bold tracking-widest uppercase rounded-full hover:border-[hsl(76,85%,67%)] hover:text-[hsl(76,85%,67%)] transition-colors duration-300 w-fit ${isRight ? 'ml-auto' : ''}`}
                >
                  Ver Proyecto
                  <span className="group-hover:translate-x-1 transition-transform">↗</span>
                </a>
              </div>

              {/* Portada del proyecto — completa, sin nada encima */}
              <div className="w-full md:w-1/2 flex justify-center project-content">
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full max-w-[560px] rounded-2xl md:rounded-[1.75rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-white/40"
                >
                  <Image
                    src={project.cover}
                    alt={`Portada del proyecto ${project.name}`}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 768px) 100vw, 560px"
                    className="w-full h-auto"
                  />
                </a>
              </div>
            </div>
          );
        })}
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
