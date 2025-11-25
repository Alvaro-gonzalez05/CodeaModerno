"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Desarrollo de Software a Medida",
    description: "Creamos software que se adapta a tu negocio, no al revés. En CODEA diseñamos y desarrollamos soluciones digitales totalmente personalizadas que responden a tus objetivos, optimizan procesos y acompañan el crecimiento de tu empresa. Precisas, escalables y construidas con visión a largo plazo.",
    cta: "Conocer más"
  },
  {
    title: "Desarrollo Web",
    description: "Sitios modernos, rápidos y estratégicamente diseñados. Desarrollamos páginas web de alto rendimiento que fortalecen tu marca y ofrecen una experiencia fluida para tus usuarios. Desde la arquitectura hasta la entrega final, garantizamos calidad, velocidad y excelencia.",
    cta: "Ver servicios"
  },
  {
    title: "Soluciones de E-commerce",
    description: "Tu tienda online, lista para crecer. Creamos plataformas de e-commerce seguras, escalables y centradas en el usuario, pensadas para aumentar conversiones y simplificar la gestión. Una experiencia de compra eficiente para tus clientes y un motor de ventas poderoso para tu negocio.",
    cta: "Empezar ahora"
  },
  {
    title: "Diseño UX/UI & Landing Pages",
    description: "Experiencias digitales que conectan y convierten. Diseñamos interfaces intuitivas y landing pages de alto impacto basadas en principios de diseño centrados en el usuario. Profesionales, claras y visualmente atractivas: hechas para transformar visitantes en clientes.",
    cta: "Ver trabajos"
  }
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const totalWidth = sectionRef.current!.scrollWidth;
    const windowWidth = window.innerWidth;
    const scrollAmount = totalWidth - windowWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top top",
        end: `+=${scrollAmount}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(sectionRef.current, {
      x: -scrollAmount,
      ease: "none",
      duration: 1,
    });

    tl.fromTo(textRef.current, {
      y: 100,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      ease: "none",
      duration: 1
    }, "<");

  }, { scope: triggerRef });

  return (
    <section className="overflow-hidden h-screen flex flex-col justify-center bg-white text-black rounded-[60px] z-[20] relative" ref={triggerRef}>
      <div className="w-full text-center mb-8 absolute top-10 left-0 z-30">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
          ¿Qué hacemos?
        </h2>
      </div>

      <div 
        ref={sectionRef} 
        className="flex flex-row items-center w-fit px-10 gap-24 pl-[10vw]"
      >
        {services.map((service, index) => (
          <div key={index} className="flex-shrink-0 relative w-[85vw] md:w-[600px] h-[60vh] bg-[#F5F5F5] rounded-[40px] p-8 md:p-12 flex flex-col justify-between hover:bg-[#EAEAEA] transition-colors duration-500 group overflow-visible">
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                {service.title}
              </h3>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-[80%]">
                {service.description}
              </p>
            </div>

            {/* Mockup Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/a.png" 
              alt="Service Mockup" 
              className="absolute -right-10 md:-right-19 top-1/2 -translate-y-1/2 w-[100px] md:w-[175px] h-auto object-contain drop-shadow-2xl pointer-events-none z-20" 
            />

            <div className="relative z-10 flex items-center gap-4 text-xl font-medium group-hover:translate-x-2 transition-transform duration-300">
              <span>{service.cta}</span>
              <span className="text-2xl">→</span>
            </div>
          </div>
        ))}
      </div>
      
      <div ref={textRef} className="w-screen text-center mt-4 z-10 absolute bottom-10 left-0">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-3">
          <span>Los grandes</span>
          <span className="font-serif italic font-normal">productos</span>
          <span>no nacen</span>
          <span className="font-serif italic font-normal">por accidente</span>
        </h2>
      </div>
    </section>
  );
}
