"use client";
import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useModal } from '@/context/ModalContext';

gsap.registerPlugin(ScrollTrigger);

export default function LetsCode() {
  const { openModal } = useModal();
  const spacerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for animation elements
  const arrowRef = useRef<HTMLDivElement>(null);
  const letsRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const yourRef = useRef<HTMLSpanElement>(null);
  const businessRef = useRef<HTMLSpanElement>(null);
  const finalTextRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const finalContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      }
    });

    // Initial State
    gsap.set([arrowRef.current, letsRef.current, codeRef.current, yourRef.current, businessRef.current, globeRef.current], { autoAlpha: 0 });
    gsap.set(codeRef.current, { x: 100 });
    gsap.set(yourRef.current, { x: -100 });
    gsap.set(businessRef.current, { x: 100 });
    gsap.set(finalTextRef.current, { autoAlpha: 0, scale: 0.8 });
    gsap.set(buttonRef.current, { autoAlpha: 0, y: 20 });

    // 1. Entrance Sequence (Much Slower)
    tl.to(arrowRef.current, { autoAlpha: 1, duration: 2 })
      .to(letsRef.current, { autoAlpha: 1, duration: 2 }, "<0.2")
      .to(codeRef.current, { x: 0, autoAlpha: 1, duration: 4, ease: "power2.out" }, "<0.2")
      .to(yourRef.current, { x: 0, autoAlpha: 1, duration: 4, ease: "power2.out" }, "<0.2")
      .to(businessRef.current, { x: 0, autoAlpha: 1, duration: 4, ease: "power2.out" }, "<0.2")
      .to(globeRef.current, { autoAlpha: 1, duration: 4 }, "<");

    // 2. Hold
    tl.to({}, { duration: 0.5 });

    // 3. Exit Sequence (Slower)
    // "YOUR" goes right
    tl.to(yourRef.current, { x: "100vw", autoAlpha: 0, duration: 3, ease: "power2.in" });
    
    // "CODE" and "BUSINESS" close gap
    tl.to(codeRef.current, { y: "35%", duration: 3, ease: "power2.inOut" }, "<")
      .to(businessRef.current, { y: "-35%", duration: 3, ease: "power2.inOut" }, "<");

    // "CODE" and "BUSINESS" go left together
    tl.to([codeRef.current, businessRef.current], { x: "-100vw", autoAlpha: 0, duration: 3, ease: "power2.in" }, "+=0.1");
    
    // Fade out "Let's" and Arrow and Globe
    tl.to([arrowRef.current, letsRef.current, globeRef.current], { autoAlpha: 0, duration: 3 }, "<");

    // 4. Final Reveal (Slower / More Scroll Distance)
    tl.to(finalTextRef.current, { autoAlpha: 1, scale: 1, duration: 4, ease: "back.out(1.2)" }, "-=0.3");

    // Fade out stars
    tl.to(".shape-star", { autoAlpha: 0, duration: 2 }, "<");
    
    // Fade out black overlay to reveal video (opacity 0.6 to match hero)
    tl.to(".bg-overlay", { autoAlpha: 0.6, duration: 3 }, "<");

    // Move text up to make room for button
    tl.to(finalTextRef.current, { y: -120, duration: 2, ease: "power2.inOut" });

    // Reveal button
    tl.to(buttonRef.current, { autoAlpha: 1, y: 0, duration: 2, ease: "power2.out" }, "<0.5");

    // Parallax effect: Move elements up when Footer enters
    gsap.to(finalContainerRef.current, {
      y: "-=500",
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1
      }
    });

  }, { scope: containerRef });

  return (
    <>
    <div ref={spacerRef} className="h-[500vh] w-full relative z-[25]" />
    <section 
      ref={containerRef}
      className="lets-code-fixed-section fixed top-0 left-0 w-full h-screen text-white flex flex-col items-center justify-center overflow-hidden py-20 z-[30] opacity-0 invisible"
    >
       {/* Video Background (Always playing, hidden by black layer initially) */}
       <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.jpg"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
       </div>

       {/* Black Background Overlay */}
       <div className="bg-overlay absolute inset-0 z-10 bg-black pointer-events-none"></div>

       {/* Stars Layer: Grey stars on top */}
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
       <div className="text-center z-20 relative w-full pointer-events-none">
          <div className="w-full flex items-center mb-4 md:mb-8">
             <div className="flex-1 flex items-center justify-end pr-4">
                <div className="w-full" ref={arrowRef}>
                    <div className="flex items-center justify-end w-full">
                        <div className="w-full h-[3px] bg-white"></div>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="-ml-[1px] text-white shrink-0 w-8 h-8 md:w-12 md:h-12">
                            <path d="M0 20H38M38 20L24 6M38 20L24 34" stroke="currentColor" strokeWidth="3"/>
                        </svg>
                    </div>
                </div>
             </div>
             
             <div className="shrink-0" ref={letsRef}>
                <span className="text-2xl md:text-4xl font-light lowercase">let&apos;s</span>
             </div>

             <div className="flex-1"></div>
          </div>
          
          <div className="relative">
            <h2 className="text-[19vw] md:text-[15vw] leading-[0.85] font-black tracking-tighter uppercase flex flex-col items-center">
                <span ref={codeRef} className="block">CODE</span>
                <span ref={yourRef} className="block text-gray-500">YOUR</span>
                <span ref={businessRef} className="block">BUSINESS</span>
            </h2>
            
            {/* Final Content Wrapper for Parallax */}
            <div ref={finalContainerRef} className="absolute inset-0 pointer-events-none">
                {/* Final Text Overlay */}
                <div ref={finalTextRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none text-white text-center">
                        codea desarrollos
                    </h2>
                </div>

                {/* Button Overlay */}
                <div ref={buttonRef} className="absolute inset-0 flex items-center justify-center pointer-events-none pt-20 md:pt-32">
                    <button onClick={openModal} className="pointer-events-auto group flex items-center gap-3 px-8 py-4 bg-transparent border border-white text-white text-lg md:text-xl font-bold rounded-full hover:scale-105 transition-transform duration-300 hover:bg-white/10">
                        Empezar mi proyecto
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
          </div>
          
          {/* Globe icon similar to the one in the image */}
          <div ref={globeRef} className="absolute -bottom-6 md:bottom-0 right-2 md:right-24 translate-y-1/2 w-14 h-14 md:w-32 md:h-32 pointer-events-auto">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-white animate-spin-slow">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
             </svg>
          </div>
       </div>

    </section>
    </>
  );
}
