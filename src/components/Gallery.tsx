"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Desarrollo de Software a Medida",
    description: "Software a medida que se adapta a tu negocio. Soluciones personalizadas, escalables y diseñadas para optimizar procesos y potenciar tu crecimiento a largo plazo.",
    cta: "Conocer más",
    image: "https://i.pinimg.com/736x/b4/85/5b/b4855bec7b4741b5319314fe928cdcf2.jpg"
  },
  {
    title: "Desarrollo Web",
    description: "Sitios web modernos y de alto rendimiento. Diseño estratégico y velocidad para fortalecer tu marca y brindar una experiencia de usuario impecable.",
    cta: "Ver servicios",
    image: "https://i.pinimg.com/736x/a7/93/0d/a7930d4ea24d514685774e10b0137133.jpg"
  },
  {
    title: "Soluciones de E-commerce",
    description: "Tiendas online seguras y escalables. Plataformas e-commerce diseñadas para aumentar conversiones, simplificar la gestión y potenciar tus ventas.",
    cta: "Empezar ahora",
    image: "https://i.pinimg.com/736x/ee/25/27/ee252747f024b15d408bbd78f14c78b1.jpg"
  },
  {
    title: "Diseño UX/UI & Landing Pages",
    description: "Diseño que conecta y convierte. Interfaces intuitivas y landing pages de alto impacto, creadas para transformar visitantes en clientes.",
    cta: "Ver trabajos",
    image: "https://i.pinimg.com/736x/4f/27/dc/4f27dc5973366a8599dc149d73d6ede0.jpg"
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

    // Entrance animation for cards
    gsap.from(".gallery-card", {
      x: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

  }, { scope: triggerRef });

  return (
    <div className="w-full relative z-[20]">
      <section className="overflow-hidden h-dvh flex flex-col justify-center bg-white text-black rounded-[30px] md:rounded-[60px] relative" ref={triggerRef}>
        <div className="w-full text-center mb-4 md:mb-8 absolute top-4 md:top-8 left-0 z-30 px-4">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tighter">
            ¿Qué hacemos?
          </h2>
        </div>

      <div 
        ref={sectionRef} 
        className="flex flex-row items-stretch w-fit px-4 md:px-10 gap-6 md:gap-24 pl-[5vw] md:pl-[10vw]"
      >
        {services.map((service, index) => (
          <div key={index} className="gallery-card flex-shrink-0 relative w-[85vw] md:w-[600px] min-h-[45vh] md:min-h-[50vh] bg-[#F5F5F5] rounded-[30px] md:rounded-[40px] p-6 md:p-10 flex flex-col justify-center hover:bg-[#EAEAEA] transition-colors duration-500 group overflow-visible">
            <div className="relative z-10 w-full md:w-[55%] flex flex-col gap-3 md:gap-6">
                <h3 className="text-2xl md:text-5xl font-bold tracking-tight leading-tight">
                  {service.title}
                </h3>
                <p className="text-base md:text-xl text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 md:gap-4 text-lg md:text-xl font-medium group-hover:translate-x-2 transition-transform duration-300 mt-2 md:mt-4">
                  <span>{service.cta}</span>
                  <span className="text-xl md:text-2xl">→</span>
                </div>
            </div>

              {/* HD Phone Mockup */}
              <div className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 w-[100px] md:w-[220px] z-20">
                <div className="relative w-full aspect-[9/19] bg-black rounded-[1rem] md:rounded-[2.5rem] shadow-2xl border-[4px] md:border-[8px] border-[#121212] overflow-hidden ring-1 ring-white/10">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[30%] h-[12px] md:h-[24px] bg-black rounded-full z-30"></div>
                  
                  {/* Screen Content */}
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover object-top bg-white" 
                  />
                  
                  {/* Screen Reflection/Gloss (Optional for realism) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={textRef} className="w-screen text-center mt-4 z-10 absolute bottom-6 md:bottom-10 left-0 px-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-2 md:gap-3">
            <span>Los grandes</span>
            <span className="font-serif italic font-normal">productos</span>
            <span>no nacen</span>
            <span className="font-serif italic font-normal">por accidente</span>
          </h2>
        </div>
      </section>
    </div>
  );
}
