"use client";
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Slide, Fade } from "react-awesome-reveal";

gsap.registerPlugin(ScrollTrigger);

const clients = [
  "Penguin", "AWADA", "prestigio", "JANSPORT", "CHEEKY", 
  "LONGCHAMP", "PEPE ganga", "EQUUS", "VERS", "prestigio"
];

export default function Clients() {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);

  useGSAP(() => {
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;
    
    if (!row1 || !row2) return;

    // Initial infinite scroll animations
    // Row 1: Right to Left (0 -> -50%)
    const tl1 = gsap.to(row1, {
      xPercent: -50,
      duration: 80,
      ease: "none",
      repeat: -1
    });

    // Row 2: Left to Right (-50% -> 0)
    gsap.set(row2, { xPercent: -50 });
    const tl2 = gsap.to(row2, {
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
        
        gsap.to([tl1, tl2], {
          timeScale: timeScale,
          duration: 0.5,
          overwrite: true
        });
        
        // Return to normal speed
        gsap.to([tl1, tl2], {
          timeScale: 1,
          duration: 1.5,
          delay: 0.1
        });
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

  return (
    <>
      <div ref={spacerRef} className="h-screen w-full relative z-0 pointer-events-none" />
      <section ref={containerRef} className="py-20 bg-black text-white overflow-hidden fixed top-0 left-0 w-full z-[15] h-screen flex flex-col justify-center opacity-0 invisible">
        <div className="container mx-auto px-4 mb-16">
          <Slide key={`title-${key}`} direction="left" triggerOnce={false}>
            <h2 className="text-[40px] font-normal max-w-3xl leading-tight text-[#D6D6D6]">
              Potenciando las ventas de nuestros clientes
            </h2>
          </Slide>
        </div>

        <div ref={rowsContainerRef} className="flex flex-col gap-8 opacity-0">
          {/* Row 1: Right to Left */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row1Ref} className="flex gap-16 items-center pr-16 w-max">
              {[...clients, ...clients, ...clients, ...clients].map((client, i) => (
                <span key={i} className="text-3xl md:text-5xl font-serif italic text-gray-400 hover:text-white transition-colors cursor-pointer">
                  {client}
                </span>
              ))}
            </div>
          </div>

          {/* Row 2: Left to Right */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <div ref={row2Ref} className="flex gap-16 items-center pr-16 w-max">
              {[...clients, ...clients, ...clients, ...clients].map((client, i) => (
                <span key={i} className="text-3xl md:text-5xl font-serif italic text-gray-400 hover:text-white transition-colors cursor-pointer">
                  {client}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
