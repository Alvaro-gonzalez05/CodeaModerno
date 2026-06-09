"use client";
import Link from 'next/link';
import { Slide } from "react-awesome-reveal";
import { useState, useEffect, useRef } from "react";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useModal } from '@/context/ModalContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { openModal } = useModal();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Si estamos en la home (/), ocultamos el header al pasar la primera pantalla.
      // Si estamos en otra página (como /servicios), lo mantenemos siempre visible.
      if (pathname === '/') {
        if (window.scrollY > window.innerHeight) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    if (isMenuOpen) {
      gsap.to(menuRef.current, {
        x: "100%",
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => setIsMenuOpen(false)
      });
    } else {
      setIsMenuOpen(true);
    }
  };

  useGSAP(() => {
    if (isMenuOpen && menuRef.current) {
      gsap.fromTo(menuRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isMenuOpen]);

  return (
    <header className={`fixed top-0 left-0 w-full transition-opacity duration-300 ${isMenuOpen ? 'z-[100]' : 'z-[100]'} ${isVisible || isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <Slide direction="down" triggerOnce={true}>
        <div className="flex justify-between items-center py-6 px-8 md:px-16 relative z-50">
          <div className={`text-2xl font-bold tracking-tighter ${isMenuOpen ? 'text-white' : 'text-white mix-blend-difference'}`}>
            <Link href="/">Codea</Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium mix-blend-difference text-white">
            <Link href="/servicios" className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1px] after:bg-[hsl(76,85%,67%)] after:transition-all after:duration-300 hover:after:w-full hover:text-[hsl(76,85%,67%)] transition-colors">servicios</Link>
            <Link href="/proyectos" className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1px] after:bg-[hsl(76,85%,67%)] after:transition-all after:duration-300 hover:after:w-full hover:text-[hsl(76,85%,67%)] transition-colors">proyectos</Link>
            <Link href="/trabajos" className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1px] after:bg-[hsl(76,85%,67%)] after:transition-all after:duration-300 hover:after:w-full hover:text-[hsl(76,85%,67%)] transition-colors">trabajos</Link>
            <Link href="/about" className="relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1px] after:bg-[hsl(76,85%,67%)] after:transition-all after:duration-300 hover:after:w-full hover:text-[hsl(76,85%,67%)] transition-colors">sobre nosotros</Link>
            <button onClick={openModal} className="group flex items-center gap-2 px-5 py-2 bg-transparent border border-white rounded-full hover:bg-[hsl(76,85%,67%)] hover:border-[hsl(76,85%,67%)] hover:text-black transition-all duration-300">
                Empezar un proyecto
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            className={`md:hidden focus:outline-none z-50 relative ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'text-white mix-blend-difference'}`}
            onClick={toggleMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </Slide>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div ref={menuRef} className="fixed inset-0 z-40 md:hidden bg-black w-full h-screen flex flex-col items-center justify-center">
              {/* Close Button inside Overlay */}
              <button 
                className="absolute top-6 right-8 text-white focus:outline-none z-50"
                onClick={toggleMenu}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <nav className="flex flex-col space-y-8 text-center text-2xl font-bold text-white items-center">
                <Link href="/servicios" onClick={toggleMenu} className="hover:text-[hsl(76,85%,67%)] transition-colors">servicios</Link>
                <Link href="/proyectos" onClick={toggleMenu} className="hover:text-[hsl(76,85%,67%)] transition-colors">proyectos</Link>
                <Link href="/trabajos" onClick={toggleMenu} className="hover:text-[hsl(76,85%,67%)] transition-colors">trabajos</Link>
                <Link href="/about" onClick={toggleMenu} className="hover:text-[hsl(76,85%,67%)] transition-colors">sobre nosotros</Link>
                <button onClick={() => { toggleMenu(); openModal(); }} className="group flex items-center gap-3 px-6 py-3 bg-transparent border border-white rounded-full hover:bg-[hsl(76,85%,67%)] hover:border-[hsl(76,85%,67%)] hover:text-black transition-all text-xl">
                    Empezar un proyecto
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </button>
              </nav>
        </div>
      )}
    </header>
  );
}
