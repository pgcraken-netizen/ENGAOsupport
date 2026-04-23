import { createClient } from "@supabase/supabase-js";

// Placeholder values prevent module-level failures during static pre-rendering.
// Actual calls happen only in the browser where NEXT_PUBLIC_* vars are embedded.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
);
