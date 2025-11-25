"use client";
import Link from 'next/link';
import { Slide } from "react-awesome-reveal";
import { useState, useEffect } from "react";

export default function Header() {
  const [key, setKey] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollY > windowHeight) {
        if (isVisible) setIsVisible(false);
      } else {
        if (!isVisible) {
          setIsVisible(true);
          setKey(prev => prev + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  return (
    <header className="fixed top-0 left-0 w-full z-10">
      <Slide key={key} direction="down" triggerOnce={false}>
        <div className="flex justify-between items-center py-6 px-8 md:px-16">
          <div className="text-2xl font-bold tracking-tighter">
            <Link href="/">Codea</Link>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="#work" className="hover:text-gray-300 transition-colors">work</Link>
            <Link href="#about" className="hover:text-gray-300 transition-colors">about us</Link>
            <Link href="#start" className="hover:text-gray-300 transition-colors">start a project</Link>
          </nav>
        </div>
      </Slide>
    </header>
  );
}
