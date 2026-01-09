/**
 * Utilidades para manejo de imágenes de eventos con Storage
 * Optimiza imágenes antes de subirlas
 */

import { supabase } from './supabase';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920; // Máximo 1920px (Full HD)
const QUALITY = 0.85; // Calidad JPEG/WebP

/**
 * Optimiza una imagen antes de subirla
 * Redimensiona y comprime la imagen para reducir el tamaño
 */
export const optimizeEventImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a Blob con calidad optimizada
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al convertir imagen a Blob'));
            }
          },
          file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg',
          QUALITY
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Sube una imagen de evento a Storage y retorna la URL pública
 */
export const uploadEventImageToStorage = async (
  organizerId: string,
  eventId: string | null,
  file: File | Blob,
  imageIndex: number = 0
): Promise<string> => {
  try {
    // Optimizar imagen si es un File
    const optimizedFile = file instanceof File 
      ? await optimizeEventImage(file)
      : file;
    
    // Determinar extensión basada en el tipo MIME
    let ext = 'jpg';
    if (optimizedFile.type === 'image/webp') ext = 'webp';
    else if (optimizedFile.type === 'image/png') ext = 'png';
    
    const timestamp = Date.now();
    const filePath = `${organizerId}/${eventId || 'temp'}/event_image_${timestamp}_${imageIndex}.${ext}`;
    
    // Subir imagen
    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: optimizedFile.type || 'image/jpeg'
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error: any) {
    console.error('[eventImageUtils] Error al subir imagen de evento:', error);
    throw error;
  }
};
