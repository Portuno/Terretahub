/**
 * Utilidad para migrar avatares base64 existentes a Storage
 * Este script puede ejecutarse manualmente o como parte de una migración
 */

import { supabase } from './supabase';
import { migrateAvatarToStorage } from './avatarUtils';

/**
 * Migra un avatar base64 a Storage si es muy grande
 * @param userId ID del usuario
 * @param currentAvatar Avatar actual (puede ser base64 o URL)
 * @returns URL del avatar en Storage o el avatar original si es pequeño
 */
export const migrateUserAvatar = async (
  userId: string,
  currentAvatar: string | null
): Promise<string | null> => {
  if (!currentAvatar) return null;
  
  // Si ya es una URL (no base64) o es pequeño, no migrar
  if (!currentAvatar.startsWith('data:image') || currentAvatar.length <= 500) {
    return currentAvatar;
  }
  
  try {
    console.log(`[migrateAvatars] Migrando avatar de usuario ${userId} (tamaño: ${currentAvatar.length} chars)`);
    
    // Migrar a Storage
    const storageUrl = await migrateAvatarToStorage(userId, currentAvatar);
    
    // Actualizar en profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar: storageUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error(`[migrateAvatars] Error actualizando perfil ${userId}:`, updateError);
      return currentAvatar; // Retornar original si falla
    }
    
    // También actualizar en link_bio_profiles si existe
    const { data: linkBioProfile } = await supabase
      .from('link_bio_profiles')
      .select('id, avatar')
      .eq('user_id', userId)
      .single();
    
    if (linkBioProfile && linkBioProfile.avatar === currentAvatar) {
      const { error: linkBioError } = await supabase
        .from('link_bio_profiles')
        .update({ avatar: storageUrl })
        .eq('id', linkBioProfile.id);
      
      if (linkBioError) {
        console.error(`[migrateAvatars] Error actualizando link_bio_profile ${linkBioProfile.id}:`, linkBioError);
      }
    }
    
    console.log(`[migrateAvatars] Avatar migrado exitosamente para usuario ${userId}`);
    return storageUrl;
  } catch (error) {
    console.error(`[migrateAvatars] Error migrando avatar de usuario ${userId}:`, error);
    return currentAvatar; // Retornar original si falla
  }
};

/**
 * Migra todos los avatares base64 grandes de la base de datos
 * Esta función debe ejecutarse con cuidado y posiblemente en lotes
 */
export const migrateAllAvatars = async (batchSize: number = 10): Promise<void> => {
  try {
    console.log('[migrateAvatars] Iniciando migración de avatares...');
    
    // Obtener todos los perfiles con avatares base64 grandes
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, avatar')
      .not('avatar', 'is', null)
      .like('avatar', 'data:image%');
    
    if (fetchError) {
      console.error('[migrateAvatars] Error obteniendo perfiles:', fetchError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('[migrateAvatars] No hay avatares para migrar');
      return;
    }
    
    // Filtrar solo los que son grandes (>500 chars)
    const largeAvatars = profiles.filter(p => p.avatar && p.avatar.length > 500);
    
    console.log(`[migrateAvatars] Encontrados ${largeAvatars.length} avatares grandes para migrar`);
    
    // Procesar en lotes
    for (let i = 0; i < largeAvatars.length; i += batchSize) {
      const batch = largeAvatars.slice(i, i + batchSize);
      
      console.log(`[migrateAvatars] Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(largeAvatars.length / batchSize)}`);
      
      await Promise.all(
        batch.map(profile => migrateUserAvatar(profile.id, profile.avatar))
      );
      
      // Pequeña pausa entre lotes para no sobrecargar
      if (i + batchSize < largeAvatars.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('[migrateAvatars] Migración completada');
  } catch (error) {
    console.error('[migrateAvatars] Error en migración masiva:', error);
  }
};

