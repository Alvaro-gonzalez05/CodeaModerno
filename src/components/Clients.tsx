"use client";
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Slide, Fade } from "react-awesome-reveal";

gsap.registerPlugin(ScrollTrigger);

const clients = [
  { name: "Birita", src: "/clients/birita.svg" },
  { name: "Lithium", src: "/clients/lithium.svg" },
  { name: "El Sitio", src: "/clients/elsitio.svg" },
  { name: "Move", src: "/clients/move.svg" },
  { name: "Restobar", src: "/clients/restobar.svg" },
  { name: "Sune", src: "/clients/sune_v2.svg" },
  { name: "Wine", src: "/clients/wine.svg" },
];

function shuffleArray(array: typeof clients) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
  const [row1Clients, setRow1Clients] = useState(clients);
  const [row2Clients, setRow2Clients] = useState(clients);

  useEffect(() => {
    const r1 = shuffleArray(clients);
    let r2 = shuffleArray(clients);

    // Try to ensure no matching logos at the same index (Derangement)
    let attempts = 0;
    while (r1.some((c, i) => c.name === r2[i].name) && attempts < 20) {
      r2 = shuffleArray(clients);
      attempts++;
    }

    setRow1Clients(r1);
    setRow2Clients(r2);
  }, []);

  useGSAP(() => {
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;
    
    if (!row1 || !row2) return;

    // Initial infinite scroll animations
    // Row 1: Right to Left (0 -> -50%)
    tl1Ref.current = gsap.to(row1, {
      xPercent: -50,
      duration: 80,
      ease: "none",
      repeat: -1
    });

    // Row 2: Left to Right (-50% -> 0)
    gsap.set(row2, { xPercent: -50 });
    tl2Ref.current = gsap.to(row2, {
      xPercent: 0,
      duration: 80,
      ease: "none",
      repeat: -1
    });

    // Scroll velocity effect
    ScrollTrigger.create({
      trigger: spacerRef.current, // Use spacer as trigger
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        // Smoother velocity effect
        const timeScale = 1 + Math.abs(velocity / 3000); 
        
        if (tl1Ref.current && tl2Ref.current) {
          gsap.to([tl1Ref.current, tl2Ref.current], {
            timeScale: timeScale,
            duration: 0.5,
            overwrite: true
          });
          
          // Return to normal speed
          gsap.to([tl1Ref.current, tl2Ref.current], {
            timeScale: 1,
            duration: 1.5,
            delay: 0.1
          });
        }
      }
    });

    // Visibility trigger
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        gsap.to(containerRef.current, { autoAlpha: 1, duration: 0.1 });
        setKey(prev => prev + 1);
        
        // Fade in rows
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
      <section ref={containerRef} className="clients-fixed-section py-20 md:py-32 bg-black text-white overflow-hidden fixed top-0 left-0 w-full z-[15] h-screen flex flex-col justify-center opacity-0 invisible">
        
        <div className="container mx-auto px-4 mb-12 md:mb-24 flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-30">
          <div>
            <p className="text-xs md:text-sm tracking-[0.3em] text-[#c2f254] font-bold mb-4 uppercase" style={{ color: 'hsl(76, 85%, 67%)' }}>
              Nuestra Experiencia
            </p>
            <Slide key={`title-${key}`} direction="up" triggerOnce={false}>
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                POTENCIANDO LAS <br className="hidden md:block"/>
                <span className="text-transparent border-text" style={{ WebkitTextStroke: '2px white' }}>VENTAS</span> DE <br className="hidden md:block"/>
                NUESTROS CLIENTES
              </h2>
            </Slide>
          </div>
        </div>

        <div ref={rowsContainerRef} className="flex flex-col gap-4 md:gap-8 opacity-0 relative z-20">
          {/* Row 1: Right to Left */}
          <div className="flex whitespace-nowrap overflow-hidden relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 pointer-events-none z-0"></div>
            <div ref={row1Ref} className="flex gap-0 md:gap-0 items-center pr-0 md:pr-0 w-max z-10 relative">
              {[...row1Clients, ...row1Clients, ...row1Clients, ...row1Clients].map((client, i) => (
                <Link
                  href="/trabajos"
                  key={i} 
                  className="relative h-24 sm:h-32 md:h-48 w-40 sm:w-64 md:w-96 mx-4 md:mx-8 brightness-0 invert opacity-40 hover:opacity-100 hover:brightness-100 hover:invert-0 hover:-translate-y-4 transition-all duration-500 cursor-pointer block z-20"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Row 2: Left to Right */}
          <div className="flex whitespace-nowrap overflow-hidden relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 pointer-events-none z-0"></div>
            <div ref={row2Ref} className="flex gap-0 md:gap-0 items-center pr-0 md:pr-0 w-max z-10 relative">
              {[...row2Clients, ...row2Clients, ...row2Clients, ...row2Clients].map((client, i) => (
                <Link
                  href="/trabajos"
                  key={i} 
                  className="relative h-24 sm:h-32 md:h-48 w-40 sm:w-64 md:w-96 mx-4 md:mx-8 brightness-0 invert opacity-40 hover:opacity-100 hover:brightness-100 hover:invert-0 hover:-translate-y-4 transition-all duration-500 cursor-pointer block z-20"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
