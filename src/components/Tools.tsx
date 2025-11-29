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
  const footerSubtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const whiteFooterRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial set for footer to ensure it's hidden
    if (whiteFooterRef.current) {
      gsap.set(whiteFooterRef.current, { yPercent: 100 });
    }

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
      tl.to(headerRef.current, { autoAlpha: 0, y: -50, duration: 0.5 }, "zoom1");
      tl.to(cardsRef.current[1], { autoAlpha: 0, scale: 0.5, duration: 0.5 }, "zoom1");
      
      tl.set(cardsRef.current[0], { zIndex: 40 }, "zoom1");
      
      // Fade out content and bubble
      tl.to(cardContentsRef.current[0], { autoAlpha: 0, duration: 0.3 }, "zoom1");
      const cardBubble1 = cardsRef.current[0]?.querySelector('.card-bubble');
      if (cardBubble1) tl.to(cardBubble1, { autoAlpha: 0, duration: 0.3 }, "zoom1");

      // Center and Scale
      tl.to(cardsRef.current[0], { 
        scale: 50,
        borderRadius: 0,
        xPercent: isDesktop ? 55 : 0, // Move right on desktop
        yPercent: isDesktop ? 0 : 55, // Move down on mobile
        duration: 1.5, 
        ease: "power2.inOut" 
      }, "zoom1+=0.2");
      
      // Reveal Detail 1 Content
      const detail1 = detailsRef.current[0];
      const d1Img = detail1?.querySelector('.detail-image');
      const d1Text = detail1?.querySelector('.detail-text');
      const d1Bubble = detail1?.querySelector('.detail-bubble');

      // Initial states for Detail 1
      if (detail1) gsap.set(detail1, { autoAlpha: 0, pointerEvents: "none" });
      if (d1Img) gsap.set(d1Img, { x: -100, autoAlpha: 0 });
      if (d1Text) gsap.set(d1Text, { x: 100, autoAlpha: 0 });
      if (d1Bubble) gsap.set(d1Bubble, { y: -100, autoAlpha: 0 });

      tl.to(detail1, { autoAlpha: 1, pointerEvents: "all", duration: 0.1 }, "zoom1+=1.5");
      if (d1Img) tl.to(d1Img, { x: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom1+=1.6");
      if (d1Text) tl.to(d1Text, { x: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom1+=1.6");
      if (d1Bubble) tl.to(d1Bubble, { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom1+=1.6");
      
      // Hold Detail 1
      tl.to({}, { duration: 3 });

      // 3. Exit Detail 1
      tl.addLabel("exit1");
      
      if (d1Img) tl.to(d1Img, { x: -100, autoAlpha: 0, duration: 0.5 }, "exit1");
      if (d1Text) tl.to(d1Text, { x: 100, autoAlpha: 0, duration: 0.5 }, "exit1");
      if (d1Bubble) tl.to(d1Bubble, { y: -100, autoAlpha: 0, duration: 0.5 }, "exit1");
      tl.to(detail1, { autoAlpha: 0, pointerEvents: "none", duration: 0.5 }, "exit1+=0.3");

      // Fade out expanded card
      tl.to(cardsRef.current[0], { autoAlpha: 0, duration: 0.3 }, "exit1+=0.5");

      // Reset props and position off-screen (Left)
      tl.set(cardsRef.current[0], { 
        scale: 1, 
        borderRadius: isDesktop ? "40px" : "30px",
        xPercent: -200, 
        yPercent: 0, 
        zIndex: 1 
      }, "exit1+=0.9");

      // Slide in from Left
      tl.to(cardsRef.current[0], { 
        autoAlpha: 1, 
        xPercent: 0, 
        duration: 1, 
        ease: "power2.out" 
      }, "exit1+=1.0");
      
      // Fade in card content and bubble (Smoother timing)
      tl.to(cardContentsRef.current[0], { autoAlpha: 1, duration: 0.5 }, "exit1+=1.4"); 
      if (cardBubble1) tl.to(cardBubble1, { autoAlpha: 1, duration: 0.5 }, "exit1+=1.4");
      
      tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1 }, "exit1+=1.1");
      tl.to(cardsRef.current[1], { autoAlpha: 1, scale: 1, duration: 1 }, "exit1+=1.1");

      // Force a pause between cards so the first one fully closes before the second starts
      tl.to({}, { duration: 2 });

      // 4. Zoom Card 2 (UcoBot)
      tl.addLabel("zoom2");
      tl.to(headerRef.current, { autoAlpha: 0, y: -50, duration: 0.5 }, "zoom2+=0.5");
      tl.to(cardsRef.current[0], { autoAlpha: 0, scale: 0.5, duration: 0.5 }, "zoom2+=0.5");
      
      tl.set(cardsRef.current[1], { zIndex: 40 }, "zoom2+=0.5");
      
      // Fade out content and bubble
      tl.to(cardContentsRef.current[1], { autoAlpha: 0, duration: 0.3 }, "zoom2+=0.5");
      const cardBubble2 = cardsRef.current[1]?.querySelector('.card-bubble');
      if (cardBubble2) tl.to(cardBubble2, { autoAlpha: 0, duration: 0.3 }, "zoom2+=0.5");

      // Center and Scale
      tl.to(cardsRef.current[1], { 
        scale: 50,
        borderRadius: 0,
        xPercent: isDesktop ? -55 : 0, // Move left on desktop
        yPercent: isDesktop ? 0 : -55, // Move up on mobile
        duration: 1.5, 
        ease: "power2.inOut" 
      }, "zoom2+=0.7");
      
      // Reveal Detail 2 Content
      const detail2 = detailsRef.current[1];
      const d2Img = detail2?.querySelector('.detail-image');
      const d2Text = detail2?.querySelector('.detail-text');
      const d2Bubble = detail2?.querySelector('.detail-bubble');

      // Initial states for Detail 2
      if (detail2) gsap.set(detail2, { autoAlpha: 0, pointerEvents: "none" });
      if (d2Img) gsap.set(d2Img, { x: -100, autoAlpha: 0 });
      if (d2Text) gsap.set(d2Text, { x: 100, autoAlpha: 0 });
      if (d2Bubble) gsap.set(d2Bubble, { y: -100, autoAlpha: 0 });

      tl.to(detail2, { autoAlpha: 1, pointerEvents: "all", duration: 0.1 }, "zoom2+=2.0");
      if (d2Img) tl.to(d2Img, { x: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom2+=2.1");
      if (d2Text) tl.to(d2Text, { x: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom2+=2.1");
      if (d2Bubble) tl.to(d2Bubble, { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, "zoom2+=2.1");

      // Hold Detail 2
      tl.to({}, { duration: 3 });

      // 5. Exit Detail 2
      tl.addLabel("exit2");
      
      if (d2Img) tl.to(d2Img, { x: -100, autoAlpha: 0, duration: 0.5 }, "exit2");
      if (d2Text) tl.to(d2Text, { x: 100, autoAlpha: 0, duration: 0.5 }, "exit2");
      if (d2Bubble) tl.to(d2Bubble, { y: -100, autoAlpha: 0, duration: 0.5 }, "exit2");
      tl.to(detail2, { autoAlpha: 0, pointerEvents: "none", duration: 0.5 }, "exit2+=0.3");
      
      // Fade out expanded card
      tl.to(cardsRef.current[1], { autoAlpha: 0, duration: 0.3 }, "exit2+=0.5");

      // Reset props and position off-screen (Right)
      tl.set(cardsRef.current[1], { 
        scale: 1, 
        borderRadius: isDesktop ? "40px" : "30px",
        xPercent: 200, 
        yPercent: 0, 
        zIndex: 1 
      }, "exit2+=0.9");

      // Slide in from Right
      tl.to(cardsRef.current[1], { 
        autoAlpha: 1, 
        xPercent: 0, 
        duration: 1, 
        ease: "power2.out" 
      }, "exit2+=1.0");
      
      // Fade in card content and bubble (Smoother timing)
      tl.to(cardContentsRef.current[1], { autoAlpha: 1, duration: 0.5 }, "exit2+=1.4"); 
      if (cardBubble2) tl.to(cardBubble2, { autoAlpha: 1, duration: 0.5 }, "exit2+=1.4");
      
      tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1 }, "exit2+=1.1");
      tl.to(cardsRef.current[0], { autoAlpha: 1, scale: 1, duration: 1 }, "exit2+=1.1");

      // Force a pause before footer reveal
      tl.to({}, { duration: 2 });

      // 6. Reveal Footer Text & Move Cards Up
      tl.addLabel("footerReveal");
      
      // Move cards and header up completely off screen
      tl.to([headerRef.current, cardsContainerRef.current], { 
        y: -window.innerHeight * 1.2, 
        duration: 1.5, 
        ease: "power2.inOut" 
      }, "footerReveal");

      tl.fromTo(footerTextRef.current, 
        { x: "100vw", autoAlpha: 1 },
        { x: "0%", autoAlpha: 1, duration: 1.5, ease: "power2.out" },
        "footerReveal+=0.5"
      );

      tl.fromTo(footerSubtitleRef.current,
        { y: 50, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
        "footerReveal+=1.0"
      );

      // 7. Separate Texts & Show CTA
      tl.addLabel("ctaReveal");
      
      // Move Title Up
      tl.to(footerTextRef.current, { y: -120, duration: 1, ease: "power2.out" }, "ctaReveal");
      
      // Move Subtitle Down
      tl.to(footerSubtitleRef.current, { y: 10, duration: 1, ease: "power2.out" }, "ctaReveal");
      
      // Show CTA
      tl.fromTo(ctaRef.current, 
        { autoAlpha: 0, scale: 0.8 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
        "ctaReveal+=0.5"
      );

      tl.to({}, { duration: 2 }); // Pause

      // 8. Show Footer
      tl.addLabel("footerEntry");

      // Slide in White Footer
      tl.to(whiteFooterRef.current,
        { yPercent: 0, duration: 1.5, ease: "power2.out" },
        "footerEntry"
      );

    });
  }, { scope: spacerRef });

  return (
    <>
      <div ref={spacerRef} className="h-[1600vh] w-full relative z-[30] overflow-hidden" />
      <section 
        ref={sectionRef} 
        className="fixed top-0 left-0 w-full max-w-[100vw] h-[100dvh] bg-black text-white py-4 md:py-20 flex flex-col items-center justify-start md:justify-center pt-32 md:pt-0 -translate-x-full overflow-hidden z-[45]"
      >
        {/* Video Background for Footer Text */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Mask Layer for Video Text Effect */}
        <div className="absolute inset-0 z-[1] bg-black mix-blend-multiply pointer-events-none flex items-center justify-center">
           <div ref={footerTextRef} className="opacity-0">
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none text-white text-center">
              codea desarrollos
            </h2>
          </div>
        </div>

        <div ref={headerRef} className="container mx-auto px-4 relative z-10 flex-shrink-0">
          <div className="mb-4 md:mb-16 text-center">
            <h2 className="text-3xl md:text-7xl font-bold mb-2 md:mb-6 tracking-tighter">
              Herramientas de Codea
            </h2>
            <p className="text-sm md:text-xl text-gray-400 max-w-2xl mx-auto">
              Softwares que hemos desarrollado y cuentan con un modelo SaaS multiusuario, diseñados para escalar y resolver problemas complejos.
            </p>
          </div>
        </div>

        <div ref={cardsContainerRef} className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-0 md:px-24 max-w-6xl mx-auto">
            {tools.map((tool, index) => (
              <div 
                key={index} 
                ref={el => { cardsRef.current[index] = el }}
                className="bg-white text-black rounded-[30px] md:rounded-[40px] p-6 md:p-10 hover:scale-[1.02] transition-transform duration-500 group relative overflow-hidden"
              >
                <div className="card-bubble absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full -mr-6 -mt-6 z-0 transition-colors group-hover:bg-gray-200"></div>
                
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
            className="absolute inset-0 w-full h-full z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden pointer-events-none text-black opacity-0 invisible"
          >
            <div className="detail-bubble absolute -top-12 -right-12 md:-top-24 md:-right-24 z-0 w-48 h-48 md:w-96 md:h-96 bg-gray-100 rounded-full"></div>
            <div className="container mx-auto px-4 py-10 md:py-0 flex flex-col md:flex-row items-center gap-8 md:gap-24 min-h-full md:min-h-0 relative z-10">
              <div className="w-full md:w-1/2 flex justify-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={tool.detail.image} alt={tool.name} className="detail-image w-auto max-h-[30vh] md:max-h-[50vh] rounded-3xl shadow-2xl object-contain" />
              </div>
              <div className="w-full md:w-1/2 text-left pb-10 md:pb-0 detail-text">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          {/* Placeholder to keep spacing correct, actual text is in mask layer */}
          <div className="opacity-0 invisible">
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none text-white text-center">
              codea desarrollos
            </h2>
          </div>
          <div ref={footerSubtitleRef} className="mt-4 md:mt-8 opacity-0">
            <h3 className="text-xl md:text-3xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-2 md:gap-3 text-gray-300">
              <span>Transforma la</span>
              <span className="font-serif italic font-normal">complejidad</span>
              <span>en claridad</span>
            </h3>
          </div>
        </div>

        {/* CTA Button (Centered) */}
        <div ref={ctaRef} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none opacity-0">
             <button className="pointer-events-auto bg-white text-black text-lg md:text-xl font-bold py-4 px-10 rounded-full hover:bg-gray-200 transition-colors shadow-lg hover:scale-105 transform duration-300">
                Start a Project
             </button>
        </div>

        {/* White Footer */}
        <div ref={whiteFooterRef} className="absolute bottom-0 left-0 w-full h-[40vh] bg-white rounded-t-[60px] z-50 flex flex-col justify-center px-8 md:px-24 text-black">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
                
                {/* Brand Column */}
                <div className="md:col-span-4 flex flex-col gap-4">
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tighter">Codea Desarrollos.</h3>
                    <p className="text-gray-500 text-base max-w-xs leading-relaxed">
                        Diseñamos el futuro digital de tu empresa con tecnología de vanguardia.
                    </p>
                    <p className="text-xs text-gray-400 mt-4 hidden md:block">© 2025 Codea Desarrollos</p>
                </div>

                {/* Center - Big Email & WhatsApp */}
                <div className="md:col-span-4 flex flex-col items-center justify-center gap-6">
                     <a href="mailto:hola@codea.com.ar" className="text-2xl md:text-4xl font-bold tracking-tight hover:text-gray-600 transition-colors border-b-2 border-black pb-1">
                        hola@codea.com.ar
                     </a>
                     <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full hover:bg-[#128C7E] transition-all font-bold text-sm md:text-base shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Contactar por WhatsApp
                     </a>
                </div>
                
                {/* Links Column */}
                <div className="md:col-span-4 flex justify-start md:justify-end gap-12 md:gap-16">
                    <div className="flex flex-col gap-4">
                        <span className="font-bold text-lg">Menu</span>
                        <a href="#work" className="text-gray-500 hover:text-black transition-colors">Proyectos</a>
                        <a href="#about" className="text-gray-500 hover:text-black transition-colors">Nosotros</a>
                        <a href="#services" className="text-gray-500 hover:text-black transition-colors">Servicios</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <span className="font-bold text-lg">Social</span>
                        <a href="#" className="text-gray-500 hover:text-black transition-colors">Instagram</a>
                        <a href="#" className="text-gray-500 hover:text-black transition-colors">LinkedIn</a>
                        <a href="#" className="text-gray-500 hover:text-black transition-colors">Twitter</a>
                    </div>
                </div>
            </div>

            <div className="md:hidden mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">© 2025 Codea Desarrollos.</p>
            </div>
        </div>

      </section>
    </>
  );
}
