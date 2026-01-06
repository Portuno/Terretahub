import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Obtener URL pública del avatar
const getPublicAvatarUrl = (avatar: string | null | undefined, userId: string | null, supabaseUrl: string): string => {
  if (!avatar) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
  }

  // Si es base64, no es útil para Open Graph
  if (avatar.startsWith('data:image')) {
    // Intentar obtener de Storage si tenemos userId
    if (userId && supabaseUrl) {
      // Extraer el project ref de la URL de Supabase
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      return `https://${projectRef}.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
  }

  // Si es una URL válida, usarla directamente
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  // Si es una ruta relativa, construir URL de Storage
  if (userId && supabaseUrl) {
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
    return `https://${projectRef}.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
};

// Generar HTML con meta tags
const generateHTML = (
  title: string,
  description: string,
  image: string,
  url: string
): string => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}" />
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="Terreta Hub" />
  <meta property="og:locale" content="es_ES" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(url)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  
  <!-- Redirect to actual page for non-bots (solo si no es bot) -->
  <script>
    // Solo redirect si no es un bot (los bots no ejecutan JS)
    const isBot = /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    if (!isBot) {
      window.location.href = "${escapeHtml(url)}";
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>`;
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Detectar si es un bot de redes sociales
const isBot = (userAgent: string | undefined): boolean => {
  if (!userAgent) return false;
  const botPatterns = [
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'DiscordBot',
    'SkypeUriPreview',
    'Googlebot',
    'bingbot',
    'Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'facebot',
    'ia_archiver'
  ];
  return botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { extension } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  
  console.log('[API] Request received:', {
    extension,
    userAgent: userAgent.substring(0, 100),
    isBot: isBot(userAgent),
    host: req.headers.host,
    url: req.url
  });
  
  // Si no es un bot, redirigir al index.html (evitar que la función sirva contenido para usuarios normales)
  // Esto permite que React Router maneje la navegación
  if (!isBot(userAgent)) {
    // En lugar de servir el HTML, hacer un rewrite interno al index.html
    // Pero como estamos en una función API, mejor redirigir
    res.status(200);
    res.setHeader('Content-Type', 'text/html');
    
    // Servir un HTML mínimo que redirija al cliente
    const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script>window.location.replace('/p/${extension}');</script>
  <noscript><meta http-equiv="refresh" content="0;url=/p/${extension}"></noscript>
</head>
<body>Redirecting...</body>
</html>`;
    return res.send(redirectHtml);
  }
  
  // Es un bot - generar meta tags dinámicos
  console.log('[API] Bot detected, generating dynamic meta tags');
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const customSlugLower = (extension as string)?.toLowerCase() || '';

    // Buscar perfil por custom_slug o username
    let profileData = null;

    // Intentar por custom_slug primero
    const { data: bySlug } = await supabase
      .from('link_bio_profiles')
      .select('user_id, username, display_name, bio, avatar, is_published')
      .eq('custom_slug', customSlugLower)
      .eq('is_published', true)
      .maybeSingle();

    if (bySlug) {
      profileData = bySlug;
    } else {
      // Intentar por username
      const { data: byUsername } = await supabase
        .from('link_bio_profiles')
        .select('user_id, username, display_name, bio, avatar, is_published')
        .eq('username', customSlugLower)
        .eq('is_published', true)
        .maybeSingle();

      if (byUsername) {
        profileData = byUsername;
      }
    }

    if (!profileData) {
      // Perfil no encontrado, usar defaults
      const defaultTitle = 'Terreta Hub | Red Social Valenciana';
      const defaultDescription = 'Bienvenido al Epicentre de Terreta Hub. Reserva tu link personalizado, proyecta tus ideas en nuestro laboratorio digital y forma parte de la vanguardia valenciana.';
      const defaultImage = 'https://terretahub.com/og-image.jpg';
      
      // Obtener la URL completa del request
      const host = req.headers.host || 'terretahub.com';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const currentUrl = `${protocol}://${host}/p/${extension}`;
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(generateHTML(defaultTitle, defaultDescription, defaultImage, currentUrl));
    }

    // Construir datos del perfil
    const profileTitle = `${profileData.display_name || profileData.username} | Terreta Hub`;
    const profileDescription = profileData.bio 
      ? profileData.bio.substring(0, 160)
      : `Perfil de ${profileData.display_name || profileData.username} en Terreta Hub`;
    const avatarUrl = getPublicAvatarUrl(profileData.avatar, profileData.user_id, supabaseUrl);
    
    // Obtener la URL completa del request (respetar www o no-www según el dominio original)
    const host = req.headers.host || 'terretahub.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/p/${extension}`;

    // Generar HTML con meta tags
    const html = generateHTML(profileTitle, profileDescription, avatarUrl, currentUrl);
    
    // Headers importantes para evitar redirects y asegurar que los bots vean el contenido
    res.status(200); // Asegurar código 200 OK (no 206 Partial Content)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    console.log('[API] Generated HTML for bot:', {
      extension,
      title: profileTitle,
      description: profileDescription.substring(0, 50),
      image: avatarUrl,
      url: currentUrl
    });
    
    return res.send(html);

  } catch (error: any) {
    console.error('[API] Error generating meta tags:', error);
    
    // En caso de error, usar defaults
    const defaultTitle = 'Terreta Hub | Red Social Valenciana';
    const defaultDescription = 'Bienvenido al Epicentre de Terreta Hub. Reserva tu link personalizado, proyecta tus ideas en nuestro laboratorio digital y forma parte de la vanguardia valenciana.';
    const defaultImage = 'https://terretahub.com/og-image.jpg';
    
    // Obtener la URL completa del request
    const host = req.headers.host || 'terretahub.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/p/${extension}`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(generateHTML(defaultTitle, defaultDescription, defaultImage, currentUrl));
  }
}

