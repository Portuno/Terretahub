/**
 * Utilidades para manejo de avatares con Storage
 * Optimiza imágenes antes de subirlas y maneja la migración de base64 a Storage
 */

import { supabase } from './supabase';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 400; // Máximo 400x400px
const QUALITY = 0.85; // Calidad JPEG/WebP

/**
 * Optimiza una imagen antes de subirla
 * Redimensiona y comprime la imagen para reducir el tamaño
 */
export const optimizeImage = (file: File): Promise<Blob> => {
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
        
        // Convertir a Blob optimizado (WebP si es posible, sino JPEG)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Si el blob es muy grande, reducir calidad
              if (blob.size > MAX_AVATAR_SIZE) {
                canvas.toBlob(
                  (smallerBlob) => {
                    if (smallerBlob) {
                      resolve(smallerBlob);
                    } else {
                      reject(new Error('Error al optimizar imagen'));
                    }
                  },
                  'image/jpeg',
                  QUALITY * 0.7 // Reducir calidad más
                );
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error('Error al convertir imagen'));
            }
          },
          'image/webp',
          QUALITY
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar imagen'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer archivo'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Sube un avatar a Storage y retorna la URL pública
 */
export const uploadAvatarToStorage = async (
  userId: string,
  file: File | Blob,
  filename: string = 'avatar.jpg'
): Promise<string> => {
  try {
    // Optimizar imagen si es un File
    const optimizedFile = file instanceof File 
      ? await optimizeImage(file)
      : file;
    
    // Determinar extensión basada en el tipo MIME
    let ext = 'jpg';
    if (optimizedFile.type === 'image/webp') ext = 'webp';
    else if (optimizedFile.type === 'image/png') ext = 'png';
    
    const finalFilename = filename.includes('.') ? filename : `${filename.split('.')[0]}.${ext}`;
    const filePath = `${userId}/${finalFilename}`;
    
    // Eliminar avatar anterior si existe
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId);
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete);
    }
    
    // Subir nuevo avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
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
      .from('avatars')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error: any) {
    console.error('[avatarUtils] Error al subir avatar:', error);
    throw error;
  }
};

/**
 * Convierte un avatar base64 a Storage si es muy grande
 * Retorna la URL de Storage o el base64 original si es pequeño
 */
export const migrateAvatarToStorage = async (
  userId: string,
  base64Avatar: string
): Promise<string> => {
  // Si el avatar es pequeño o no es base64, retornarlo tal cual
  if (!base64Avatar || !base64Avatar.startsWith('data:image') || base64Avatar.length <= 500) {
    return base64Avatar;
  }
  
  try {
    // Convertir base64 a Blob
    const response = await fetch(base64Avatar);
    const blob = await response.blob();
    
    // Subir a Storage
    const storageUrl = await uploadAvatarToStorage(userId, blob);
    
    return storageUrl;
  } catch (error) {
    console.error('[avatarUtils] Error al migrar avatar a Storage:', error);
    // Si falla, retornar el base64 original
    return base64Avatar;
  }
};

/**
 * Obtiene la URL del avatar desde Storage o retorna un default
 */
export const getAvatarUrl = (userId: string, avatar?: string | null): string => {
  // Si hay avatar y es una URL (no base64), usarlo
  if (avatar && !avatar.startsWith('data:image') && avatar.length < 500) {
    return avatar;
  }
  
  // Si hay avatar base64 pequeño, usarlo
  if (avatar && avatar.startsWith('data:image') && avatar.length <= 500) {
    return avatar;
  }
  
  // Intentar obtener de Storage
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.jpg`);
  
  // Por ahora retornar default, en producción verificar si existe
  return avatar && !avatar.startsWith('data:image') 
    ? avatar 
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
};

