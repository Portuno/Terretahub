import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PillarsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const pillars = [
  { id: "I.", name: "Tecnología" },
  { id: "II.", name: "Arte & Educación" },
  { id: "III.", name: "Finanzas" },
  { id: "IV.", name: "Legal" },
  { id: "V.", name: "Comunidad" },
  { id: "VI.", name: "Salud" }
];

export const PillarsModal: React.FC<PillarsModalProps> = ({ isOpen, onClose }) => {
  // Animation states
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      setTimeout(() => setIsVisible(true), 50);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 transition-opacity duration-700 ease-out-expo ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop with Blur - Clicking here closes the modal */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-all duration-700 ease-out"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-5xl bg-[#2C1E1A] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/5 transform transition-all duration-800 cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-16 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button "X" */}
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 md:top-8 md:right-8 text-white/40 hover:text-[#C5A065] hover:bg-white/5 p-2 rounded-full transition-all duration-300 z-20 hover:rotate-90"
        >
            <X size={24} />
        </button>

        {/* Content Padding Wrapper */}
        <div className="p-8 md:p-16 flex flex-col items-center w-full">
            
            {/* Center Subtitle */}
            <div className={`text-center mb-2 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className="text-[#C5A065] text-[10px] md:text-xs tracking-[0.3em] font-sans uppercase font-semibold">
                    NUESTROS PILARES
                </h3>
            </div>
            
            {/* Big Title "Identidad" */}
            <h2 className={`font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-12 md:mb-16 tracking-tight font-medium text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Identidad
            </h2>

            {/* Grid Layout */}
            <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-0 transition-all duration-1000 delay-500 ease-out-expo ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {pillars.map((pillar, index) => (
                    <div 
                        key={index} 
                        className="group flex items-baseline border-b border-white/10 py-5 md:py-6 transition-colors duration-500 hover:border-white/30"
                    >
                        {/* Roman Numeral */}
                        <span className="font-serif text-[#C5A065] text-sm md:text-base mr-6 md:mr-8 min-w-[25px] text-right font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            {pillar.id}
                        </span>
                        
                        {/* Name */}
                        <span className="font-serif text-2xl md:text-3xl text-white/80 group-hover:text-white transition-colors duration-300 font-normal">
                            {pillar.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};