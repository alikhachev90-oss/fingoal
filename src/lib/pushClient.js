import { createClient } from '@supabase/supabase-js'

// Deliberately a SEPARATE Supabase project/client from src/lib/supabaseClient.js.
// That one, if configured, switches the ENTIRE app (transactions, goals,
// everything in db.js) from the localStorage mock to a real backend — a much
// bigger migration than "add push notifications," and one that would orphan
// everyone's existing local data if flipped on casually. This client's only
// job is storing push subscription endpoints so a server function knows who
// to notify; nothing else in the app depends on it or is affected by it.
// Falling back to the main project's credentials when no separate push
// project is configured: the app now runs on a real Supabase backend anyway,
// so demanding two extra env vars only meant push silently stayed off.
const url = import.meta.env.VITE_PUSH_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_PUSH_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const pushBackendEnabled = Boolean(url && key)

export const pushSupabase = pushBackendEnabled ? createClient(url, key) : null
