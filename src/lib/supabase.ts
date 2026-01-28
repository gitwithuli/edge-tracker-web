import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client that uses cookies for session storage
// This allows middleware to read the session server-side
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
