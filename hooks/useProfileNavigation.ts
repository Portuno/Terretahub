import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useProfileNavigation = () => {
  const navigate = useNavigate();

  const navigateToProfile = async (handle: string) => {
    const cleanHandle = handle.replace('@', '').trim();
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanHandle)
        .single();

      if (!error && profile) {
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('custom_slug')
          .eq('username', profile.username)
          .eq('is_published', true)
          .maybeSingle();
        const extension = linkBioProfile?.custom_slug || profile.username;
        navigate(`/p/${extension}`);
      } else {
        navigate(`/p/${cleanHandle}`);
      }
    } catch (err) {
      navigate(`/p/${cleanHandle}`);
    }
  };

  return navigateToProfile;
};

