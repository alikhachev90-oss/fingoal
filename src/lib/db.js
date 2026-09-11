import { supabase, supabaseEnabled } from './supabaseClient'

// ---------------------------------------------------------------------------
// Data layer. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, every
// call goes to Supabase (see supabase/schema.sql for the matching tables).
// Otherwise everything falls back to localStorage so the app is fully
// functional out of the box for demoing the MVP.
// ---------------------------------------------------------------------------

const LS_KEY = 'fintrack_mock_db_v1'
const SESSION_KEY = 'fintrack_mock_session_v1'

function loadMock() {
  const empty = { users: [], settings: {}, debts: [], transactions: [], goals: [], checkins: [], completedLessons: [], accounts: [] }
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(LS_KEY)) || {}) }
  } catch {
    return empty
  }
}
function saveMock(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---------------------------------------------------------------------- auth
export async function signUp(email, password) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    })
    if (error) throw error
    return data
  }
  const db = loadMock()
  if (db.users.find((u) => u.email === email)) throw new Error('Пользователь с таким email уже существует')
  const user = { id: uid(), email }
  db.users.push({ ...user, password })
  saveMock(db)
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function resendSignupEmail(email) {
  if (!supabaseEnabled) return
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth` },
  })
  if (error) throw error
}

export async function sendPhoneCode(phone, shouldCreateUser = false) {
  if (!supabaseEnabled) throw new Error('Телефонная регистрация доступна после подключения Supabase')
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser },
  })
  if (error) throw error
}

export async function verifyPhoneCode(phone, token) {
  if (!supabaseEnabled) throw new Error('Подтверждение телефона доступно после подключения Supabase')
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) throw error
  return data.user
}

export async function signIn(email, password) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }
  const db = loadMock()
  const found = db.users.find((u) => u.email === email && u.password === password)
  if (!found) throw new Error('Неверный email или пароль')
  const user = { id: found.id, email: found.email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function signOut() {
  if (supabaseEnabled) {
    await supabase.auth.signOut()
    return
  }
  localStorage.removeItem(SESSION_KEY)
}

export async function getSession() {
  if (supabaseEnabled) {
    const { data } = await supabase.auth.getSession()
    return data.session?.user || null
  }
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null
  } catch {
    return null
  }
}

// Updates the signed-in user's personal data (currently: display name).
// Supabase: stored in auth user_metadata.full_name. Demo mode: mirrored into
// the same user_metadata shape so DashboardScreen's greeting reads it
// identically regardless of backend, plus persisted on the mock user record.
export async function updateProfile(userId, { name } = {}) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: name } })
    if (error) throw error
    return data.user
  }
  const db = loadMock()
  const idx = db.users.findIndex((u) => u.id === userId)
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], name }
    saveMock(db)
  }
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  const updated = { ...session, user_metadata: { ...(session?.user_metadata || {}), full_name: name } }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

// ------------------------------------------------------------------ settings
// settings: { monthlyIncome, needsBudget: {housing,transport,groceries,health}, hasDebts, onboarded }
export async function getSettings(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('context_settings').select('*').eq('user_id', userId).eq('context', context).maybeSingle()
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.settings[`${userId}:${context}`] || null
}

export async function saveSettings(userId, context, settings) {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('context_settings')
      .upsert({ user_id: userId, context, ...settings }, { onConflict: 'user_id,context' })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  const key = `${userId}:${context}`
  db.settings[key] = { ...(db.settings[key] || {}), ...settings }
  saveMock(db)
  return db.settings[key]
}

// --------------------------------------------------------------------- debts
export async function listDebts(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('debts').select('*').eq('user_id', userId).eq('context', context).order('created_at')
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.debts.filter((d) => d.user_id === userId && d.context === context)
}

export async function addDebt(userId, context, debt) {
  const row = { id: uid(), user_id: userId, context, created_at: new Date().toISOString(), ...debt }
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('debts').insert(row).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  db.debts.push(row)
  saveMock(db)
  return row
}

// ---------------------------------------------------------------- accounts
// An account is a named card/bank account the user tracks separately —
// {type: 'debit'|'credit', name, statement_day, due_day, credit_limit}.
// `statement_day`/`due_day` (1-28) drive the automatic payment reminder for
// credit accounts — see lib/creditCards.js. Balance isn't stored: it's
// derived from transactions tagged with this account's id minus recorded
// payments (payments are just transactions with is_payment: true).
export async function listAccounts(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId).eq('context', context).order('created_at')
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.accounts.filter((a) => a.user_id === userId && a.context === context)
}

export async function upsertAccount(userId, context, account) {
  if (supabaseEnabled) {
    const row = account.id ? account : { ...account, user_id: userId, context }
    const { data, error } = await supabase.from('accounts').upsert(row).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  if (account.id) {
    const idx = db.accounts.findIndex((a) => a.id === account.id)
    if (idx >= 0) db.accounts[idx] = { ...db.accounts[idx], ...account }
    saveMock(db)
    return db.accounts[idx]
  }
  const row = { id: uid(), user_id: userId, context, created_at: new Date().toISOString(), ...account }
  db.accounts.push(row)
  saveMock(db)
  return row
}

export async function deleteAccount(userId, accountId) {
  if (supabaseEnabled) {
    const { error } = await supabase.from('accounts').delete().eq('id', accountId)
    if (error) throw error
    return
  }
  const db = loadMock()
  db.accounts = db.accounts.filter((a) => a.id !== accountId)
  saveMock(db)
}

// ------------------------------------------------------------------- goals
export async function listGoals(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).eq('context', context).order('priority')
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.goals
    .filter((g) => g.user_id === userId && g.context === context)
    .sort((a, b) => a.priority - b.priority)
}

export async function upsertGoal(userId, context, goal) {
  if (supabaseEnabled) {
    const row = goal.id ? goal : { ...goal, user_id: userId, context }
    const { data, error } = await supabase.from('goals').upsert(row).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  if (goal.id) {
    const idx = db.goals.findIndex((g) => g.id === goal.id)
    if (idx >= 0) db.goals[idx] = { ...db.goals[idx], ...goal }
    saveMock(db)
    return db.goals[idx]
  }
  const row = { id: uid(), user_id: userId, context, saved_amount: 0, created_at: new Date().toISOString(), ...goal }
  db.goals.push(row)
  saveMock(db)
  return row
}

export async function deleteGoal(userId, goalId) {
  if (supabaseEnabled) {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) throw error
    return
  }
  const db = loadMock()
  db.goals = db.goals.filter((g) => g.id !== goalId)
  saveMock(db)
}

export async function addToGoalSavings(userId, goalId, amount) {
  if (supabaseEnabled) {
    const { data: goal } = await supabase.from('goals').select('saved_amount').eq('id', goalId).single()
    const { data, error } = await supabase
      .from('goals')
      .update({ saved_amount: (goal?.saved_amount || 0) + amount })
      .eq('id', goalId)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  const g = db.goals.find((g) => g.id === goalId)
  if (g) g.saved_amount = (g.saved_amount || 0) + amount
  saveMock(db)
  return g
}

// ------------------------------------------------------------- transactions
export async function listTransactions(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('context', context)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.transactions
    .filter((t) => t.user_id === userId && t.context === context)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function addTransaction(userId, context, tx) {
  const row = { id: uid(), user_id: userId, context, created_at: new Date().toISOString(), ...tx }
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('transactions').insert(row).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  db.transactions.push(row)
  saveMock(db)
  return row
}

// A transfer between two of the user's own accounts (e.g. cash -> debit card)
// is recorded as two linked rows so both account balances stay correct and
// neither leg is ever double-counted as real income/expense in reports.
export async function addTransfer(userId, context, { fromAccountId, toAccountId, amount, date, comment }) {
  const transferId = uid()
  const base = { amount, date, comment, group: 'transfer', category_key: 'transfer', sub: null }
  const out = await addTransaction(userId, context, { ...base, account_id: fromAccountId, transfer_id: transferId, transfer_direction: 'out' })
  const inn = await addTransaction(userId, context, { ...base, account_id: toAccountId, transfer_id: transferId, transfer_direction: 'in' })
  return [out, inn]
}

export async function deleteTransaction(userId, txId) {
  if (supabaseEnabled) {
    const { error } = await supabase.from('transactions').delete().eq('id', txId)
    if (error) throw error
    return
  }
  const db = loadMock()
  db.transactions = db.transactions.filter((t) => t.id !== txId)
  saveMock(db)
}

// -------------------------------------------------------------------- streak
export async function getCheckins(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('checkins').select('*').eq('user_id', userId).eq('context', context).order('date')
    if (error) throw error
    return data
  }
  const db = loadMock()
  return db.checkins.filter((c) => c.user_id === userId && c.context === context)
}

export async function checkInToday(userId, context) {
  const today = new Date().toISOString().slice(0, 10)
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('checkins').upsert({ user_id: userId, context, date: today, done: true }).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  if (!db.checkins.find((c) => c.user_id === userId && c.context === context && c.date === today)) {
    db.checkins.push({ id: uid(), user_id: userId, context, date: today, done: true })
    saveMock(db)
  }
  return db.checkins
}

// ------------------------------------------------------------------- lessons
// Lessons content is static (src/lib/lessons.js); we only persist which keys
// a user has marked as completed per context.
export async function listCompletedLessons(userId, context) {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('user_lessons')
      .select('lessons(key)')
      .eq('user_id', userId)
      .eq('context', context)
      .not('completed_at', 'is', null)
    if (error) throw error
    return (data || []).map((r) => r.lessons?.key).filter(Boolean)
  }
  const db = loadMock()
  return db.completedLessons.filter((c) => c.user_id === userId && c.context === context).map((c) => c.lesson_key)
}

export async function completeLesson(userId, context, lessonKey) {
  if (supabaseEnabled) {
    // Requires a matching row in `lessons` by key; upsert-by-key via RPC would be cleaner,
    // kept simple here since lessons content currently lives in the client.
    const { data: lesson } = await supabase.from('lessons').select('id').eq('key', lessonKey).maybeSingle()
    if (!lesson) return
    const { error } = await supabase
      .from('user_lessons')
      .upsert({ user_id: userId, lesson_id: lesson.id, context, completed_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  const db = loadMock()
  if (!db.completedLessons.find((c) => c.user_id === userId && c.context === context && c.lesson_key === lessonKey)) {
    db.completedLessons.push({ user_id: userId, context, lesson_key: lessonKey })
    saveMock(db)
  }
}

export function computeStreak(checkins) {
  const dates = new Set(checkins.map((c) => c.date))
  let streak = 0
  const d = new Date()
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
