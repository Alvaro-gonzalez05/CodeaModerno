"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const images = [
  { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop', alt: 'Palm trees', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-10' },
  { src: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=600&fit=crop', alt: 'Product', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-4' },
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop', alt: 'Road', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg' },
  { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', alt: 'Mountain', className: 'w-48 md:w-64 h-64 md:h-80 object-cover rounded-lg transform translate-y-8' },
  { src: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=200&h=400&fit=crop', alt: 'Abstract', className: 'w-24 md:w-32 h-48 md:h-64 object-cover rounded-lg transform translate-y-16' },
  { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop', alt: 'Palm trees 2', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-10' },
  { src: 'https://images.unsplash.com/photo-1552674605-46d526758ad2?w=600&h=600&fit=crop', alt: 'Runner', className: 'w-64 md:w-80 h-80 md:h-96 object-cover rounded-lg z-10 shadow-2xl' },
  { src: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=600&fit=crop', alt: 'Product 2', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-4' },
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop', alt: 'Road 2', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg' },
  { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', alt: 'Mountain 2', className: 'w-48 md:w-64 h-64 md:h-80 object-cover rounded-lg transform translate-y-8' },
  { src: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=200&h=400&fit=crop', alt: 'Abstract 2', className: 'w-24 md:w-32 h-48 md:h-64 object-cover rounded-lg transform translate-y-16' },
  { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop', alt: 'Palm trees 3', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-10' },
  { src: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=600&fit=crop', alt: 'Product 3', className: 'w-32 md:w-48 h-64 md:h-80 object-cover rounded-lg transform translate-y-4' },
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

  }, { scope: triggerRef });

  return (
    <section className="overflow-hidden h-screen flex flex-col justify-center bg-white text-black rounded-[60px] z-[20] relative" ref={triggerRef}>
      <div 
        ref={sectionRef} 
        className="flex flex-row items-center w-fit px-10 gap-10"
      >
        {images.map((img, index) => (
          <div key={index} className="flex-shrink-0 relative">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={img.src} 
              alt={img.alt} 
              className={`${img.className} hover:scale-105 transition-transform duration-500`}
            />
          </div>
        ))}
      </div>
      
      <div ref={textRef} className="w-screen text-center mt-4 z-10">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter flex flex-wrap justify-center items-baseline gap-4">
          <span>Here&apos;s</span>
          <span className="font-serif italic font-normal">how</span>
          <span className="font-serif italic font-normal">to build it</span>
        </h2>
      </div>
    </section>
  );
}
