import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function useAdminAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.app_metadata.role !== 'admin') {
        navigate('/'); // Redirect if not signed in or not an admin
      }
    };

    checkAdmin();
  }, [navigate]);
}
