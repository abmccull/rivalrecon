/**
 * Type declarations for Supabase related modules
 */

declare module '@/lib/supabase/server' {
  import { SupabaseClient } from '@supabase/supabase-js';
  
  export const createClient: () => Promise<SupabaseClient>;
}
