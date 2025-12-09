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
      image: "https://i.pinimg.com/736x/07/9a/0d/079a0d2ff4d7dbd0fddc519916eb5425.jpg"
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
      image: "/a.png",
      video: "/robot.mp4"
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
        // Start video immediately to avoid delay
        const video = detailEl.querySelector('video');
        if (video) {
            video.play().catch(() => {});
        }

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
          const video = img.querySelector('video');
          const isVideo = !!video;
          
          // If it's a video, ensure it plays
          if (video) {
            video.play().catch(() => {});
          }

          // For video wrapper, avoid transform animation to prevent stutter
          tl.fromTo(img, 
            { x: isVideo ? 0 : -50, autoAlpha: 0 },
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
        // Pause video when closing to save resources
        const video = detailEl.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0; // Reset on close so it's ready for next time
        }

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
        className="fixed top-0 left-0 w-full h-screen bg-black text-white py-4 md:py-10 overflow-hidden z-[35] -translate-x-full flex flex-col justify-center"
      >
        <div className="container mx-auto px-4 relative z-10 h-full flex flex-col justify-center">
          <div className="mb-4 md:mb-8 text-center">
            <h2 className="text-3xl md:text-6xl font-bold mb-2 md:mb-4 tracking-tighter">
              Herramientas de Codea
            </h2>
            <p className="text-xs md:text-xl text-gray-400 max-w-2xl mx-auto px-2">
              Softwares que hemos desarrollado y cuentan con un modelo SaaS multiusuario, diseñados para escalar y resolver problemas complejos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 max-w-5xl mx-auto w-full">
            {tools.map((tool, index) => (
              <div 
                key={index} 
                className="bg-white text-black rounded-[20px] md:rounded-[30px] p-5 md:p-8 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden shadow-xl flex flex-col justify-between md:min-h-[380px]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full -mr-6 -mt-6 z-0 transition-all duration-500 group-hover:scale-110 group-hover:from-purple-200 group-hover:to-violet-300"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 md:mb-8">
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {tool.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] md:text-xs font-bold tracking-wide uppercase px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-black text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-3xl md:text-5xl font-bold mb-2 md:mb-6 tracking-tight">{tool.name}</h3>
                  <p className="text-sm md:text-lg text-gray-600 leading-relaxed mb-4 md:mb-8 line-clamp-3 md:line-clamp-none">
                    {tool.description}
                  </p>
                  
                  <button 
                    onClick={() => handleExplore(index)}
                    className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-bold group-hover:gap-4 md:group-hover:gap-5 transition-all duration-300 cursor-pointer mt-auto"
                  >
                    <span>Explorar</span>
                    <span className="text-xl md:text-2xl">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div ref={textRef} className="mt-4 md:mt-10 text-center opacity-0">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-2">
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

            <div className="container mx-auto px-4 py-6 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-24 h-full overflow-y-auto md:overflow-hidden">
              <div className="w-full md:w-1/2 flex justify-center mt-12 md:mt-0">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 {tool.detail.video ? (
                   <div className="detail-image w-full max-w-md md:max-w-xl flex justify-center items-center">
                     <video 
                       src={tool.detail.video} 
                       loop 
                       muted 
                       playsInline 
                       preload="auto"
                       className="w-full h-full object-contain contrast-125 brightness-100 saturate-200 [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
                     />
                   </div>
                 ) : (
                   <img src={tool.detail.image} alt={tool.name} className="detail-image w-full max-w-xs md:max-w-lg rounded-3xl shadow-2xl object-contain" />
                 )}
              </div>
              <div className="w-full md:w-1/2 text-left detail-text pb-10 md:pb-0">
                  <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                    {tool.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] md:text-xs font-bold tracking-wide uppercase px-2 py-1 md:px-3 md:py-1 rounded-full bg-black text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-4xl md:text-7xl font-bold mb-2 md:mb-4 tracking-tighter">{tool.name}</h2>
                  <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 leading-tight">{tool.detail.title}</h3>
                  <p className="text-base md:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8">
                    {tool.detail.description}
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {tool.detail.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-medium">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full flex-shrink-0" />
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
