import { supabase } from './supabase';

/**
 * Ejecuta una query de Supabase con retry logic y timeout
 * @param queryFn Función que retorna la promesa de la query
 * @param queryName Nombre de la query para logging
 * @param retryCount Contador de reintentos (interno)
 * @returns Resultado de la query
 */
export const executeQueryWithRetry = async <T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  queryName: string,
  retryCount = 0
): Promise<{ data: T | null; error: any }> => {
  const MAX_RETRIES = 2;
  const TIMEOUT = 10000; // 10 segundos por intento
  
  try {
    const queryStart = Date.now();
    console.log(`[SupabaseHelper] ${queryName} attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
    
    const queryPromise = queryFn();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout: ${queryName} after ${TIMEOUT}ms`));
      }, TIMEOUT);
    });
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as { data: T | null; error: any };
    const queryDuration = Date.now() - queryStart;
    
    console.log(`[SupabaseHelper] ${queryName} completed`, {
      duration: `${queryDuration}ms`,
      hasData: !!result.data,
      hasError: !!result.error,
      retryCount
    });
    
    // Si hay error y es retryable, intentar de nuevo
    if (result.error && retryCount < MAX_RETRIES) {
      const isRetryable = !['PGRST116', '23505', '42501'].includes(result.error.code || '');
      const isNetworkError = 
        result.error.message?.includes('timeout') ||
        result.error.message?.includes('network') ||
        result.error.message?.includes('ERR_QUIC') ||
        result.error.message?.includes('Failed to fetch') ||
        result.error.code === 'PGRST301';
      
      if (isRetryable || isNetworkError) {
        console.log(`[SupabaseHelper] Retrying ${queryName}... (${result.error.message || result.error.code})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return executeQueryWithRetry(queryFn, queryName, retryCount + 1);
      }
    }
    
    return result;
  } catch (err: any) {
    if (err.message?.includes('timeout') && retryCount < MAX_RETRIES) {
      console.log(`[SupabaseHelper] Timeout on ${queryName}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return executeQueryWithRetry(queryFn, queryName, retryCount + 1);
    }
    throw err;
  }
};

