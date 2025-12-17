import React from 'react';
import { FolderKanban } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in opacity-50 p-10">
      <div className="w-16 h-16 bg-[#EBE5DA] rounded-full flex items-center justify-center mb-4">
        <FolderKanban size={32} className="text-terreta-dark/50" />
      </div>
      <h3 className="font-serif text-2xl text-terreta-dark mb-2">Próximamente</h3>
      <p className="max-w-md mx-auto">La sección de <span className="font-bold capitalize">{title}</span> está en construcción. ¡Mantente atento!</p>
    </div>
  );
};

