import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const validatedSupabaseUrl = validateSupabaseUrl(supabaseUrl);
const validatedSupabaseAnonKey = validateSupabaseAnonKey(supabaseAnonKey);
const isSupabaseUrlInvalid = Boolean(supabaseUrl && !validatedSupabaseUrl);
const supabaseHostname = validatedSupabaseUrl
  ? new URL(validatedSupabaseUrl).hostname
  : null;

export const isSupabaseConfigured = Boolean(
  validatedSupabaseUrl && validatedSupabaseAnonKey,
);

export const supabaseDiagnostics = {
  configured: isSupabaseConfigured,
  hostname: supabaseHostname,
  invalidUrl: isSupabaseUrlInvalid,
};

export const supabaseClient = isSupabaseConfigured
  ? createClient(validatedSupabaseUrl as string, validatedSupabaseAnonKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

function validateSupabaseUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function validateSupabaseAnonKey(value: string | undefined): string | null {
  return value || null;
}
