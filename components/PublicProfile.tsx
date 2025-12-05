import React, { useMemo } from 'react';
import { UserProfile, LinkBioProfile } from '../types';
import { ProfileRenderer, THEMES } from './ProfileEditor';

interface PublicProfileProps {
  handle: string;
  mockUsers: UserProfile[];
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ handle, mockUsers }) => {
  // Find the mock user
  const user = mockUsers.find(u => u.handle === handle || u.handle === `@${handle}`);

  // Generate a mock profile configuration based on the user's role/tags
  // This simulates fetching their custom data from a database
  const profile: LinkBioProfile | null = useMemo(() => {
    if (!user) return null;

    // Deterministic Theme Selection based on ID/Role
    let themeIndex = 0;
    if (user.role === 'ARQUITECTA' || user.role === 'DISEÑO') themeIndex = 1; // Arcilla
    else if (user.role === 'DESARROLLADOR') themeIndex = 3; // Minimal
    else if (user.role === 'GASTRONOMÍA') themeIndex = 0; // Terreta
    else themeIndex = 2; // Bosque

    const theme = THEMES[themeIndex];

    return {
      username: user.handle.replace('@', ''),
      displayName: user.name,
      bio: `Experto en ${user.tags.join(', ')}. Conectando ideas en Terreta Hub.`,
      avatar: user.avatar,
      socials: {
        twitter: user.handle,
        instagram: user.handle,
        linkedin: `https://linkedin.com/in/${user.name.replace(/\s/g, '').toLowerCase()}`,
        website: 'https://terretahub.com'
      },
      blocks: [
        { id: '1', type: 'header', title: 'Mis Proyectos', isVisible: true },
        { id: '2', type: 'link', title: 'Portafolio Profesional', url: '#', icon: 'globe', isVisible: true },
        { id: '3', type: 'link', title: 'Agenda una llamada', url: '#', icon: 'zap', isVisible: true },
        { id: '4', type: 'header', title: 'Sobre Mí', isVisible: true },
        { id: '5', type: 'text', content: `Hola, soy ${user.name}. Me apasiona el mundo de ${user.role} y estoy aquí para colaborar.`, isVisible: true },
        { id: '6', type: 'link', title: 'Colabora conmigo', url: '#', icon: 'star', isVisible: true },
      ],
      theme: theme
    };
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-10 text-center">
        <h2 className="text-2xl font-serif text-terreta-dark mb-2">Usuario no encontrado</h2>
        <p className="text-gray-500">El perfil que buscas no existe o ha sido eliminado.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-y-auto">
       {/* We reuse the ProfileRenderer but wrap it to look good on desktop full-width */}
       <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden">
          <ProfileRenderer profile={profile} />
       </div>
    </div>
  );
};