"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const tools = [
  {
    name: "RestoPro",
    description: "Sistema integral de gestión para restaurantes, bares y cafeterías. Control de mesas, pedidos, inventario y facturación en tiempo real.",
    tags: ["Gastronomía", "Gestión", "POS"],
    detail: {
      title: "Control total de tu negocio gastronómico",
      description: "RestoPro centraliza todas las operaciones de tu local. Desde la toma de pedidos en la mesa con tablets, hasta la gestión de stock en tiempo real y reportes de rentabilidad. Optimiza los tiempos de cocina y mejora la experiencia de tus clientes.",
      features: ["Comandas Digitales", "Control de Stock y Recetas", "Facturación Fiscal Integrada", "Métricas en Tiempo Real"],
      image: "/a.png"
    }
  },
  {
    name: "UcoBot",
    description: "Asistencia Inteligente Omnicanal. Crea chatbots personalizados para WhatsApp, Instagram, TikTok y Messenger para automatizar la atención al cliente.",
    tags: ["IA", "Chatbots", "Omnicanal"],
    detail: {
      title: "Atención al cliente 24/7 con IA",
      description: "UcoBot no es solo un chatbot, es un asistente inteligente capaz de entender el contexto, responder consultas complejas y calificar leads automáticamente. Integra todos tus canales de comunicación en una sola bandeja de entrada.",
      features: ["Procesamiento de Lenguaje Natural", "Multi-agente y Multi-canal", "Respuestas Automáticas", "Calificación de Leads"],
      image: "/a.png"
    }
  }
];

export default function Tools() {
  const spacerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardContentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const detailsRef = useRef<(HTMLDivElement | null)[]>([]);
  const footerTextRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    
    mm.add({
      isDesktop: "(min-width: 768px)",
      isMobile: "(max-width: 767px)"
    }, (context) => {
      const { isDesktop } = context.conditions as { isDesktop: boolean };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: spacerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // 1. Slide in Tools Section
      tl.to(sectionRef.current, {
        x: "0%",
        ease: "none",
        duration: 2
      });

      // Hold section before zooming (User has to scroll more)
      tl.to({}, { duration: 2 });

      // 2. Zoom Card 1 (RestoPro)
      tl.addLabel("zoom1");
      tl.to(headerRef.current, { autoAlpha: 0, y: -50, duration: 1 }, "zoom1");
      tl.to(cardsRef.current[1], { autoAlpha: 0, scale: 0.5, duration: 1 }, "zoom1");
      
      tl.set(cardsRef.current[0], { zIndex: 40 }, "zoom1");
      
      // Fade out content
      tl.to(cardContentsRef.current[0], { autoAlpha: 0, duration: 0.1 }, "zoom1");

      // Center and Scale
      tl.to(cardsRef.current[0], { 
        scale: 30,
        xPercent: isDesktop ? 55 : 0, // Move right on desktop
        yPercent: isDesktop ? 0 : 55, // Move down on mobile
        duration: 1.5, 
        ease: "power2.inOut" 
      }, "zoom1+=0.2");
      
      // Reveal Detail 1
      tl.to(detailsRef.current[0], { 
        clipPath: "circle(150% at center)", 
        autoAlpha: 1,
        duration: 1.5,
        ease: "power2.inOut"
      }, "zoom1+=0.5");
      
      // Hold Detail 1
      tl.to({}, { duration: 2 });

      // 3. Exit Detail 1
      tl.addLabel("exit1");
      // Fade out detail content FIRST (clean slate)
      tl.to(detailsRef.current[0], { 
        autoAlpha: 0,
        duration: 0.3
      }, "exit1");
      
      // Reset clipPath silently
      tl.set(detailsRef.current[0], { clipPath: "circle(0% at center)" }, "exit1+=0.3");

      // Scale down the card (now just a white box) - Start LATER
      tl.to(cardsRef.current[0], { scale: 1, xPercent: 0, yPercent: 0, zIndex: 1, duration: 1 }, "exit1+=0.5");
      
      // Ensure content is hidden well before scale starts
      tl.to(cardContentsRef.current[0], { autoAlpha: 0, duration: 0.1 }, "exit1"); 
      
      // Fade in AFTER scale is fully done
      tl.to(cardContentsRef.current[0], { autoAlpha: 1, duration: 0.5 }, "exit1+=1.6"); 
      
      tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1 }, "exit1+=1");
      tl.to(cardsRef.current[1], { autoAlpha: 1, scale: 1, duration: 1 }, "exit1+=1");

      // 4. Zoom Card 2 (UcoBot)
      tl.addLabel("zoom2");
      tl.to(headerRef.current, { autoAlpha: 0, y: -50, duration: 1 }, "zoom2+=0.5");
      tl.to(cardsRef.current[0], { autoAlpha: 0, scale: 0.5, duration: 1 }, "zoom2+=0.5");
      
      tl.set(cardsRef.current[1], { zIndex: 40 }, "zoom2+=0.5");
      
      // Fade out content
      tl.to(cardContentsRef.current[1], { autoAlpha: 0, duration: 0.1 }, "zoom2+=0.5");

      // Center and Scale
      tl.to(cardsRef.current[1], { 
        scale: 30,
        xPercent: isDesktop ? -55 : 0, // Move left on desktop
        yPercent: isDesktop ? 0 : -55, // Move up on mobile
        duration: 1.5, 
        ease: "power2.inOut" 
      }, "zoom2+=0.7");
      
      // Reveal Detail 2
      tl.to(detailsRef.current[1], { 
        clipPath: "circle(150% at center)", 
        autoAlpha: 1,
        duration: 1.5,
        ease: "power2.inOut"
      }, "zoom2+=1");

      // Hold Detail 2
      tl.to({}, { duration: 2 });

      // 5. Exit Detail 2
      tl.addLabel("exit2");
      // Fade out detail content FIRST
      tl.to(detailsRef.current[1], { 
        autoAlpha: 0,
        duration: 0.3
      }, "exit2");

      // Reset clipPath silently
      tl.set(detailsRef.current[1], { clipPath: "circle(0% at center)" }, "exit2+=0.3");
      
      // Scale down - Start LATER
      tl.to(cardsRef.current[1], { scale: 1, xPercent: 0, yPercent: 0, zIndex: 1, duration: 1 }, "exit2+=0.5");
      
      // Ensure content is hidden
      tl.to(cardContentsRef.current[1], { autoAlpha: 0, duration: 0.1 }, "exit2"); 
      
      // Fade in AFTER scale
      tl.to(cardContentsRef.current[1], { autoAlpha: 1, duration: 0.5 }, "exit2+=1.6"); 
      
      tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1 }, "exit2+=1");
      tl.to(cardsRef.current[0], { autoAlpha: 1, scale: 1, duration: 1 }, "exit2+=1");

      // 6. Reveal Footer Text & Move Cards Up
      // Wait for previous animations to settle (exit2 ends around +2.1)
      tl.addLabel("footerReveal", "exit2+=2.5");
      
      // Move cards and header up to make room
      tl.to([headerRef.current, cardsContainerRef.current], { 
        y: -200, // Move up more to ensure no overlap
        duration: 1, 
        ease: "power2.inOut" 
      }, "footerReveal");

      tl.fromTo(footerTextRef.current, 
        { y: 100, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
        "footerReveal"
      );

    });
  }, { scope: spacerRef });

  return (
    <>
      <div ref={spacerRef} className="h-[1000vh] w-full relative z-[30]" />
      <section 
        ref={sectionRef} 
        className="fixed top-0 left-0 w-full h-screen bg-black text-white py-20 flex flex-col items-center justify-center -translate-x-full overflow-hidden z-[35]"
      >
        <div ref={headerRef} className="container mx-auto px-4 relative z-10">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tighter">
              Herramientas de Codea
            </h2>
            <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
              Softwares que hemos desarrollado y cuentan con un modelo SaaS multiusuario, diseñados para escalar y resolver problemas complejos.
            </p>
          </div>
        </div>

        <div ref={cardsContainerRef} className="container mx-auto px-4 relative z-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-0 md:px-24 max-w-6xl mx-auto">
            {tools.map((tool, index) => (
              <div 
                key={index} 
                ref={el => { cardsRef.current[index] = el }}
                className="bg-white text-black rounded-[30px] md:rounded-[40px] p-6 md:p-10 hover:scale-[1.02] transition-transform duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-bl-[60px] md:rounded-bl-[100px] -mr-4 -mt-4 z-0 transition-colors group-hover:bg-gray-200"></div>
                
                <div className="relative z-10" ref={el => { cardContentsRef.current[index] = el }}>
                  <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="flex flex-wrap gap-2">
                      {tool.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] md:text-xs font-bold tracking-wide uppercase px-2 md:px-3 py-1 rounded-full bg-black text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">{tool.name}</h3>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
                    {tool.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-base md:text-lg font-bold group-hover:gap-5 transition-all duration-300">
                    <span>Explorar</span>
                    <span className="text-xl md:text-2xl">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Views Overlay */}
        {tools.map((tool, index) => (
          <div 
            key={`detail-${index}`}
            ref={el => { detailsRef.current[index] = el }}
            className="absolute inset-0 w-full h-full bg-white text-black z-50 flex items-center justify-center opacity-0 invisible overflow-y-auto"
            style={{ clipPath: "circle(0% at center)" }}
          >
            <div className="container mx-auto px-4 py-10 md:py-0 flex flex-col md:flex-row items-center gap-8 md:gap-24 min-h-full md:min-h-0">
              <div className="w-full md:w-1/2">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tool.detail.image} alt={tool.name} className="w-full h-auto rounded-3xl shadow-2xl" />
              </div>
              <div className="w-full md:w-1/2 text-left pb-10 md:pb-0">
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  {tool.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] md:text-xs font-bold tracking-wide uppercase px-2 md:px-3 py-1 rounded-full bg-black text-white">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tighter">{tool.name}</h2>
                <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800">{tool.detail.title}</h3>
                <p className="text-base md:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8">
                  {tool.detail.description}
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {tool.detail.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-medium">
                      <span className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {/* Footer Text */}
        <div ref={footerTextRef} className="absolute bottom-10 md:bottom-20 left-0 w-full text-center z-20 opacity-0 px-4">
          <h2 className="text-2xl md:text-5xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-2 md:gap-3">
            <span>Transforma la</span>
            <span className="font-serif italic font-normal">complejidad</span>
            <span>en claridad</span>
          </h2>
        </div>

      </section>
    </>
  );
}
