import { useEffect } from 'react';

interface MetaTagsData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

/**
 * Hook para actualizar meta tags dinámicamente (Open Graph, Twitter, etc.)
 * Útil para compartir enlaces con preview personalizado
 */
export const useDynamicMetaTags = (data: MetaTagsData) => {
  useEffect(() => {
    if (!data.title && !data.description && !data.image) {
      return;
    }

    const updateMetaTag = (property: string, content: string) => {
      // Buscar meta tag existente
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      
      // Si no existe, crear uno nuevo
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    const updateMetaTagName = (name: string, content: string) => {
      // Buscar meta tag existente
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      // Si no existe, crear uno nuevo
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Actualizar título de la página
    if (data.title) {
      document.title = data.title;
    }

    // Open Graph meta tags
    // Establecer tipo como profile si hay imagen (indica que es un perfil de usuario)
    if (data.image) {
      updateMetaTag('og:type', 'profile');
    }
    
    if (data.title) {
      updateMetaTag('og:title', data.title);
    }
    
    if (data.description) {
      updateMetaTag('og:description', data.description);
    }
    
    if (data.image) {
      updateMetaTag('og:image', data.image);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/jpeg');
      // Asegurar que la imagen sea segura para HTTPS
      updateMetaTag('og:image:secure_url', data.image);
    }
    
    if (data.url) {
      updateMetaTag('og:url', data.url);
    }

    // Twitter Card meta tags
    updateMetaTagName('twitter:card', 'summary_large_image');
    
    if (data.title) {
      updateMetaTagName('twitter:title', data.title);
    }
    
    if (data.description) {
      updateMetaTagName('twitter:description', data.description);
    }
    
    if (data.image) {
      updateMetaTagName('twitter:image', data.image);
    }

    // Cleanup: restaurar meta tags originales cuando el componente se desmonte
    return () => {
      // Solo limpiar si no hay otros componentes usando estos meta tags
      // Por ahora, dejamos los meta tags actualizados ya que pueden ser útiles
      // para el bot de compartir de redes sociales
    };
  }, [data.title, data.description, data.image, data.url]);
};

