import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const validatedSupabaseUrl = validateSupabaseUrl(supabaseUrl);
const validatedSupabaseAnonKey = validateSupabaseAnonKey(supabaseAnonKey);

export const isSupabaseConfigured = Boolean(
  validatedSupabaseUrl && validatedSupabaseAnonKey,
);

export const supabaseClient = isSupabaseConfigured
  ? createClient(validatedSupabaseUrl as string, validatedSupabaseAnonKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

function validateSupabaseUrl(value: string | undefined): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function validateSupabaseAnonKey(value: string | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}
