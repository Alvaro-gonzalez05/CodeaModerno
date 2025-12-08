"use client";
import React, { useState, useEffect } from 'react';
import { useModal } from '@/context/ModalContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLenis } from '@studio-freight/react-lenis';

export default function StartProjectModal() {
  const { isModalOpen, closeModal } = useModal();
  const lenis = useLenis();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const stepContainerRef = React.useRef<HTMLDivElement>(null);
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const successOverlayRef = React.useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    details: '',
    date: '',
    time: ''
  });

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<number | null>(8); // Default to 8th as in image
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      setStep(1);
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    
    // Cleanup function to ensure scroll is restored if component unmounts
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [isModalOpen, lenis]);

  useGSAP(() => {
    if (isModalOpen) {
      gsap.fromTo(containerRef.current, 
        { autoAlpha: 0 }, 
        { autoAlpha: 1, duration: 0.1 }
      );
      gsap.fromTo(contentRef.current,
        { y: 10, autoAlpha: 0, scale: 0.99 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.2, ease: "power1.out", force3D: true }
      );
    }
  }, [isModalOpen]);

  // Step Transition Animation
  useGSAP(() => {
    if (!isModalOpen) return;
    
    if (step === 1) {
        gsap.fromTo(stepContainerRef.current,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.3, ease: "power2.out", delay: 0.1 }
        );
    } else if (step === 2) {
        gsap.fromTo(stepContainerRef.current,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
        );
    }
  }, [step, isModalOpen]);

  const handleNext = () => {
    if (step === 1) {
        gsap.to(stepContainerRef.current, {
            opacity: 0,
            x: -20,
            duration: 0.25,
            ease: "power2.inOut",
            onComplete: () => setStep(2)
        });
    }
  };

  const handleBack = () => {
    gsap.to(stepContainerRef.current, {
        opacity: 0,
        x: 20,
        duration: 0.25,
        ease: "power2.inOut",
        onComplete: () => setStep(1)
    });
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    setIsSuccess(true);
  };

  useGSAP(() => {
    if (isSuccess && submitButtonRef.current && contentRef.current && successOverlayRef.current) {
        const btnRect = submitButtonRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        // Calculate relative position for the overlay to start exactly where the button is
        const startTop = btnRect.top - contentRect.top;
        const startLeft = btnRect.left - contentRect.left;

        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    closeModal();
                    // Reset states after closing
                    setTimeout(() => {
                        setIsSubmitting(false);
                        setIsSuccess(false);
                        setStep(1);
                    }, 500);
                }, 3000);
            }
        });

        tl.fromTo(successOverlayRef.current, 
            {
                top: startTop,
                left: startLeft,
                width: btnRect.width,
                height: btnRect.height,
                borderRadius: '9999px',
                opacity: 1
            },
            {
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '0px', // Fill completely
                duration: 0.6,
                ease: "power4.inOut"
            }
        );
        
        tl.to(".success-content", {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.7)"
        }, "-=0.2");
    }
  }, [isSuccess]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      closeModal();
    }
  };

  if (!isModalOpen) return null;

  return (
    <div 
        ref={containerRef} 
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 opacity-0 invisible will-change-opacity"
    >
      <div 
        ref={contentRef}
        className="bg-[#111] w-full max-w-5xl h-[75vh] md:h-[650px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative will-change-transform"
      >
        {/* Success Overlay */}
        {isSuccess && (
            <div 
                ref={successOverlayRef} 
                className="absolute z-50 bg-white flex items-center justify-center overflow-hidden pointer-events-none"
            >
                <div className="success-content opacity-0 translate-y-4 scale-90 flex flex-col items-center text-center p-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-black mb-3">¡Agenda Confirmada!</h3>
                    <p className="text-gray-600 max-w-md text-lg leading-relaxed">
                        Tu llamada ha sido programada con éxito.<br/>
                        Pronto uno de nuestros agentes se contactará contigo.
                    </p>
                </div>
            </div>
        )}

        {/* Close Button */}
        <button 
            onClick={closeModal}
            className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        {/* Step 1: Project Details Form */}
        {step === 1 && (
            <div ref={stepContainerRef} className="flex flex-col h-full p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="mb-6 shrink-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Cuéntanos sobre tu proyecto</h2>
                    <p className="text-gray-400 text-sm">Ayúdanos a entender qué necesitas para prepararnos mejor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Tu Nombre</label>
                            <input 
                                type="text" 
                                className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Corporativo</label>
                            <input 
                                type="email" 
                                className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="john@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Teléfono</label>
                            <input 
                                type="tel" 
                                className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="+54 9 11 ..."
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">Tipo de Proyecto</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Sitio Web', 'E-commerce', 'Branding', 'App Web', 'Diseño', 'Otro'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({...formData, projectType: type})}
                                        className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${formData.projectType === type ? 'bg-white text-black border-white' : 'bg-[#222] text-gray-300 border-white/10 hover:border-white/30'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-3">Presupuesto (USD)</label>
                            <div className="px-1">
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="10000" 
                                    step="100"
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-white"
                                    style={{
                                        background: `linear-gradient(to right, white ${(((!isNaN(parseInt(formData.budget)) ? parseInt(formData.budget) : 1000) - 100) / (10000 - 100)) * 100}%, #222 ${(((!isNaN(parseInt(formData.budget)) ? parseInt(formData.budget) : 1000) - 100) / (10000 - 100)) * 100}%)`
                                    }}
                                    value={!isNaN(parseInt(formData.budget)) ? parseInt(formData.budget) : 1000}
                                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                    <span>$100</span>
                                    <span>$5k</span>
                                    <span>$10k+</span>
                                </div>
                                <div className="mt-2 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white mr-1">$</span>
                                    <input
                                        type="number"
                                        className="bg-transparent text-sm font-bold text-white focus:outline-none w-20 text-center border-b border-white/20 focus:border-white transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={!isNaN(parseInt(formData.budget)) ? parseInt(formData.budget) : 1000}
                                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grow flex flex-col">
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Detalles del Proyecto</label>
                    <textarea 
                        className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors resize-none grow"
                        placeholder="Cuéntanos brevemente qué quieres lograr..."
                        value={formData.details}
                        onChange={(e) => setFormData({...formData, details: e.target.value})}
                    ></textarea>
                </div>

                <div className="mt-auto flex justify-end shrink-0">
                    <button 
                        onClick={handleNext}
                        className="group flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform duration-300"
                    >
                        Siguiente: Agendar Llamada
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
        )}

        {/* Step 2: Calendar Booking (Cal.com style) */}
        {step === 2 && (
            <div ref={stepContainerRef} className="flex flex-col md:flex-row h-full">
                {/* Left Panel: Info */}
                <div className="w-full md:w-1/4 bg-[#1a1a1a] p-5 border-r border-white/10 flex flex-col">
                    <button onClick={handleBack} className="self-start mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver
                    </button>
                    
                    <div className="mb-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full mb-3 overflow-hidden">
                            {/* Placeholder Avatar */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                        </div>
                        <p className="text-gray-400 text-xs font-medium mb-1">Codea Team</p>
                        <h3 className="text-xl font-bold text-white mb-3">Intro Call</h3>
                        
                        <div className="space-y-2 text-gray-400 text-xs">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                15 min
                            </div>
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                                Google Meet
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto text-xs text-gray-500">
                        <p>En nuestra llamada de 15 min:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Introducción rápida</li>
                            <li>Discusión sobre tu proyecto</li>
                            <li>Siguientes pasos</li>
                        </ul>
                    </div>
                </div>

                {/* Middle Panel: Calendar */}
                <div className="w-full md:w-1/2 p-5 border-r border-white/10 bg-[#111]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Diciembre 2025</h3>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
                            <div key={day} className="text-[10px] font-medium text-gray-500 py-1">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty days for start of month (Dec 1st 2025 is Monday) */}
                        <div className="aspect-square"></div>
                        
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-all
                                    ${selectedDate === day 
                                        ? 'bg-white text-black' 
                                        : 'text-gray-300 hover:bg-white/10'
                                    }
                                    ${[6, 7, 13, 14, 20, 21, 27, 28].includes(day) ? 'opacity-30 cursor-not-allowed' : ''}
                                `}
                                disabled={[6, 7, 13, 14, 20, 21, 27, 28].includes(day)} // Disable weekends roughly
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Time Slots */}
                <div className="w-full md:w-1/4 p-5 bg-[#111] flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar grow mb-4">
                        <h3 className="text-sm font-medium text-white mb-4">
                            {selectedDate ? `Lunes ${selectedDate}` : 'Selecciona un día'}
                        </h3>
                        
                        <div className="space-y-2">
                            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'].map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition-all flex justify-center items-center group
                                        ${selectedTime === time 
                                            ? 'bg-white text-black border-white' 
                                            : 'bg-transparent border-white/20 text-white hover:border-white'
                                        }
                                    `}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        ref={submitButtonRef}
                        onClick={handleSubmit}
                        disabled={!selectedDate || !selectedTime || isSubmitting}
                        className={`w-full py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2
                            ${selectedDate && selectedTime 
                                ? 'bg-white text-black hover:scale-105' 
                                : 'bg-[#222] text-gray-500 cursor-not-allowed border border-white/10'
                            }
                        `}
                    >
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
