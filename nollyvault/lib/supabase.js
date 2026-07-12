import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Note: no top-level singleton client here on purpose. A previous version
// had `export const supabase = createClient(...)` at module scope — nothing
// actually imported it by name, but merely importing this file (which every
// page does, for the functions below) ran that line anyway as a side effect,
// silently creating a second, redundant auth client in the browser alongside
// the real one from createBrowserSupabaseClient(). That's what caused the
// "Multiple GoTrueClient instances detected" console warning.

// ── Browser client via SSR package (preferred in pages) ──────────────────────
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ── Server-side client for API routes ────────────────────────────────────────
export function createServerSupabaseClient(req, res) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure`)
        })
      },
    },
  })
}

// ── Admin client (server only, never expose to browser) ──────────────────────
export function supabaseAdmin() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
