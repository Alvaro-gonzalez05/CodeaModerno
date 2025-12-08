"use client";
import { useRef, useState } from 'react';
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
  const [activeTool, setActiveTool] = useState<number | null>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Handle opening/closing animations
  useGSAP(() => {
    if (activeTool !== null) {
      // Open animation
      const detailEl = detailsRef.current[activeTool];
      if (detailEl) {
        const tl = gsap.timeline();
        
        tl.set(detailEl, { autoAlpha: 1, pointerEvents: "all" });
        
        // Animate background/container
        tl.fromTo(detailEl, 
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(150% at 50% 50%)", duration: 0.8, ease: "power3.inOut" }
        );

        // Animate content
        const img = detailEl.querySelector('.detail-image');
        const text = detailEl.querySelector('.detail-text');
        
        if (img) {
          tl.fromTo(img, 
            { x: -50, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
            "-=0.4"
          );
        }
        
        if (text) {
          tl.fromTo(text, 
            { x: 50, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
            "-=0.4"
          );
        }
      }
    } else {
      detailsRef.current.forEach((el, idx) => {
        if (el) {
           gsap.set(el, { autoAlpha: 0, pointerEvents: "none" });
        }
      });
    }
  }, [activeTool]);

  // ScrollTrigger Animation
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      }
    });

    tl.to(containerRef.current, {
      x: "0%",
      ease: "none",
      duration: 1
    });

    // Ensure Process section is hidden so it doesn't show when Tools slides up
    // We use document.querySelector to bypass the scope of useGSAP
    const processSection = document.querySelector(".process-fixed-section");
    if (processSection) {
      tl.to(processSection, { autoAlpha: 0, duration: 0.1 });
    }
    
    // Reveal LetsCode section behind Tools so it's visible when Tools slides up
    const letsCodeSection = document.querySelector(".lets-code-fixed-section");
    if (letsCodeSection) {
      tl.to(letsCodeSection, { autoAlpha: 1, duration: 0.1 }, "<");
    }

    tl.fromTo(textRef.current, 
      { autoAlpha: 0, y: 50 },
      { autoAlpha: 1, y: 0, duration: 0.5 }
    );
    
    // Hold the section in place for a while
    tl.to({}, { duration: 0.5 });

    // Move the entire section up to reveal the next section
    tl.to(containerRef.current, {
      y: "-100%",
      ease: "power2.inOut",
      duration: 1
    });
  }, { scope: spacerRef });

  const handleExplore = (index: number) => {
    setActiveTool(index);
  };

  const handleClose = () => {
    const detailEl = detailsRef.current[activeTool!];
    if (detailEl) {
        gsap.to(detailEl, {
            autoAlpha: 0,
            duration: 0.3,
            onComplete: () => setActiveTool(null)
        });
    } else {
        setActiveTool(null);
    }
  };

  return (
    <>
      <div ref={spacerRef} className="h-[250vh] w-full relative z-[30]" />
      <section 
        ref={containerRef} 
        className="fixed top-0 left-0 w-full h-screen bg-black text-white py-20 overflow-hidden z-[35] -translate-x-full flex flex-col justify-center"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-7xl font-bold mb-6 tracking-tighter">
              Herramientas de Codea
            </h2>
            <p className="text-sm md:text-xl text-gray-400 max-w-2xl mx-auto">
              Softwares que hemos desarrollado y cuentan con un modelo SaaS multiusuario, diseñados para escalar y resolver problemas complejos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {tools.map((tool, index) => (
              <div 
                key={index} 
                className="bg-white text-black rounded-[40px] p-10 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden shadow-xl min-h-[450px] flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-full -mr-6 -mt-6 z-0 transition-colors group-hover:bg-gray-200"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-wrap gap-2">
                      {tool.tags.map((tag, i) => (
                        <span key={i} className="text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full bg-black text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-5xl font-bold mb-6 tracking-tight">{tool.name}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-8">
                    {tool.description}
                  </p>
                  
                  <button 
                    onClick={() => handleExplore(index)}
                    className="flex items-center gap-3 text-lg font-bold group-hover:gap-5 transition-all duration-300 cursor-pointer mt-auto"
                  >
                    <span>Explorar</span>
                    <span className="text-2xl">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div ref={textRef} className="mt-16 text-center opacity-0">
            <h3 className="text-3xl md:text-6xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-3">
              <span>Transforma</span>
              <span className="font-serif italic font-normal">complejidad</span>
              <span>en claridad</span>
            </h3>
          </div>
        </div>

        {/* Detail Views Overlay */}
        {tools.map((tool, index) => (
          <div 
            key={`detail-${index}`}
            ref={el => { detailsRef.current[index] = el }}
            className="fixed inset-0 z-[60] bg-white text-black flex items-center justify-center opacity-0 invisible"
          >
            <button 
              onClick={handleClose}
              className="absolute top-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:scale-110 transition-transform"
            >
              ✕
            </button>

            <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-12 md:gap-24 h-full overflow-y-auto md:overflow-hidden">
              <div className="w-full md:w-1/2 flex justify-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={tool.detail.image} alt={tool.name} className="detail-image w-full max-w-lg rounded-3xl shadow-2xl object-contain" />
              </div>
              <div className="w-full md:w-1/2 text-left detail-text">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tool.tags.map((tag, i) => (
                      <span key={i} className="text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full bg-black text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-6xl md:text-7xl font-bold mb-4 tracking-tighter">{tool.name}</h2>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">{tool.detail.title}</h3>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                    {tool.detail.description}
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tool.detail.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-lg font-medium">
                        <span className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
