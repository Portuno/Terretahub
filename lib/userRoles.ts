import { AuthUser } from '../types';

/**
 * Verifica si un usuario tiene rol de administrador
 */
export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Verifica si un usuario tiene permisos de administrador
 * (alias de isAdmin para claridad semántica)
 */
export const hasAdminPermissions = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Verifica si un usuario puede eliminar un recurso
 * (propio o si es admin)
 */
export const canDelete = (user: AuthUser | null, resourceAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === resourceAuthorId || isAdmin(user);
};

/**
 * Verifica si un usuario puede editar un recurso
 * (propio o si es admin)
 */
export const canEdit = (user: AuthUser | null, resourceAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === resourceAuthorId || isAdmin(user);
};

