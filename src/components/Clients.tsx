"use client";
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Slide } from "react-awesome-reveal";
import { proyectos, type Proyecto } from '@/lib/proyectos';

gsap.registerPlugin(ScrollTrigger);

// Dividimos los proyectos en dos filas para el carrusel
const mid = Math.ceil(proyectos.length / 2);
const row1Projects = proyectos.slice(0, mid);
const row2Projects = proyectos.slice(mid);

function ProjectCard({ project }: { project: Proyecto }) {
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block mx-2.5 md:mx-4 w-[62vw] sm:w-[320px] md:w-[400px] aspect-[16/9] rounded-2xl md:rounded-[1.75rem] overflow-hidden border border-white/10 shadow-2xl shrink-0 transition-all duration-500 hover:-translate-y-3 hover:border-white/40"
    >
      <Image
        src={project.cover}
        alt={`Portada del proyecto ${project.name}`}
        fill
        sizes="(max-width: 640px) 62vw, (max-width: 768px) 320px, 400px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* Glow de acento al hacer hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 80px -20px ${project.accent}` }}
      />
      {/* CTA flotante */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
        <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {project.name}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-black bg-white px-3 py-1.5 rounded-full">
          Ver sitio
          <span className="transition-transform group-hover:translate-x-0.5">↗</span>
        </span>
      </div>
    </a>
  );
}

export default function Clients() {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const tl1Ref = useRef<gsap.core.Tween | null>(null);
  const tl2Ref = useRef<gsap.core.Tween | null>(null);
  const [key, setKey] = useState(0);

  useGSAP(() => {
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;

    if (!row1 || !row2) return;

    // Scroll infinito
    // Fila 1: derecha -> izquierda
    tl1Ref.current = gsap.to(row1, {
      xPercent: -50,
      duration: 60,
      ease: "none",
      repeat: -1
    });

    // Fila 2: izquierda -> derecha
    gsap.set(row2, { xPercent: -50 });
    tl2Ref.current = gsap.to(row2, {
      xPercent: 0,
      duration: 60,
      ease: "none",
      repeat: -1
    });

    // Efecto de velocidad al hacer scroll
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const timeScale = 1 + Math.abs(velocity / 3000);

        if (tl1Ref.current && tl2Ref.current) {
          gsap.to([tl1Ref.current, tl2Ref.current], {
            timeScale: timeScale,
            duration: 0.5,
            overwrite: true
          });
          gsap.to([tl1Ref.current, tl2Ref.current], {
            timeScale: 1,
            duration: 1.5,
            delay: 0.1
          });
        }
      }
    });

    // Visibilidad de la sección fija
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        gsap.to(containerRef.current, { autoAlpha: 1, duration: 0.1 });
        setKey(prev => prev + 1);
        gsap.fromTo(rowsContainerRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.2 }
        );
      },
      onLeaveBack: () => {
        gsap.to(containerRef.current, { autoAlpha: 0, duration: 0.1 });
        gsap.set(rowsContainerRef.current, { opacity: 0, y: 50 });
      },
    });

  }, { scope: containerRef });

  const handleMouseEnter = () => {
    tl1Ref.current?.pause();
    tl2Ref.current?.pause();
  };

  const handleMouseLeave = () => {
    tl1Ref.current?.play();
    tl2Ref.current?.play();
  };

  return (
    <>
      <div ref={spacerRef} className="h-[150vh] w-full relative z-0 pointer-events-none" />
      <section ref={containerRef} className="clients-fixed-section py-10 md:py-16 bg-black text-white overflow-hidden fixed top-0 left-0 w-full z-[15] h-screen flex flex-col justify-center opacity-0 invisible">

        <div className="container mx-auto px-4 md:px-8 mb-6 md:mb-10 flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-6 relative z-30">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.3em] font-bold mb-3 md:mb-4 uppercase" style={{ color: 'hsl(76, 85%, 67%)' }}>
              Nuestros Proyectos
            </p>
            <Slide key={`title-${key}`} direction="up" triggerOnce={false}>
              <h2 className="text-[2rem] sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] md:leading-[0.9] text-white">
                DISEÑO Y CÓDIGO <br className="hidden md:block" />
                <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>QUE GENERAN</span> <br className="hidden md:block" />
                RESULTADOS
              </h2>
            </Slide>
          </div>
          <Link
            href="/proyectos"
            className="group hidden md:flex items-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white text-xs md:text-sm font-bold tracking-widest uppercase rounded-full hover:border-[hsl(76,85%,67%)] hover:text-[hsl(76,85%,67%)] transition-colors duration-300 w-fit shrink-0"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div
          ref={rowsContainerRef}
          className="flex flex-col gap-3 md:gap-5 opacity-0 relative z-20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Fila 1 */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row1Ref} className="flex items-center w-max">
              {[...row1Projects, ...row1Projects, ...row1Projects, ...row1Projects].map((project, i) => (
                <ProjectCard key={`r1-${i}`} project={project} />
              ))}
            </div>
          </div>

          {/* Fila 2 */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row2Ref} className="flex items-center w-max">
              {[...row2Projects, ...row2Projects, ...row2Projects, ...row2Projects].map((project, i) => (
                <ProjectCard key={`r2-${i}`} project={project} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA mobile */}
        <div className="container mx-auto px-4 mt-6 flex md:hidden justify-center relative z-30">
          <Link
            href="/proyectos"
            className="group flex items-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:border-[hsl(76,85%,67%)] hover:text-[hsl(76,85%,67%)] transition-colors duration-300"
          >
            Ver todos los proyectos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
