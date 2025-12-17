import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactModal } from './ContactModal';
import { PillarsModal } from './PillarsModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPillarsOpen, setIsPillarsOpen] = useState(false);

  return (
    <div className="flex flex-col font-sans overflow-hidden relative animate-fade-in w-full h-screen max-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 md:px-8 max-w-7xl mx-auto w-full h-full">
        
        {/* Title */}
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-terreta-dark font-bold mb-2 tracking-tight text-center relative z-10">
          Terreta Hub
        </h1>
        {/* Underline Element */}
        <div className="w-16 h-1 bg-terreta-accent mb-6 rounded-full opacity-90"></div>

        {/* Quote Card Container */}
        <div className="relative w-full max-w-[90%] md:max-w-[85%] mx-auto mb-8 md:mb-12 group flex-shrink-0">
          
          <div className="relative bg-terreta-card/30 backdrop-blur-md p-8 md:p-14 text-center shadow-2xl rounded-sm border-none overflow-hidden">
            
            {/* Alchemical Corners */}
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
               <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5"/>
               </svg>
            </div>
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rotate-90">
               <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5"/>
               </svg>
            </div>
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none rotate-180">
               <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5"/>
               </svg>
            </div>
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none -rotate-90">
               <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5"/>
               </svg>
            </div>

            {/* Connecting Lines */}
            <div className="absolute top-0 left-16 right-16 h-[1px] bg-gradient-to-r from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0"></div>
            <div className="absolute bottom-0 left-16 right-16 h-[1px] bg-gradient-to-r from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0"></div>
            <div className="absolute left-0 top-16 bottom-16 w-[1px] bg-gradient-to-b from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0"></div>
            <div className="absolute right-0 top-16 bottom-16 w-[1px] bg-gradient-to-b from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0"></div>

            {/* Ambient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-terreta-accent/10 to-transparent pointer-events-none"></div>

            {/* Quote Marks */}
            <span className="absolute top-6 left-8 text-5xl md:text-7xl text-terreta-accent/20 font-serif leading-none select-none animate-pulse-slow">"</span>
            
            <div className="relative z-10 space-y-4 md:space-y-6 max-w-5xl mx-auto">
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-terreta-dark via-terreta-accent to-terreta-dark font-bold leading-tight animate-slide-up pb-1 tracking-tight drop-shadow-sm">
                Has entrado al Epicentre de Terreta Hub.
              </h2>
              
              <p className="font-sans font-light text-base md:text-xl lg:text-2xl text-terreta-dark/90 leading-relaxed animate-slide-up delay-100 max-w-4xl mx-auto drop-shadow-sm line-clamp-[8]">
                Un laboratorio digital donde animarse a experimentar y crear cosas bajo el sol de la intuición. 
                Espacio ideal para que las ideas broten, las mentes conecten y el futuro sea construido con sabor a Valencia.
              </p>
            </div>

            <span className="absolute bottom-4 right-10 text-5xl md:text-7xl text-terreta-accent/20 font-serif leading-none rotate-180 select-none animate-pulse-slow delay-300">"</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center w-full z-10 mt-2">
          {/* Explora - Orange Button */}
          <button 
            onClick={() => navigate('/agora')}
            className="bg-terreta-accent hover:opacity-90 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto min-w-[200px] uppercase"
          >
            Explora la Comunidad
          </button>
          
          {/* Pilares - Beige Button */}
          <button 
            onClick={() => setIsPillarsOpen(true)}
            className="bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-6 py-3 md:px-8 md:py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all border border-terreta-border hover:border-terreta-dark/30 w-full md:w-auto min-w-[200px] uppercase shadow-sm"
          >
            Conoce nuestros pilares
          </button>

          {/* Contacto - Ghost/Text Button */}
          <button 
            onClick={() => setIsContactOpen(true)}
            className="bg-transparent text-terreta-dark/60 hover:text-terreta-dark px-6 py-3 md:px-8 md:py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all w-full md:w-auto min-w-[120px] uppercase"
          >
            Contacto
          </button>
        </div>
      </section>

      {/* --- MODALS --- */}
      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
      />

      <PillarsModal
        isOpen={isPillarsOpen}
        onClose={() => setIsPillarsOpen(false)}
      />

    </div>
  );
};
