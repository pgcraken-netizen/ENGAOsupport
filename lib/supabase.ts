import { createClient } from "@supabase/supabase-js";

// Placeholder values prevent module-level failures during static pre-rendering.
// Actual calls happen only in the browser where NEXT_PUBLIC_* vars are embedded.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "https://uoazvxiwtstsqxsameya.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYXp2eGl3dHN0c3F4c2FtZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTQ5MzEsImV4cCI6MjA5MjUzMDkzMX0.X2b0gcQoeit3wDv3YkNE3lGfFXhzrgWzqqEMRmZSQro",
);
