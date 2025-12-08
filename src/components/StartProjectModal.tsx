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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

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
        { autoAlpha: 1, duration: 0.2 }
      );
      gsap.fromTo(contentRef.current,
        { y: 20, autoAlpha: 0, scale: 0.98 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out", force3D: true }
      );
    }
  }, [isModalOpen]);

  const handleNext = () => {
    if (step === 1) {
        // Basic validation could go here
        setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    console.log("Form Submitted:", { ...formData, date: `Dec ${selectedDate}`, time: selectedTime });
    closeModal();
    alert("¡Gracias! Nos pondremos en contacto contigo pronto.");
  };

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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 opacity-0 invisible will-change-opacity"
    >
      <div 
        ref={contentRef}
        className="bg-[#111] w-full max-w-5xl h-[85vh] md:h-[800px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative will-change-transform"
      >
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
            <div className="flex flex-col h-full p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Cuéntanos sobre tu proyecto</h2>
                    <p className="text-gray-400">Ayúdanos a entender qué necesitas para prepararnos mejor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tu Nombre</label>
                            <input 
                                type="text" 
                                className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Corporativo</label>
                            <input 
                                type="email" 
                                className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="john@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono</label>
                            <input 
                                type="tel" 
                                className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="+54 9 11 ..."
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Proyecto</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Sitio Web', 'E-commerce', 'Branding', 'App Web', 'Diseño', 'Otro'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({...formData, projectType: type})}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${formData.projectType === type ? 'bg-white text-black border-white' : 'bg-[#222] text-gray-300 border-white/10 hover:border-white/30'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Presupuesto (USD)</label>
                            <select 
                                className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                                value={formData.budget}
                                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                            >
                                <option value="" disabled>Selecciona un rango</option>
                                <option value="<1k">Menos de $1,000</option>
                                <option value="1k-5k">$1,000 - $5,000</option>
                                <option value="5k-10k">$5,000 - $10,000</option>
                                <option value=">10k">Más de $10,000</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Detalles del Proyecto</label>
                    <textarea 
                        className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors h-32 resize-none"
                        placeholder="Cuéntanos brevemente qué quieres lograr..."
                        value={formData.details}
                        onChange={(e) => setFormData({...formData, details: e.target.value})}
                    ></textarea>
                </div>

                <div className="mt-auto flex justify-end">
                    <button 
                        onClick={handleNext}
                        className="group flex items-center gap-2 px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform duration-300"
                    >
                        Siguiente: Agendar Llamada
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
        )}

        {/* Step 2: Calendar Booking (Cal.com style) */}
        {step === 2 && (
            <div className="flex flex-col md:flex-row h-full">
                {/* Left Panel: Info */}
                <div className="w-full md:w-1/4 bg-[#1a1a1a] p-6 md:p-8 border-r border-white/10 flex flex-col">
                    <button onClick={handleBack} className="self-start mb-8 text-gray-400 hover:text-white flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver
                    </button>
                    
                    <div className="mb-6">
                        <div className="w-12 h-12 bg-gray-700 rounded-full mb-4 overflow-hidden">
                            {/* Placeholder Avatar */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Codea Team</p>
                        <h3 className="text-2xl font-bold text-white mb-4">Intro Call</h3>
                        
                        <div className="space-y-3 text-gray-400 text-sm">
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                15 min
                            </div>
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                                Google Meet
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto text-xs text-gray-500">
                        <p>En nuestra llamada de 15 min:</p>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li>Introducción rápida</li>
                            <li>Discusión sobre tu proyecto</li>
                            <li>Siguientes pasos</li>
                        </ul>
                    </div>
                </div>

                {/* Middle Panel: Calendar */}
                <div className="w-full md:w-1/2 p-6 md:p-8 border-r border-white/10 bg-[#111]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Diciembre 2025</h3>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center mb-4">
                        {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
                            <div key={day} className="text-xs font-medium text-gray-500 py-2">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty days for start of month (Dec 1st 2025 is Monday) */}
                        <div className="aspect-square"></div>
                        
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
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
                <div className="w-full md:w-1/4 p-6 md:p-8 bg-[#111] overflow-y-auto custom-scrollbar">
                    <h3 className="text-lg font-medium text-white mb-6">
                        {selectedDate ? `Lunes ${selectedDate}` : 'Selecciona un día'}
                    </h3>
                    
                    <div className="space-y-3">
                        {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'].map((time) => (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`w-full py-3 px-4 rounded-lg border text-sm font-medium transition-all flex justify-between items-center group
                                    ${selectedTime === time 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-transparent border-white/20 text-white hover:border-white'
                                    }
                                `}
                            >
                                {time}
                                {selectedTime === time && (
                                    <span onClick={(e) => { e.stopPropagation(); handleSubmit(); }} className="bg-black text-white text-xs px-2 py-1 rounded hover:bg-gray-800">
                                        Confirmar
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
