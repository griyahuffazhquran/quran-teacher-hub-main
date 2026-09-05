import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] || "https://dijprlwjfwbnouezudzw.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env["VITE_SUPABASE_ANON_KEY"] || "sb_publishable_O7STh4gq_ooSfQYWbefY5A_JXQhOAsR";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
