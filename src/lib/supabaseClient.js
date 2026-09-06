import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// When real Supabase credentials aren't configured yet, the app runs on a
// local-storage mock (see src/lib/db.js) so the MVP works out of the box.
export const supabaseEnabled = Boolean(url && key)

export const supabase = supabaseEnabled ? createClient(url, key) : null
