"use client";
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
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
    setRow1Clients(shuffleArray(clients));
    setRow2Clients(shuffleArray(clients));
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
      <div ref={spacerRef} className="h-screen w-full relative z-0 pointer-events-none" />
      <section ref={containerRef} className="clients-fixed-section py-10 md:py-20 bg-black text-white overflow-hidden fixed top-0 left-0 w-full z-[15] h-screen flex flex-col justify-center opacity-0 invisible">
        <div className="container mx-auto px-4 mb-8 md:mb-16">
          <Slide key={`title-${key}`} direction="left" triggerOnce={false}>
            <h2 className="text-3xl md:text-[40px] font-normal max-w-3xl leading-tight text-[#D6D6D6]">
              Potenciando las ventas de nuestros clientes
            </h2>
          </Slide>
        </div>

        <div ref={rowsContainerRef} className="flex flex-col gap-2 md:gap-4 opacity-0">
          {/* Row 1: Right to Left */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row1Ref} className="flex gap-0 md:gap-0 items-center pr-0 md:pr-0 w-max">
              {[...row1Clients, ...row1Clients, ...row1Clients, ...row1Clients].map((client, i) => (
                <div 
                  key={i} 
                  className="relative h-52 md:h-80 w-96 md:w-[35rem] -mx-8 md:-mx-16 brightness-0 invert opacity-70 hover:opacity-100 hover:-translate-y-4 transition-all duration-300 cursor-pointer"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Left to Right */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row2Ref} className="flex gap-0 md:gap-0 items-center pr-0 md:pr-0 w-max">
              {[...row2Clients, ...row2Clients, ...row2Clients, ...row2Clients].map((client, i) => (
                <div 
                  key={i} 
                  className="relative h-52 md:h-80 w-96 md:w-[35rem] -mx-8 md:-mx-16 brightness-0 invert opacity-70 hover:opacity-100 hover:-translate-y-4 transition-all duration-300 cursor-pointer"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
