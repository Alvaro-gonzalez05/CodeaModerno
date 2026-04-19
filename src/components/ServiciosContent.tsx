"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "LANDING-PAGE",
    subtitle: "TU PRESENCIA DIGITAL, AL PUNTO. DISEÑAMOS PÁGINAS WEB ORIENTADAS A LA CONVERSIÓN, CON UN MENSAJE CLARO Y ATRACTIVO QUE CAPTA LA ATENCIÓN DE TUS CLIENTES POTENCIALES Y LOS IMPULSA A TOMAR ACCIÓN.",
    align: "left",
    imageMock: "Codea mock mobile", // We'll just style a placeholder matching the image
  },
  {
    title: "E-COMMERCE",
    subtitle: "TU TIENDA ABIERTA LAS 24 HORAS. DESARROLLAMOS TIENDAS ONLINE COMPLETAS, INTUITIVAS Y SEGURAS, PARA QUE PUEDAS VENDER TUS PRODUCTOS O SERVICIOS EN INTERNET SIN LÍMITES DE HORARIO NI UBICACIÓN.",
    align: "right",
    imageMock: "Tienda desktop", 
    imageColor: "bg-[hsl(76,85%,67%)]",
  },
  {
    title: "SISTEMAS A MEDIDA",
    subtitle: "SOFTWARE QUE SE ADAPTA A VOS, NO AL REVÉS. CREAMOS SOLUCIONES DE SOFTWARE PERSONALIZADAS SEGÚN LAS NECESIDADES ESPECÍFICAS DE TU NEGOCIO, OPTIMIZANDO PROCESOS Y MEJORANDO LA EFICIENCIA OPERATIVA.",
    align: "left",
    imageMock: "Laptop mock",
    imageColor: "bg-[hsl(76,85%,67%)]",
  },
  {
    title: "UCOBOT",
    subtitle: "TU NEGOCIO AUTOMATIZADO, EN UN SOLO LUGAR. PLATAFORMA INTELIGENTE DONDE CUALQUIER NEGOCIO PUEDE CREAR SU PROPIO CHATBOT CON IA, CENTRALIZAR CONVERSACIONES DE MÚLTIPLES APLICACIONES, AUTOMATIZAR PROCESOS CLAVE Y HACER ENVÍOS MASIVOS DE MENSAJES POR WHATSAPP.\n– ACCESO DESDE $65.000 ARS/MES\n– WHATSAPP MARKETING: $0.08 USD POR MENSAJE",
    align: "left",
    imageMock: "Chatbot mobile",
    imageColor: "bg-[hsl(76,85%,67%)]",
  },
  {
    title: "GESTIÓN DE REDES Y CONTENIDO",
    subtitle: "CREAMOS Y GESTIONAMOS LA PRESENCIA DE TU MARCA EN REDES SOCIALES DE FORMA INTEGRAL. NOS ENCARGAMOS DE LA ESTRATEGIA, LA PRODUCCIÓN DE CONTENIDO, LA PLANIFICACIÓN EDITORIAL Y LA INTERACCIÓN CON TU COMUNIDAD – PARA QUE TU NEGOCIO COMUNIQUE DE FORMA CONSISTENTE Y PROFESIONAL SIN QUE TENGAS QUE PREOCUPARTE POR ESO.",
    align: "right",
    imageMock: "Redes sociales mobile",
    imageColor: "bg-[hsl(76,85%,67%)]",
  },
];

export default function ServiciosContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Animación del título principal
    gsap.from(".main-title span", {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
    });

    // Animación de los bloques de servicios usando matchMedia para responsiveness
    const mm = gsap.matchMedia();

    mm.add({
      // Pantallas grandes (Desktop)
      isDesktop: "(min-width: 768px)",
      // Pantallas pequeñas (Mobile)
      isMobile: "(max-width: 767px)"
    }, (context) => {
      const { isMobile } = context.conditions as { isMobile: boolean };
      
      const serviceBlocks = gsap.utils.toArray<HTMLElement>('.service-block');
      
      serviceBlocks.forEach((block, index) => {
        const isLeft = index % 2 === 0;
        const elementsToAnimate = block.querySelectorAll('.service-content');
        
        // En mobile animamos desde más cerca o desde abajo para que no rompa el layout
        const xOffset = isMobile ? (isLeft ? -50 : 50) : (isLeft ? -150 : 150);
        
        gsap.fromTo(elementsToAnimate, 
          {
            x: xOffset,
            y: isMobile ? 50 : 0, // En mobile también le damos un pequeño subidón en 'y'
            opacity: 0.2,
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: block,
              start: isMobile ? "top 90%" : "top 95%",
              end: isMobile ? "center 70%" : "center 50%",
              scrub: 1,
            }
          }
        );
      });
    });

    // Animación de la sección de costos
    gsap.from(".costos-section", {
      y: 100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".costos-section",
        start: "top 85%",
        toggleActions: "play none none reverse",
      }
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full pt-32 pb-40 px-4 md:px-8 max-w-[1400px] mx-auto min-h-screen relative z-10">
      
      {/* Título Principal */}
      <div className="text-center mb-24 md:mb-40 uppercase">
        <p className="text-xs md:text-sm tracking-[0.3em] text-gray-400 mb-6 font-bold">Codea Desarrollos</p>
        <h1 className="text-[15vw] leading-[0.8] font-black tracking-tighter text-white overflow-hidden main-title">
          <span className="inline-block">SERVICIOS</span>
        </h1>
      </div>

      {/* Lista de Servicios */}
      <div className="space-y-24 md:space-y-48">
        {services.map((service, index) => (
          <div key={index} className={`service-block flex flex-col md:flex-row items-center gap-8 md:gap-24 ${service.align === 'right' ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
            
            {/* Texto del servicio */}
            <div className={`w-full md:w-1/2 service-content ${service.align === 'right' ? 'text-right' : 'text-left'}`}>
              <h2 className={`text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-8 leading-none ${service.align === 'right' ? 'text-[#c2f254]' : 'text-gray-300/80 md:text-white'}`} style={{ color: service.align === 'right' ? 'hsl(76, 85%, 67%)' : undefined }}>
                {service.title}
              </h2>
              <div className="text-xs md:text-base tracking-[0.1em] font-semibold leading-relaxed text-gray-300 md:text-gray-200">
                {service.subtitle.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-4' : ''}>{line}</p>
                ))}
              </div>
            </div>

            {/* Imagen Mockup del servicio (Placeholder visual) */}
            <div className="w-full md:w-1/2 flex justify-center service-content">
              <div className={`relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden flex items-center justify-center p-8 transition-transform duration-500 hover:scale-105 ${service.imageColor || 'bg-neutral-800'}`}>
                 {/* Visual Mock Text / Placeholder */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                 
                 <div className="bg-black/80 backdrop-blur-sm shadow-2xl rounded-2xl w-full h-full border border-white/10 flex items-center justify-center p-6 text-center z-10">
                    <span className="font-bold text-xl tracking-tight opacity-70">
                       [Imagen de {service.title}]
                    </span>
                 </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Caja de precios */}
      <div className="mt-40 costos-section bg-[hsl(76,85%,67%)] text-black rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col items-center text-center shadow-[0_0_50px_rgba(194,242,84,0.15)] relative overflow-hidden">
        {/* Detalle visual sutil */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 md:mb-12">
          FORMAS DE PAGO Y COSTOS
        </h2>
        
        <div className="max-w-4xl space-y-6 text-xs md:text-sm font-bold tracking-widest leading-relaxed uppercase">
          <p>
            LOS PRECIOS DE LANDING PAGE, E-COMMERCE Y SISTEMAS A MEDIDA VARÍAN SEGÚN LA COMPLEJIDAD Y LOS REQUERIMIENTOS DE CADA PROYECTO. UNA VEZ RELEVADAS TUS NECESIDADES, TE ENVIAMOS UN PRESUPUESTO PERSONALIZADO SIN COMPROMISO.
          </p>
          <p>
            UCOBOT CUENTA CON PRECIOS FIJOS DETALLADOS EN SU SECCIÓN CORRESPONDIENTE.
          </p>
          <p>
            EN CUANTO A LA GESTIÓN DE REDES Y CONTENIDO, EL COSTO CUBRE EXCLUSIVAMENTE EL TRABAJO DE CREACIÓN Y PUBLICACIÓN DE CONTENIDO. EL PRESUPUESTO DESTINADO A PUBLICIDAD PAGA (PAUTA PUBLICITARIA) QUEDA A CARGO DEL CLIENTE Y SE GESTIONA DE FORMA SEPARADA.
          </p>
        </div>

        <div className="mt-12 pt-12 border-t w-full max-w-4xl border-black/20">
          <p className="text-sm md:text-xl font-black uppercase tracking-tighter flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
            <span>EFECTIVO</span> <span className="hidden md:inline">•</span>
            <span>TRANSFERENCIA BANCARIA</span> <span className="hidden md:inline">•</span>
            <span>DÉBITO AUTOMÁTICO</span>
          </p>
        </div>
      </div>

    </div>
  );
}
