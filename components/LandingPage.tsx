import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactModal } from './ContactModal';
import { PillarsModal } from './PillarsModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPillarsOpen, setIsPillarsOpen] = useState(false);

  return (
    <div className="flex flex-col font-sans overflow-hidden relative animate-fade-in w-full h-full">
      
      {/* --- HERO SECTION --- */}
      <section className="flex-grow flex flex-col items-center justify-center px-6 md:px-12 max-w-7xl mx-auto w-full py-20 min-h-[calc(100vh-100px)]">
        
        {/* Title */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-terreta-dark font-bold mb-4 tracking-tight text-center relative z-10">
          Terreta Hub
        </h1>
        {/* Underline Element */}
        <div className="w-24 h-1.5 bg-[#D8902A] mb-12 rounded-full opacity-90"></div>

        {/* Quote Card Container */}
        <div className="relative w-full max-w-4xl mx-auto mb-16 md:mb-20 group">
          {/* Top thick border visual simulation */}
          <div className="h-4 bg-[#E6DEC9] w-[98%] mx-auto rounded-t-sm opacity-90 shadow-sm"></div>
          
          <div className="bg-white p-8 md:p-14 text-center shadow-md relative rounded-sm border-x border-stone-100">
            {/* Quote Marks */}
            <span className="absolute top-6 left-6 text-5xl text-[#D8902A] font-serif leading-none opacity-40 select-none">"</span>
            
            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-terreta-dark/80 italic leading-relaxed px-2 md:px-8">
              Desde el corazón de nuestra Terreta, estamos cocinando algo grande. 
              Un espacio donde las ideas brotan, las mentes se conectan y el futuro 
              se construye con sabor a Valencia.
              <span className="block mt-4 text-terreta-dark font-normal not-italic opacity-90">Esto es solo el comienzo. ¡Bienvenido a casa!</span>
            </p>

            <span className="absolute bottom-[-20px] right-10 text-5xl text-[#D8902A] font-serif leading-none opacity-40 rotate-180 select-none">"</span>
          </div>
           {/* Bottom thick border visual simulation */}
           <div className="h-4 bg-[#E6DEC9] w-[98%] mx-auto rounded-b-sm shadow-md opacity-90"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-5 items-center justify-center w-full z-10">
          {/* Explora - Orange Button */}
          <button 
            onClick={() => navigate('/agora')}
            className="bg-[#D97706] hover:bg-[#B45309] text-white px-8 py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto min-w-[220px] uppercase"
          >
            Explora la Comunidad
          </button>
          
          {/* Pilares - Beige Button */}
          <button 
            onClick={() => setIsPillarsOpen(true)}
            className="bg-[#F3EFE7] hover:bg-[#EBE5DA] text-terreta-dark px-8 py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all border border-[#D1C9BC] hover:border-[#BFB6A5] w-full md:w-auto min-w-[220px] uppercase shadow-sm"
          >
            Conoce nuestros pilares
          </button>

          {/* Contacto - Ghost/Text Button */}
          <button 
            onClick={() => setIsContactOpen(true)}
            className="bg-transparent text-terreta-dark/60 hover:text-terreta-dark px-8 py-4 rounded-full font-bold tracking-widest text-xs md:text-sm transition-all w-full md:w-auto min-w-[150px] uppercase"
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
