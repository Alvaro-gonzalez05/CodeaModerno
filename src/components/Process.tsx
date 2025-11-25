"use client";
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CardSwap, { Card } from './CardSwap';

gsap.registerPlugin(ScrollTrigger);

export default function Process() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const [cardProps, setCardProps] = useState<{
    width: number | string;
    height: number | string;
    cardDistance: number;
    verticalDistance: number;
  }>({
    width: 550,
    height: 450,
    cardDistance: 40,
    verticalDistance: 50
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCardProps({
          width: "80vw",
          height: 300,
          cardDistance: 15,
          verticalDistance: 20
        });
      } else {
        setCardProps({
          width: 550,
          height: 450,
          cardDistance: 40,
          verticalDistance: 50
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onLeave: () => {
          gsap.to(".clients-fixed-section", { autoAlpha: 0, duration: 0.1 });
        },
        onEnterBack: () => {
          gsap.to(".clients-fixed-section", { autoAlpha: 1, duration: 0.1 });
        }
      }
    });

    tl.to(sectionRef.current, {
      x: "0%",
      ease: "none",
      duration: 1
    });

    tl.fromTo(textRef.current, {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: spacerRef });

  return (
    <>
      <div ref={spacerRef} className="h-[250vh] w-full relative z-[20]" />
      <section 
        ref={sectionRef} 
        className="process-fixed-section fixed top-0 left-0 w-full h-screen bg-white text-black py-10 md:py-20 flex flex-col items-center justify-center translate-x-full rounded-[30px] md:rounded-[60px] overflow-hidden z-[25]"
      >
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-12 md:gap-12 h-auto">
          
          {/* Left Side: Title & Description */}
          <div className="w-full md:w-1/2 text-left pl-4 md:pl-10 mt-0 md:mt-0 relative z-20">
            <h2 className="text-4xl md:text-7xl font-bold mb-4 md:mb-8 tracking-tighter">
              Procesos
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-md leading-relaxed">
              Nuestro método de trabajo está diseñado para transformar ideas complejas en productos digitales excepcionales, paso a paso.
            </p>
          </div>

          {/* Right Side: Card Swap */}
          <div className="w-full md:w-1/2 h-[300px] md:h-[500px] flex justify-center items-center relative z-10">
            <CardSwap
              width={cardProps.width}
              height={cardProps.height}
              cardDistance={cardProps.cardDistance}
              verticalDistance={cardProps.verticalDistance}
              delay={4000}
              pauseOnHover={true}
              skewAmount={3}
            >
              <Card className="bg-[#F5F5F5] border border-black/10 p-6 flex flex-col justify-start text-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/a.png" alt="Análisis" className="w-full h-32 md:h-48 object-contain mb-4 md:mb-6 rounded-lg bg-white/50" />
                <h3 className="text-2xl md:text-3xl font-bold mb-2">1 Análisis</h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  Entendemos tus necesidades y diseñamos una estrategia eficiente con una arquitectura sólida, asegurando que tu idea sea escalable y sostenible a largo plazo.
                </p>
              </Card>
              
              <Card className="bg-[#F5F5F5] border border-black/10 p-6 flex flex-col justify-start text-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/a.png" alt="Desarrollo" className="w-full h-32 md:h-48 object-contain mb-4 md:mb-6 rounded-lg bg-white/50" />
                <h3 className="text-2xl md:text-3xl font-bold mb-2">2 Desarrollo</h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  Convertimos tu problema en una solución, creando aplicaciones robustas con tecnologías modernas como React, .NET, Flutter, enfocándonos en alto rendimiento.
                </p>
              </Card>
              
              <Card className="bg-[#F5F5F5] border border-black/10 p-6 flex flex-col justify-start text-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/a.png" alt="Despliegue" className="w-full h-32 md:h-48 object-contain mb-4 md:mb-6 rounded-lg bg-white/50" />
                <h3 className="text-2xl md:text-3xl font-bold mb-2">3 Despliegue</h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  Entregamos un MVP desplegado y listo para usar, asegurando su correcto funcionamiento con pruebas finales y optimizaciones para ofrecer una experiencia fluida y eficiente.
                </p>
              </Card>
            </CardSwap>
          </div>
        </div>

        <div ref={textRef} className="absolute bottom-6 md:bottom-10 left-0 w-full text-center z-20 opacity-0 px-4">
          <h2 className="text-xl md:text-5xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-2 md:gap-3">
            <span>de la</span>
            <span className="font-serif italic font-normal">idea</span>
            <span>al</span>
            <span className="font-serif italic font-normal">lanzamiento</span>
          </h2>
        </div>
      </section>
    </>
  );
}
