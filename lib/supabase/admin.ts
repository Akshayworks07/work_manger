import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Uses the SECRET key (Supabase's current replacement for the legacy
 * service_role key). This bypasses Row Level Security entirely.
 * Only ever import this in server actions / route handlers, never in
 * client components, and never send its result to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
