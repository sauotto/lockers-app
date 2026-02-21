
import { createClient } from '@supabase/supabase-js';

// Replace these with your project credentials
// Ideally these should be in a .env file (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://adlgerqkzstqcdlovmye.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TveMhAnopTQ3mQXLBl-zQg_xuc5pA7m';

export const supabase = createClient(supabaseUrl, supabaseKey);
