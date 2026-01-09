import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, User, CheckCircle, Globe, 
  Instagram, Twitter, Linkedin, Youtube, Music, MessageCircle,
  Palette, Loader2, FolderKanban, Calendar, Package, MessageSquare
} from 'lucide-react';
import { AuthUser, SocialLinks, BioTheme } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ProjectPreview {
  id: string;
  name: string;
  slogan?: string;
  images: string[];
  phase: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface OnboardingFlowProps {
  user: AuthUser;
  onComplete: () => void;
}

type Acto = 'acto1' | 'acto2' | 'acto3' | 'completing' | 'completed';
type Slide = 'proyectos' | 'eventos' | 'recursos' | 'agora';

// Mapeo de colores principales a temas
const COLOR_THEMES: Record<string, BioTheme> = {
  tierra: {
    id: 'tierra',
    name: 'Tierra',
    bgType: 'color',
    bgColor: '#F9F6F0',
    textColor: '#3E2723',
    buttonStyle: 'solid',
    buttonColor: '#D97706',
    buttonTextColor: '#FFFFFF',
    font: 'serif'
  },
  fuego: {
    id: 'fuego',
    name: 'Fuego',
    bgType: 'color',
    bgColor: '#FFF5F5',
    textColor: '#7F1D1D',
    buttonStyle: 'solid',
    buttonColor: '#EF4444',
    buttonTextColor: '#FFFFFF',
    font: 'sans'
  },
  agua: {
    id: 'agua',
    name: 'Agua',
    bgType: 'color',
    bgColor: '#EFF6FF',
    textColor: '#1E3A8A',
    buttonStyle: 'solid',
    buttonColor: '#3B82F6',
    buttonTextColor: '#FFFFFF',
    font: 'sans'
  },
  aire: {
    id: 'aire',
    name: 'Aire',
    bgType: 'color',
    bgColor: '#F8FAFC',
    textColor: '#334155',
    buttonStyle: 'outline',
    buttonColor: '#64748B',
    buttonTextColor: '#64748B',
    font: 'sans'
  }
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentActo, setCurrentActo] = useState<Acto>('acto1');
  const [currentSlide, setCurrentSlide] = useState<Slide>('proyectos');
  
  // Acto I - Información básica
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Acto II - Slides (no estado necesario, solo navegación)
  
  // Acto III - Recopilación de datos
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<SocialLinks>({});
  const [website, setWebsite] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('tierra');
  const [extension, setExtension] = useState('');
  const [extensionError, setExtensionError] = useState('');
  const [checkingExtension, setCheckingExtension] = useState(false);
  
  // Estado de finalización
  const [completedExtension, setCompletedExtension] = useState('');
  const [loadingExistingProfile, setLoadingExistingProfile] = useState(true);
  
  // Proyectos para mostrar en el slide
  const [featuredProjects, setFeaturedProjects] = useState<ProjectPreview[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Cargar datos existentes del perfil si existen
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const { data: existingProfile } = await supabase
          .from('link_bio_profiles')
          .select('bio, socials, theme, custom_slug')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingProfile) {
          if (existingProfile.bio) {
            setBio(existingProfile.bio);
          }
          if (existingProfile.socials) {
            setSocials(existingProfile.socials as SocialLinks);
            if ((existingProfile.socials as SocialLinks).website) {
              setWebsite((existingProfile.socials as SocialLinks).website || '');
            }
          }
          if (existingProfile.theme) {
            const theme = existingProfile.theme as BioTheme;
            // Mapear tema existente a color si es posible
            const colorKey = Object.keys(COLOR_THEMES).find(
              key => COLOR_THEMES[key].buttonColor === theme.buttonColor
            );
            if (colorKey) {
              setSelectedColor(colorKey);
            }
          }
          if (existingProfile.custom_slug) {
            setExtension(existingProfile.custom_slug);
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil existente:', err);
      } finally {
        setLoadingExistingProfile(false);
      }
    };
    
    loadExistingProfile();
  }, [user.id]);

  // Cargar proyectos destacados para el slide
  useEffect(() => {
    const loadFeaturedProjects = async () => {
      try {
        setLoadingProjects(true);
        // Cargar proyectos en fase "Escalado" y publicados
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            slogan,
            images,
            phase,
            author_id,
            profiles!projects_author_id_fkey (
              name,
              avatar
            )
          `)
          .eq('status', 'published')
          .eq('phase', 'Escalado')
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (error) {
          console.error('Error al cargar proyectos:', error);
          // Proyectos de ejemplo si no hay en la BD
          setFeaturedProjects([
            {
              id: '1',
              name: 'El Fotógrafer',
              slogan: 'Capturando momentos únicos',
              images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photographer'
              }
            },
            {
              id: '2',
              name: 'Versa Producciones',
              slogan: 'Innovación en producción audiovisual',
              images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=versa'
              }
            }
          ]);
        } else if (projectsData && projectsData.length > 0) {
          const formattedProjects: ProjectPreview[] = projectsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            slogan: p.slogan,
            images: p.images || [],
            phase: p.phase,
            author: {
              name: p.profiles?.name || 'Autor',
              avatar: p.profiles?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profiles?.name || 'user'}`
            }
          }));
          setFeaturedProjects(formattedProjects);
        } else {
          // Proyectos de ejemplo si no hay en la BD
          setFeaturedProjects([
            {
              id: '1',
              name: 'El Fotógrafer',
              slogan: 'Capturando momentos únicos',
              images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photographer'
              }
            },
            {
              id: '2',
              name: 'Versa Producciones',
              slogan: 'Innovación en producción audiovisual',
              images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=versa'
              }
            }
          ]);
        }
      } catch (err) {
        console.error('Error al cargar proyectos destacados:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    loadFeaturedProjects();
  }, []);

  const accentColor = `rgb(var(--accent))`;

  // Validar username
  const validateUsername = async (value: string) => {
    const cleanUsername = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
    
    if (cleanUsername.length < 3) {
      setUsernameError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    
    if (cleanUsername.length > 30) {
      setUsernameError('El usuario no puede tener más de 30 caracteres');
      return false;
    }
    
    // Si es el mismo username del usuario, no verificar
    if (cleanUsername === user.username) {
      setUsernameError('');
      return true;
    }
    
    setCheckingUsername(true);
    setUsernameError('');
    
    try {
      const { data: existingProfiles, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        setUsernameError('Error al verificar el usuario');
        setCheckingUsername(false);
        return false;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setUsernameError('Este usuario ya está en uso');
        setCheckingUsername(false);
        return false;
      }
      
      setUsernameError('');
      setCheckingUsername(false);
      return true;
    } catch (err) {
      setUsernameError('Error al verificar el usuario');
      setCheckingUsername(false);
      return false;
    }
  };

  // Validar extensión
  const validateExtension = async (value: string) => {
    const cleanExtension = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (cleanExtension.length < 3) {
      setExtensionError('La extensión debe tener al menos 3 caracteres');
      return false;
    }
    
    if (cleanExtension.length > 50) {
      setExtensionError('La extensión no puede tener más de 50 caracteres');
      return false;
    }
    
    setCheckingExtension(true);
    setExtensionError('');
    
    try {
      const { data: existingProfiles, error } = await supabase
        .from('link_bio_profiles')
        .select('custom_slug')
        .eq('custom_slug', cleanExtension)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        setExtensionError('Error al verificar la extensión');
        setCheckingExtension(false);
        return false;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setExtensionError('Esta extensión ya está en uso');
        setCheckingExtension(false);
        return false;
      }
      
      setExtensionError('');
      setCheckingExtension(false);
      return true;
    } catch (err) {
      setExtensionError('Error al verificar la extensión');
      setCheckingExtension(false);
      return false;
    }
  };

  // Manejar cambio de username
  const handleUsernameChange = async (value: string) => {
    const cleanValue = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
    setUsername(cleanValue);
    if (cleanValue.length >= 3) {
      await validateUsername(cleanValue);
    } else {
      setUsernameError('');
    }
  };

  // Manejar cambio de extensión
  const handleExtensionChange = async (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setExtension(cleanValue);
    if (cleanValue.length >= 3) {
      await validateExtension(cleanValue);
    } else {
      setExtensionError('');
    }
  };

  // Navegar al siguiente slide en Acto II
  const nextSlide = () => {
    const slides: Slide[] = ['proyectos', 'eventos', 'recursos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    if (currentIndex < slides.length - 1) {
      setCurrentSlide(slides[currentIndex + 1]);
    }
  };

  const prevSlide = () => {
    const slides: Slide[] = ['proyectos', 'eventos', 'recursos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    if (currentIndex > 0) {
      setCurrentSlide(slides[currentIndex - 1]);
    }
  };

  // Completar Acto I
  const handleActo1Complete = async () => {
    if (!name.trim()) {
      return;
    }
    
    const isValid = await validateUsername(username);
    if (!isValid || usernameError) {
      return;
    }
    
    // Actualizar nombre y username en el perfil
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), username })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error al actualizar perfil:', error);
        return;
      }
      
      setCurrentActo('acto2');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
    }
  };

  // Completar Acto II
  const handleActo2Complete = () => {
    setCurrentActo('acto3');
  };

  // Completar Acto III y finalizar
  const handleActo3Complete = async () => {
    if (!bio.trim()) {
      return;
    }
    
    const isValid = await validateExtension(extension);
    if (!isValid || extensionError) {
      return;
    }
    
    setCurrentActo('completing');
    
    try {
      // Preparar datos del perfil
      const selectedTheme = COLOR_THEMES[selectedColor];
      const socialsWithWebsite = { ...socials };
      if (website.trim()) {
        socialsWithWebsite.website = website.trim();
      }
      
      // Crear o actualizar link_bio_profile
      const profileData = {
        user_id: user.id,
        username: username,
        display_name: name.trim(),
        bio: bio.trim(),
        avatar: user.avatar,
        socials: socialsWithWebsite,
        blocks: [
          { id: '1', type: 'header', title: 'Sobre Mí', isVisible: true },
          { id: '2', type: 'text', content: bio.trim(), isVisible: true }
        ],
        theme: selectedTheme,
        is_published: true,
        custom_slug: extension.toLowerCase().replace(/[^a-z0-9_-]/g, '')
      };
      
      // Verificar si ya existe un perfil
      const { data: existing } = await supabase
        .from('link_bio_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('link_bio_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (updateError) {
          throw updateError;
        }
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('link_bio_profiles')
          .insert(profileData);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      // Actualizar onboarding_completed
      const { error: onboardingError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      if (onboardingError) {
        throw onboardingError;
      }
      
      setCompletedExtension(extension.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
      setCurrentActo('completed');
      
      // Esperar un momento antes de permitir navegar
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al completar onboarding:', err);
      alert('Error al completar el onboarding. Por favor, intenta nuevamente.');
      setCurrentActo('acto3');
    }
  };

  // Renderizar Acto I
  const renderActo1 = () => (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Glassmorphism Card */}
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl text-[rgb(var(--text-main))] mb-3">
            Bienvenido a Terreta Hub
          </h2>
          <p className="text-[rgb(var(--text-secondary))] font-sans">
            Comencemos configurando tu información básica
          </p>
        </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Nombre completo
          </label>
          <div className="relative group">
            <User size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
              placeholder="Tu nombre completo"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Usuario
          </label>
          <div className="relative group">
            <span className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 font-bold text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="w-full pl-8 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
              placeholder="usuario"
            />
            {checkingUsername && (
              <div className="absolute right-3 top-3">
                <Loader2 size={16} className="animate-spin text-[rgb(var(--accent))]" />
              </div>
            )}
          </div>
          {usernameError && (
            <p className="mt-2 text-xs text-red-500">{usernameError}</p>
          )}
          <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
            Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.
          </p>
        </div>
      </div>
      
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleActo1Complete}
            disabled={!name.trim() || !username || usernameError !== '' || checkingUsername}
            style={{ backgroundColor: accentColor }}
            className="px-8 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Continuar
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar Acto II - Slides
  const renderActo2 = () => {
    const slides: Slide[] = ['proyectos', 'eventos', 'recursos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        {/* Glassmorphism Card */}
        <div 
          className="backdrop-blur-xl bg-white/70 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl border border-white/30"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
          }}
        >
          <div className="text-center mb-5 md:mb-6">
            <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
              Conoce Terreta Hub
            </h2>
            <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans">
              Descubre todo lo que puedes hacer en nuestra plataforma
            </p>
          </div>
          
          {/* Contenido del slide con glassmorphism interno */}
          <div 
            className={`backdrop-blur-md bg-white/50 rounded-2xl border border-white/40 shadow-lg ${
              currentSlide === 'proyectos' || currentSlide === 'eventos'
                ? 'p-4 md:p-6' 
                : 'p-6 md:p-8 min-h-[300px] flex flex-col items-center justify-center'
            }`}
            style={{
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1) inset',
              maxHeight: (currentSlide === 'proyectos' || currentSlide === 'eventos') ? 'calc(90vh - 180px)' : 'auto'
            }}
          >
          {currentSlide === 'proyectos' && (
            <div className="w-full h-full flex flex-col">
              <div className="text-center mb-4 md:mb-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-3">
                  <FolderKanban size={28} className="md:w-8 md:h-8" style={{ color: accentColor }} />
                </div>
                <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
                  Impulsa tus ideas
                </h3>
                <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed max-w-2xl mx-auto px-2">
                  Desde películas rodadas en el corazón de Valencia hasta estudios creativos de vanguardia. 
                  En Terreta Hub, los proyectos encuentran su lugar.
                </p>
              </div>
              
              {/* Grid de proyectos - optimizado para mobile */}
              {loadingProjects ? (
                <div className="flex justify-center py-8 flex-1 items-center">
                  <Loader2 size={32} className="animate-spin" style={{ color: accentColor }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto flex-1 w-full">
                  {featuredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      {/* Imagen del proyecto */}
                      {project.images && project.images.length > 0 ? (
                        <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                          <img
                            src={project.images[0]}
                            alt={project.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {/* Badge de fase */}
                          <div className="absolute top-2 right-2 md:top-2 md:right-2">
                            <span className="px-2 py-1 md:px-2 backdrop-blur-md bg-white/90 text-[rgb(var(--accent))] text-xs md:text-xs font-bold rounded-full shadow-md">
                              {project.phase}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                          <FolderKanban size={24} className="md:w-8 md:h-8 text-gray-400" />
                          <div className="absolute top-2 right-2 md:top-2 md:right-2">
                            <span className="px-2 py-1 md:px-2 backdrop-blur-md bg-white/90 text-[rgb(var(--accent))] text-xs md:text-xs font-bold rounded-full shadow-md">
                              {project.phase}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Contenido */}
                      <div className="p-3 md:p-4 flex-1 flex flex-col min-h-0">
                        <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 md:mb-1 font-bold line-clamp-2 leading-tight">
                          {project.name}
                        </h4>
                        {project.slogan && (
                          <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] italic mb-2 md:mb-2 line-clamp-2 leading-tight">
                            {project.slogan}
                          </p>
                        )}
                        <div className="flex items-center gap-2 md:gap-2 mt-auto pt-1.5">
                          <img
                            src={project.author.avatar}
                            alt={project.author.name}
                            className="w-5 h-5 md:w-5 md:h-5 rounded-full flex-shrink-0"
                          />
                          <span className="text-xs md:text-xs text-[rgb(var(--text-secondary))] font-sans truncate">
                            {project.author.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {currentSlide === 'eventos' && (
            <div className="w-full h-full flex flex-col">
              <div className="text-center mb-4 md:mb-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-3">
                  <Calendar size={28} className="md:w-8 md:h-8" style={{ color: accentColor }} />
                </div>
                <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
                  Eventos
                </h3>
                <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed max-w-2xl mx-auto px-2">
                  Participa en eventos, workshops y encuentros de la comunidad. 
                  Conecta con otros miembros, aprende y crece junto a nosotros.
                </p>
              </div>
              
              {/* Grid de imágenes de eventos */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto flex-1 w-full">
                <div className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md flex flex-col">
                  <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src="/onboardevent1.png"
                      alt="Evento 1"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 font-bold line-clamp-2 leading-tight">
                      Eventos de la Comunidad
                    </h4>
                    <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] leading-tight">
                      Workshops y encuentros
                    </p>
                  </div>
                </div>
                
                <div className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md flex flex-col">
                  <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src="/onboardevent2.jpg"
                      alt="Evento 2"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 font-bold line-clamp-2 leading-tight">
                      Networking y Aprendizaje
                    </h4>
                    <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] leading-tight">
                      Conecta y crece
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentSlide === 'recursos' && (
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} style={{ color: accentColor }} />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-3">
                Recursos
              </h3>
              <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed">
                Accede a recursos compartidos por la comunidad. Plantillas, guías, 
                herramientas y más. Colabora y comparte conocimiento.
              </p>
            </div>
          )}
          
          {currentSlide === 'agora' && (
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} style={{ color: accentColor }} />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-3">
                Ágora
              </h3>
              <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed">
                El corazón social de Terreta Hub. Comparte ideas, haz preguntas, 
                conecta con la comunidad y participa en conversaciones que importan.
              </p>
            </div>
          )}
        </div>
        
          {/* Navegación - optimizada para mobile */}
          <div className="mt-4 md:mt-6 flex justify-between items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="px-5 py-3 md:px-6 md:py-3 backdrop-blur-sm bg-white/60 border-2 border-white/50 text-[rgb(var(--text-main))] font-bold rounded-lg hover:bg-white/80 hover:border-white/70 transition-all flex items-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm md:text-base min-h-[44px]"
            >
              <ArrowLeft size={18} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            {currentIndex === slides.length - 1 ? (
              <button
                onClick={handleActo2Complete}
                style={{ backgroundColor: accentColor }}
                className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base md:text-base min-h-[48px]"
              >
                Continuar
                <ArrowRight size={18} className="md:w-[18px] md:h-[18px]" />
              </button>
            ) : (
              <button
                onClick={nextSlide}
                style={{ backgroundColor: accentColor }}
                className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base md:text-base min-h-[48px]"
              >
                Siguiente
                <ArrowRight size={18} className="md:w-[18px] md:h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar Acto III
  const renderActo3 = () => (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Glassmorphism Card */}
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl text-[rgb(var(--text-main))] mb-3">
            Completa tu Perfil
          </h2>
          <p className="text-[rgb(var(--text-secondary))] font-sans">
            Personaliza tu página personal y compártela con el mundo
          </p>
        </div>
      
      <div className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Descripción de qué haces
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 resize-none shadow-md"
            placeholder="Cuéntanos sobre ti, tu trabajo, tus intereses..."
          />
        </div>
        
        {/* Redes sociales */}
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-3 uppercase tracking-wide">
            Redes Sociales
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Instagram size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.instagram || ''}
                onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                placeholder="Instagram (usuario o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Twitter size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.twitter || ''}
                onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                placeholder="Twitter/X (usuario o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Linkedin size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.linkedin || ''}
                onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                placeholder="LinkedIn (usuario o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Youtube size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.youtube || ''}
                onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                placeholder="YouTube (canal o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.tiktok || ''}
                onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                placeholder="TikTok (usuario o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.whatsapp || ''}
                onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
                placeholder="WhatsApp (número o enlace)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Music size={20} className="text-[rgb(var(--text-secondary))]" />
              <input
                type="text"
                value={socials.spotify || ''}
                onChange={(e) => setSocials({ ...socials, spotify: e.target.value })}
                placeholder="Spotify (perfil o URL)"
                className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Website */}
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Website Personal o de Empresa
          </label>
          <div className="relative group">
            <Globe size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://tu-website.com"
              className="w-full pl-10 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
            />
          </div>
        </div>
        
        {/* Selección de color */}
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-3 uppercase tracking-wide">
            Color Principal
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(COLOR_THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => setSelectedColor(key)}
                className={`p-4 rounded-xl border-2 transition-all backdrop-blur-sm bg-white/40 ${
                  selectedColor === key
                    ? 'border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent))] bg-white/60 shadow-lg'
                    : 'border-white/50 hover:border-white/70 hover:bg-white/50'
                }`}
              >
                <div
                  className="w-full h-12 rounded mb-2"
                  style={{ backgroundColor: theme.bgColor }}
                />
                <span className="font-bold text-sm text-[rgb(var(--text-main))]">{theme.name}</span>
                {selectedColor === key && (
                  <div className="mt-2 flex justify-center">
                    <CheckCircle size={16} style={{ color: accentColor }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Extensión personalizada */}
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Tu URL Personalizada
          </label>
          <div className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg p-3 shadow-md">
            <span className="text-sm text-[rgb(var(--text-secondary))] font-mono whitespace-nowrap">
              www.terretahub.com/p/
            </span>
            <div className="flex-1 flex items-center">
              <input
                type="text"
                value={extension}
                onChange={(e) => handleExtensionChange(e.target.value)}
                placeholder="tu-extension"
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                maxLength={50}
              />
              {checkingExtension && (
                <Loader2 size={16} className="animate-spin ml-2" style={{ color: accentColor }} />
              )}
            </div>
          </div>
          {extensionError && (
            <p className="mt-2 text-xs text-red-500">{extensionError}</p>
          )}
          <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
            Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.
          </p>
        </div>
        
          {/* Mensaje importante */}
          <div className="backdrop-blur-sm bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/30 rounded-lg p-4">
            <p className="text-sm text-[rgb(var(--text-main))]">
              <strong>Importante:</strong> Luego podrás agregar muchas más cosas y personalizar tu perfil 
              (fotos, videos, currículum y personalizar los colores y botones a tu antojo).
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleActo3Complete}
            disabled={!bio.trim() || !extension || extensionError !== '' || checkingExtension}
            style={{ backgroundColor: accentColor }}
            className="px-8 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Finalizar
            <CheckCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar pantalla de carga
  const renderCompleting = () => (
    <div className="w-full max-w-md mx-auto p-8 text-center">
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <Loader2 size={48} className="animate-spin mx-auto mb-6" style={{ color: accentColor }} />
        <h2 className="font-serif text-3xl text-[rgb(var(--text-main))] mb-3">
          Configurando tu perfil...
        </h2>
        <p className="text-[rgb(var(--text-secondary))] font-sans">
          Estamos preparando todo para ti
        </p>
      </div>
    </div>
  );

  // Renderizar pantalla de éxito
  const renderCompleted = () => (
    <div className="w-full max-w-md mx-auto p-8 text-center">
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="w-20 h-20 backdrop-blur-sm bg-green-100/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-green-200/50">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="font-serif text-3xl text-[rgb(var(--text-main))] mb-3">
          ¡Bienvenido a Terreta Hub!
        </h2>
        <p className="text-[rgb(var(--text-secondary))] font-sans mb-6">
          Tu perfil ha sido creado y publicado exitosamente
        </p>
        <div className="backdrop-blur-sm bg-white/50 rounded-lg p-4 mb-8 border border-white/40">
          <p className="text-sm text-[rgb(var(--text-secondary))] font-mono">
            www.terretahub.com/p/{completedExtension}
          </p>
        </div>
        <button
          onClick={() => navigate(`/p/${completedExtension}`)}
          style={{ backgroundColor: accentColor }}
          className="w-full px-8 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          Ver mi perfil
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Fondo orgánico con degradado tierra a cielo y textura */}
      <div 
        className="fixed inset-0"
        style={{
          background: `linear-gradient(180deg, 
            rgba(217, 119, 6, 0.15) 0%, 
            rgba(249, 246, 240, 0.95) 30%, 
            rgba(236, 248, 255, 0.85) 70%, 
            rgba(59, 130, 246, 0.1) 100%
          )`,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(217, 119, 6, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='paper' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='25' cy='25' r='1' fill='%23D97706' opacity='0.03'/%3E%3Ccircle cx='75' cy='75' r='1' fill='%233B82F6' opacity='0.03'/%3E%3Ccircle cx='50' cy='10' r='0.5' fill='%23D97706' opacity='0.02'/%3E%3Ccircle cx='10' cy='50' r='0.5' fill='%233B82F6' opacity='0.02'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23paper)'/%3E%3C/svg%3E")
          `,
          backgroundSize: '100% 100%, 100% 100%, 200px 200px',
          backgroundPosition: 'center, center, 0 0',
          backgroundRepeat: 'no-repeat, no-repeat, repeat'
        }}
      />
      
      {/* Overlay sutil para mejorar legibilidad */}
      <div className="fixed inset-0 bg-[rgb(var(--bg-main))]/40 backdrop-blur-[0.5px]" />
      
      <div className="relative min-h-screen flex items-center justify-center py-6 px-4">
        <div className="w-full animate-fade-in max-h-[90vh] overflow-hidden">
          {currentActo === 'acto1' && <div className="animate-scale-in">{renderActo1()}</div>}
          {currentActo === 'acto2' && <div className="animate-scale-in">{renderActo2()}</div>}
          {currentActo === 'acto3' && <div className="animate-scale-in">{renderActo3()}</div>}
          {currentActo === 'completing' && <div className="animate-fade-in">{renderCompleting()}</div>}
          {currentActo === 'completed' && <div className="animate-scale-in">{renderCompleted()}</div>}
        </div>
      </div>
    </div>
  );
};
