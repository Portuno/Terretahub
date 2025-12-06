import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LinkBioProfile } from '../types';
import { ProfileRenderer } from './ProfileEditor';

export const PublicLinkBio: React.FC = () => {
  const { extension } = useParams<{ extension: string }>();
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastExtensionRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('[PublicLinkBio] useEffect triggered', { extension, lastExtension: lastExtensionRef.current, isLoading: isLoadingRef.current });
    
    const fetchProfile = async () => {
      console.log('[PublicLinkBio] fetchProfile started', { extension });
      
      if (!extension) {
        console.error('[PublicLinkBio] No extension provided');
        setError('Extensión no proporcionada');
        setLoading(false);
        return;
      }

      // Evitar múltiples cargas simultáneas
      if (isLoadingRef.current) {
        console.warn('[PublicLinkBio] Already loading, skipping');
        return;
      }

      // Resetear refs al cambiar de extensión
      if (lastExtensionRef.current !== extension) {
        console.log('[PublicLinkBio] Extension changed, resetting refs', { 
          old: lastExtensionRef.current, 
          new: extension 
        });
        lastExtensionRef.current = null;
        lastUpdatedAtRef.current = null;
      }

      // Si es la misma extensión que ya cargamos, no recargar
      if (lastExtensionRef.current === extension && lastExtensionRef.current !== null) {
        console.log('[PublicLinkBio] Same extension, skipping reload');
        return;
      }

      lastExtensionRef.current = extension;
      isLoadingRef.current = true;

      // Timeout de seguridad (10 segundos)
      const timeoutId = setTimeout(() => {
        if (isLoadingRef.current) {
          console.error('[PublicLinkBio] Timeout: Loading took too long');
          setError('Tiempo de espera agotado. Por favor, recarga la página.');
          setLoading(false);
          isLoadingRef.current = false;
        }
      }, 10000);

      try {
        console.log('[PublicLinkBio] Setting loading to true');
        setLoading(true);
        setError(null);

        const customSlugLower = extension.toLowerCase();
        console.log('[PublicLinkBio] Querying Supabase', { 
          custom_slug: customSlugLower,
          timestamp: Date.now()
        });

        // Verificar configuración de Supabase
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        console.log('[PublicLinkBio] Supabase config check', {
          urlPresent: !!supabaseUrl,
          keyPresent: !!supabaseKey,
          urlLength: supabaseUrl?.length || 0,
          keyLength: supabaseKey?.length || 0,
          urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
          keyPreview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'missing'
        });

        if (!supabaseUrl || !supabaseKey) {
          console.error('[PublicLinkBio] Supabase not configured');
          setError('Error de configuración: Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.');
          setLoading(false);
          isLoadingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        // Verificar que la URL sea válida
        try {
          new URL(supabaseUrl);
        } catch (urlError) {
          console.error('[PublicLinkBio] Invalid Supabase URL:', urlError);
          setError('Error de configuración: URL de Supabase inválida.');
          setLoading(false);
          isLoadingRef.current = false;
          clearTimeout(timeoutId);
          return;
        }

        // Saltar el test de conectividad básico - ir directo a la query principal
        // El test básico puede estar fallando por problemas de RLS o red
        console.log('[PublicLinkBio] Skipping basic connectivity test, going directly to profile query');

        // Buscar perfil por custom_slug (extensión) con timeout
        console.log('[PublicLinkBio] Starting profile query...');
        const queryStartTime = Date.now();
        
        // Intentar primero con una query simple sin maybeSingle para evitar problemas
        let linkBioProfile = null;
        let linkBioError = null;
        
        try {
          console.log('[PublicLinkBio] Attempting query with .single()...');
          const queryPromise = supabase
            .from('link_bio_profiles')
            .select('username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
            .eq('custom_slug', customSlugLower)
            .single(); // Usar .single() para mejor manejo de errores

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout: La consulta tardó más de 8 segundos')), 8000)
          );

          console.log('[PublicLinkBio] Waiting for query response...');
          const result = await Promise.race([queryPromise, timeoutPromise]) as any;
          
          console.log('[PublicLinkBio] Query response received', {
            hasData: !!result?.data,
            hasError: !!result?.error,
            errorCode: result?.error?.code,
            errorMessage: result?.error?.message
          });
          
          if (result?.error) {
            linkBioError = result.error;
            console.log('[PublicLinkBio] Query error details', {
              code: result.error.code,
              message: result.error.message,
              details: result.error.details,
              hint: result.error.hint
            });
          } else if (result?.data) {
            const profile = result.data;
            // Verificar is_published en el cliente
            if (profile.is_published) {
              linkBioProfile = profile;
              console.log('[PublicLinkBio] Profile found and published');
            } else {
              linkBioError = { code: 'NOT_PUBLISHED', message: 'Perfil no publicado' };
              console.log('[PublicLinkBio] Profile found but not published');
            }
          } else {
            // No encontrado
            linkBioProfile = null;
            console.log('[PublicLinkBio] Profile not found');
          }
        } catch (timeoutError: any) {
          console.error('[PublicLinkBio] Query timeout:', timeoutError);
          
          // Intentar una query alternativa más simple sin el filtro is_published
          console.log('[PublicLinkBio] Trying fallback query without is_published filter...');
          try {
            const fallbackQuery = supabase
              .from('link_bio_profiles')
              .select('username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
              .eq('custom_slug', customSlugLower)
              .limit(1);
            
            const fallbackResult = await Promise.race([
              fallbackQuery,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback timeout')), 5000))
            ]) as any;
            
            if (fallbackResult?.data && fallbackResult.data.length > 0) {
              const profile = fallbackResult.data[0];
              if (profile.is_published) {
                linkBioProfile = profile;
                linkBioError = null;
                console.log('[PublicLinkBio] Fallback query succeeded');
              } else {
                linkBioError = { code: 'NOT_PUBLISHED', message: 'Perfil no publicado' };
              }
            } else {
              linkBioError = { code: 'PGRST116', message: 'Perfil no encontrado' };
            }
          } catch (fallbackError: any) {
            console.error('[PublicLinkBio] Fallback query also failed:', fallbackError);
            setError('No se pudo conectar con la base de datos. Verifica tu conexión a internet o intenta más tarde.');
            setLoading(false);
            isLoadingRef.current = false;
            clearTimeout(timeoutId);
            return;
          }
        }

        const queryDuration = Date.now() - queryStartTime;
        console.log('[PublicLinkBio] Query completed', { 
          duration: `${queryDuration}ms`,
          hasData: !!linkBioProfile,
          hasError: !!linkBioError
        });

        clearTimeout(timeoutId);

        console.log('[PublicLinkBio] Supabase response', { 
          hasData: !!linkBioProfile, 
          error: linkBioError,
          errorCode: linkBioError?.code,
          errorMessage: linkBioError?.message,
          errorDetails: linkBioError?.details,
          errorHint: linkBioError?.hint
        });

        if (linkBioError && linkBioError.code !== 'PGRST116') {
          // Error diferente a "no encontrado"
          console.error('[PublicLinkBio] Error al buscar perfil:', linkBioError);
          setError('Error al cargar el perfil: ' + (linkBioError.message || 'Error desconocido'));
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        if (!linkBioProfile) {
          console.warn('[PublicLinkBio] Profile not found or not published');
          setError('Perfil no encontrado o no está publicado');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        console.log('[PublicLinkBio] Profile found', { 
          username: linkBioProfile.username,
          displayName: linkBioProfile.display_name,
          updatedAt: linkBioProfile.updated_at
        });

        // Guardar el updated_at para futuras comparaciones
        if (linkBioProfile.updated_at) {
          lastUpdatedAtRef.current = linkBioProfile.updated_at;
        }

        // Si encontramos el perfil de link-in-bio, convertir al formato esperado
        const formattedProfile: LinkBioProfile = {
          username: linkBioProfile.username,
          displayName: linkBioProfile.display_name,
          bio: linkBioProfile.bio || '',
          avatar: linkBioProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${linkBioProfile.username}`,
          socials: (linkBioProfile.socials as any) || {},
          blocks: (linkBioProfile.blocks as any) || [],
          theme: (linkBioProfile.theme as any) || {
            id: 'terreta',
            name: 'Terreta Original',
            bgType: 'color',
            bgColor: '#F9F6F0',
            textColor: '#3E2723',
            buttonStyle: 'solid',
            buttonColor: '#3E2723',
            buttonTextColor: '#FFFFFF',
            font: 'serif'
          }
        };

        console.log('[PublicLinkBio] Setting profile', { 
          blocksCount: formattedProfile.blocks.length,
          hasTheme: !!formattedProfile.theme
        });
        setProfile(formattedProfile);
        console.log('[PublicLinkBio] Profile set successfully');
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[PublicLinkBio] Exception caught:', err);
        setError(err.message || 'Error al cargar el perfil');
        setLoading(false);
        isLoadingRef.current = false;
      } finally {
        console.log('[PublicLinkBio] Finally block - setting loading to false');
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchProfile();

    // Cleanup: resetear refs al desmontar o cambiar extensión
    return () => {
      console.log('[PublicLinkBio] Cleanup: resetting refs');
      isLoadingRef.current = false;
    };
  }, [extension]); // Solo ejecutar cuando cambie la extensión

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando perfil...</p>
        <p className="text-xs text-gray-400 mt-2">Extensión: {extension}</p>
        <button
          onClick={() => {
            console.log('[PublicLinkBio] Manual reset triggered by user');
            isLoadingRef.current = false;
            lastExtensionRef.current = null;
            setLoading(false);
            setError('Recarga cancelada. Por favor, recarga la página.');
          }}
          className="mt-4 text-sm text-[#D97706] hover:underline"
        >
          Cancelar carga
        </button>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-10 text-center">
        <h2 className="text-2xl font-serif text-terreta-dark mb-2">Perfil no encontrado</h2>
        <p className="text-gray-500 mb-4">{error || 'El perfil que buscas no existe o ha sido eliminado.'}</p>
        <a 
          href="/" 
          className="text-[#D97706] hover:underline font-bold"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden bg-white">
        <ProfileRenderer profile={profile} />
      </div>
    </div>
  );
};

