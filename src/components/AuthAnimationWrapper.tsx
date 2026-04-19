"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AuthAnimationWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Reveal container initial state
    gsap.set(containerRef.current, { visibility: 'visible' });

    const tl = gsap.timeline({ delay: 0.1 });
    
    // Animar la caja principal (Entrada)
    tl.fromTo(containerRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out", clearProps: "transform" }
    );

    // Microinteracción para los elementos hijos 
    tl.fromTo(".auth-stagger", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", clearProps: "transform" },
      "-=0.6"
    );

    // Interceptar form submit para animación de salida
    const formElement = containerRef.current?.querySelector('form');
    if (formElement) {
      formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Deshabilitar botón para prevenir doble clic
        const submitBtn = formElement.querySelector('button[type="submit"]') || formElement.querySelector('button');
        if (submitBtn) {
           submitBtn.setAttribute('disabled', 'true');
           submitBtn.innerText = 'Cargando...';
        }

        // Animación de salida global
        gsap.to(containerRef.current, {
          y: -60,
          opacity: 0,
          scale: 0.96,
          duration: 0.5,
          ease: "power3.in",
          onComplete: () => {
            (e.target as HTMLFormElement).submit();
          }
        });
      });
    }

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="w-full max-w-sm relative z-10 opacity-0 invisible" style={{ visibility: 'hidden' }}>
      {children}
    </div>
  );
}
