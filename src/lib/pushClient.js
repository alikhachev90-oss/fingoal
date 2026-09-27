import { createClient } from '@supabase/supabase-js'

// Stores push subscription endpoints so a server function knows which devices
// to notify. Uses its own project when VITE_PUSH_SUPABASE_* is set, otherwise
// the app's main Supabase project.
const url = import.meta.env.VITE_PUSH_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_PUSH_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const pushBackendEnabled = Boolean(url && key)

export const pushSupabase = pushBackendEnabled ? createClient(url, key) : null
