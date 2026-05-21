"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Landing Page",
    description: "Diseñamos páginas web orientadas a la conversión, con un mensaje claro y atractivo que capta la atención de tus clientes.",
    cta: "Conocer más",
    link: "/servicios",
    image: "https://i.pinimg.com/736x/b4/85/5b/b4855bec7b4741b5319314fe928cdcf2.jpg"
  },
  {
    title: "E-Commerce",
    description: "Desarrollamos tiendas online completas, intuitivas y seguras, para que puedas vender tus productos 24/7 sin límites.",
    cta: "Conocer más",
    link: "/servicios",
    image: "https://i.pinimg.com/736x/a7/93/0d/a7930d4ea24d514685774e10b0137133.jpg"
  },
  {
    title: "Sistemas a Medida",
    description: "Creamos soluciones personalizadas según las necesidades de tu negocio, optimizando procesos y mejorando la eficiencia operativa.",
    cta: "Conocer más",
    link: "/servicios",
    image: "https://i.pinimg.com/736x/ee/25/27/ee252747f024b15d408bbd78f14c78b1.jpg"
  },
  {
    title: "Ucobot",
    description: "Tu propio chatbot con IA. Centraliza conversaciones y automatiza tu atención al cliente y ventas en WhatsApp.",
    cta: "Conocer más",
    link: "/servicios",
    image: "https://i.pinimg.com/736x/4f/27/dc/4f27dc5973366a8599dc149d73d6ede0.jpg"
  },
  {
    title: "Gestión de Redes",
    description: "Estrategia, producción de contenido e interacción con tu comunidad para comunicar de forma consistente y profesional.",
    cta: "Conocer más",
    link: "/servicios",
    image: "https://i.pinimg.com/736x/b4/85/5b/b4855bec7b4741b5319314fe928cdcf2.jpg"
  }
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Desktop
    mm.add("(min-width: 768px)", () => {
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
    });

    // Mobile
    mm.add("(max-width: 767px)", () => {
      // Aseguramos de resetear el 'x' horizontal por si queda un 잔 left-over
      gsap.set(sectionRef.current, { x: 0, clearProps: "all" });

      const cards = gsap.utils.toArray('.gallery-card');
      
      cards.forEach((card: any) => {
        gsap.from(card, {
          y: 50,
          x: 0, // forzamos a que no haya movimiento en el eje X
          opacity: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        });
      });

      gsap.from(textRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: triggerRef.current, // Usamos section como trigger
          start: "bottom 90%",
          toggleActions: "play none none reverse"
        }
      });
    });

  }, { scope: triggerRef });

  return (
    <div className="w-full relative z-[20]">
      <section className="min-h-screen md:h-dvh md:overflow-hidden flex flex-col justify-center bg-white text-black rounded-[30px] md:rounded-[60px] relative py-20 md:py-0" ref={triggerRef}>
        <div className="w-full text-center mb-8 md:mb-8 md:absolute md:top-24 left-0 z-30 px-4 flex flex-col items-center">
          <p className="text-xs md:text-sm tracking-[0.3em] font-bold mb-4 uppercase" style={{ color: 'hsl(76, 85%, 67%)' }}>
            Nuestros Servicios
          </p>
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black">
            ¿QUÉ <span className="text-transparent" style={{ WebkitTextStroke: '2px black' }}>HACEMOS?</span>
          </h2>
        </div>

      <div 
        ref={sectionRef} 
        className="flex flex-col md:flex-row items-center md:items-stretch w-full md:w-fit px-4 md:px-10 gap-10 md:gap-12 pl-4 md:pl-[10vw] pr-4 md:pr-[35vw]"
      >
        {services.map((service, index) => (
          <div key={index} className="gallery-card flex-shrink-0 relative w-full md:w-[450px] min-h-[350px] md:min-h-[40vh] bg-[#F5F5F5] rounded-[20px] md:rounded-[30px] p-6 md:p-6 flex flex-col hover:bg-[#EAEAEA] transition-colors duration-500 group overflow-visible">
            <div className="relative z-10 w-[60%] md:w-[60%] flex flex-col h-full justify-between">
                <div className="flex flex-col gap-2 md:gap-4">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                      {service.title}
                    </h3>
                    <p className="text-sm border-gray-300 md:text-base text-gray-600 leading-relaxed md:leading-relaxed">
                      {service.description}
                    </p>
                </div>
                <Link href={service.link} className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-bold group-hover:translate-x-2 transition-all duration-300 mt-4 md:mt-3 w-fit">
                  <span>{service.cta}</span>
                  <span className="text-lg md:text-xl">→</span>
                </Link>
            </div>

              {/* HD Phone Mockup */}
              <div className="absolute -right-2 md:-right-8 top-1/2 -translate-y-1/2 w-[120px] md:w-[160px] z-20">
                <div className="relative w-full aspect-[9/19] bg-black rounded-[1.2rem] md:rounded-[2rem] shadow-2xl border-[4px] md:border-[6px] border-[#121212] overflow-hidden ring-1 ring-white/10">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[30%] h-[8px] md:h-[18px] bg-black rounded-full z-30"></div>
                  
                  {/* Screen Content */}
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover object-top bg-white"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Screen Reflection/Gloss (Optional for realism) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={textRef} className="w-full text-center mt-12 z-10 md:absolute md:bottom-24 left-0 px-4">
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
