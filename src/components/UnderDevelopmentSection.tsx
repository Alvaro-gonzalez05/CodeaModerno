"use client";
import React from 'react';
import Link from 'next/link';
import { Slide } from "react-awesome-reveal";

interface UnderDevelopmentSectionProps {
  id: string;
  line1: string;
  line2: string;
  line3: string;
}

export default function UnderDevelopmentSection({ id, line1, line2, line3 }: UnderDevelopmentSectionProps) {
  return (
    <>
      <section id={id} className="fixed top-0 left-0 z-0 w-full h-screen text-white flex flex-col items-center justify-center overflow-hidden py-20 bg-black">
         {/* Stars Layer */}
         <div className="absolute inset-0 z-10 pointer-events-none">
             <div className="absolute top-10 left-0 -translate-x-1/4 w-32 h-32 md:w-64 md:h-64 text-neutral-800 opacity-50">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                   <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
                </svg>
             </div>
             
             <div className="absolute top-20 right-10 w-24 h-24 md:w-48 md:h-48 text-neutral-800 opacity-50">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                   <path className="shape-star" d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" />
                </svg>
             </div>

             <div className="absolute bottom-10 right-0 translate-x-1/4 w-40 h-40 md:w-80 md:h-80 text-neutral-800 opacity-50">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                   <path className="shape-star" d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" />
                </svg>
             </div>
             
             <div className="absolute bottom-20 left-10 w-20 h-20 md:w-40 md:h-40 text-neutral-800 opacity-50">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                   <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
                </svg>
             </div>
         </div>

         {/* Content */}
         <div className="text-center z-20 relative w-full px-4">
            <h2 className="text-[13vw] md:text-[11vw] leading-[0.85] font-black tracking-tighter uppercase flex flex-col items-center mb-12">
              <Slide direction="right" triggerOnce>
                  <span className="block">{line1}</span>
              </Slide>
              <Slide direction="left" triggerOnce>
                  <span className="block text-violet-400">{line2}</span>
              </Slide>
              <Slide direction="right" triggerOnce>
                  <span className="block">{line3}</span>
              </Slide>
            </h2>
            
            <Link href="/" className="group inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-white text-white text-lg md:text-xl font-bold rounded-full hover:scale-105 transition-transform duration-300 hover:bg-white/10">
                Volver al inicio
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </Link>
         </div>

      </section>
      {/* Spacer to push footer down */}
      <div className="w-full h-screen"></div>
    </>
  );
}
