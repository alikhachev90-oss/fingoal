import { supabase, supabaseEnabled } from './supabaseClient'
import { toDate, todayStr } from './dates'

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

// ------------------------------------------------------------- change signal
// The five main tabs stay mounted between swipes, so a screen that loaded its
// data once would keep showing it after you logged something elsewhere. Every
// write announces itself; screens listen via useDataVersion() and reload.
let changeTimer = 0
function notifyChange() {
  clearTimeout(changeTimer)
  changeTimer = setTimeout(() => window.dispatchEvent(new Event('fintera-data-changed')), 50)
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

// Small per-person preferences that should follow them to every device (e.g.
// their own categories) ride in the auth user's metadata — no table needed.
export async function saveUserMeta(userId, patch) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.auth.updateUser({ data: patch })
    if (error) throw error
    return data.user
  }
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  const updated = { ...session, user_metadata: { ...(session?.user_metadata || {}), ...patch } }
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

async function saveSettingsImpl(userId, context, settings) {
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

async function addDebtImpl(userId, context, debt) {
  if (supabaseEnabled) {
    // Let Postgres generate the UUID and timestamp. The local mock uses its own id.
    const { data, error } = await supabase
      .from('debts')
      .insert({ user_id: userId, context, ...debt })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const row = { id: uid(), user_id: userId, context, created_at: new Date().toISOString(), ...debt }
  const db = loadMock()
  db.debts.push(row)
  saveMock(db)
  return row
}

async function updateDebtImpl(userId, debtId, patch) {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from('debts').update(patch).eq('id', debtId).select().single()
    if (error) throw error
    return data
  }
  const db = loadMock()
  const d = db.debts.find((x) => x.id === debtId)
  if (d) Object.assign(d, patch)
  saveMock(db)
  return d
}

async function deleteDebtImpl(userId, debtId) {
  if (supabaseEnabled) {
    const { error } = await supabase.from('debts').delete().eq('id', debtId)
    if (error) throw error
    return
  }
  const db = loadMock()
  db.debts = db.debts.filter((x) => x.id !== debtId)
  saveMock(db)
}

// An extra payment on a debt lowers what's left on it (never below zero).
async function payDownDebtImpl(userId, debtId, amount) {
  if (supabaseEnabled) {
    const { data: debt } = await supabase.from('debts').select('balance').eq('id', debtId).single()
    const balance = Math.max(0, Math.round(((debt?.balance || 0) - amount) * 100) / 100)
    const { error } = await supabase.from('debts').update({ balance }).eq('id', debtId)
    if (error) throw error
    return balance
  }
  const db = loadMock()
  const d = db.debts.find((x) => x.id === debtId)
  if (d) d.balance = Math.max(0, Math.round(((d.balance || 0) - amount) * 100) / 100)
  saveMock(db)
  return d?.balance
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

async function upsertAccountImpl(userId, context, account) {
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

async function deleteAccountImpl(userId, accountId) {
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

// True when Postgres/PostgREST rejected the write because the table has no
// such column — the goal form sends `why`, which older databases lack.
function isUnknownColumn(error, column) {
  if (!error) return false
  const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`
  return (error.code === 'PGRST204' || error.code === '42703') && text.includes(column)
}

async function upsertGoalImpl(userId, context, goal) {
  if (supabaseEnabled) {
    const row = goal.id ? goal : { ...goal, user_id: userId, context }
    let { data, error } = await supabase.from('goals').upsert(row).select().single()
    if (isUnknownColumn(error, 'why')) {
      // Save the goal anyway, just without the optional "why" note, instead of
      // silently losing the whole thing.
      const { why, ...withoutWhy } = row
      void why
      ;({ data, error } = await supabase.from('goals').upsert(withoutWhy).select().single())
    }
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

async function deleteGoalImpl(userId, goalId) {
  if (supabaseEnabled) {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) throw error
    return
  }
  const db = loadMock()
  db.goals = db.goals.filter((g) => g.id !== goalId)
  saveMock(db)
}

// "Delete all my data" used to clear only this browser, so everything came
// back on the next sign-in. Wipe the rows in the database too.
export async function deleteAllUserData(userId) {
  localStorage.removeItem(LS_KEY)
  localStorage.removeItem(LOCAL_LESSONS_KEY)
  if (!supabaseEnabled) return
  // Account-level copies too: without this, pushes for deleted goals and cards
  // kept coming and goal photos stayed online.
  const { deleteStoredGoalImages } = await import('./goalVision')
  await deleteStoredGoalImages({ all: true })
  await saveUserMeta(userId, { push_reminders: [], goal_images: {}, custom_categories: null, save_rate: null, save_rate_at: null, push_goal_last: null, push_fired: null }).catch(() => {})
  const tables = ['transactions', 'goals', 'debts', 'accounts', 'checkins', 'context_settings', 'user_lessons', 'insights']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    // A table the project doesn't have (or can't touch) must not abort the rest.
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') throw error
  }
}

async function addToGoalSavingsImpl(userId, goalId, amount) {
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
    .sort((a, b) => toDate(b.date) - toDate(a.date))
}

async function addTransactionImpl(userId, context, tx) {
  if (supabaseEnabled) {
    // Let Postgres generate the UUID and timestamp. uid() is not a valid uuid,
    // so sending it made every insert fail (same fix as addDebt above).
    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id: userId, context, ...tx })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const row = { id: uid(), user_id: userId, context, created_at: new Date().toISOString(), ...tx }
  const db = loadMock()
  db.transactions.push(row)
  saveMock(db)
  return row
}

// A transfer between two of the user's own accounts (e.g. cash -> debit card)
// is recorded as two linked rows so both account balances stay correct and
// neither leg is ever double-counted as real income/expense in reports.
async function addTransferImpl(userId, context, { fromAccountId, toAccountId, amount, date, comment }) {
  // transfer_id is a uuid column, so it needs a real uuid — not the mock uid().
  const transferId = (globalThis.crypto?.randomUUID?.() || uid())
  const base = { amount, date, comment, group: 'transfer', category_key: 'transfer', sub: null }
  const legs = [
    { ...base, account_id: fromAccountId, transfer_id: transferId, transfer_direction: 'out' },
    { ...base, account_id: toAccountId, transfer_id: transferId, transfer_direction: 'in' },
  ]
  if (supabaseEnabled) {
    // Both legs in one insert: a half-written transfer would make money vanish
    // from one account without arriving in the other.
    const { data, error } = await supabase
      .from('transactions')
      .insert(legs.map((leg) => ({ user_id: userId, context, ...leg })))
      .select()
    if (error) throw error
    return data
  }
  const out = await addTransaction(userId, context, legs[0])
  const inn = await addTransaction(userId, context, legs[1])
  return [out, inn]
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

async function checkInTodayImpl(userId, context) {
  const today = todayStr()
  if (supabaseEnabled) {
    // Without onConflict, PostgREST matches on the primary key and the second
    // check-in of the same day trips the unique(user_id, context, date) index.
    const { data, error } = await supabase
      .from('checkins')
      .upsert({ user_id: userId, context, date: today, done: true }, { onConflict: 'user_id,context,date' })
      .select()
      .single()
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
    const fromDb = (data || []).map((r) => r.lessons?.key).filter(Boolean)
    const fromLocal = localLessons()
      .filter((l) => l.user_id === userId && l.context === context)
      .map((l) => l.lesson_key)
    return [...new Set([...fromDb, ...fromLocal])]
  }
  const db = loadMock()
  return db.completedLessons.filter((c) => c.user_id === userId && c.context === context).map((c) => c.lesson_key)
}

// Lesson content lives in the client (src/lib/lessons.js), so the `lessons`
// table is usually empty and user_lessons — which needs a lessons.id — can't
// record anything. Rather than the checkmark never sticking, remember it
// locally for this browser.
const LOCAL_LESSONS_KEY = 'fintrack_local_lessons_v1'
function localLessons() {
  try { return JSON.parse(localStorage.getItem(LOCAL_LESSONS_KEY)) || [] } catch { return [] }
}
function markLessonLocally(userId, context, lessonKey) {
  const all = localLessons()
  if (all.some((l) => l.user_id === userId && l.context === context && l.lesson_key === lessonKey)) return
  all.push({ user_id: userId, context, lesson_key: lessonKey })
  try { localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(all)) } catch { /* private mode */ }
}

async function completeLessonImpl(userId, context, lessonKey) {
  if (supabaseEnabled) {
    const { data: lesson } = await supabase.from('lessons').select('id').eq('key', lessonKey).maybeSingle()
    if (!lesson) {
      markLessonLocally(userId, context, lessonKey)
      return
    }
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
    const key = todayStr(d)
    if (dates.has(key)) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export async function saveSettings(...args) {
  const result = await saveSettingsImpl(...args)
  notifyChange()
  return result
}

export async function addDebt(...args) {
  const result = await addDebtImpl(...args)
  notifyChange()
  return result
}

export async function updateDebt(...args) {
  const result = await updateDebtImpl(...args)
  notifyChange()
  return result
}

export async function deleteDebt(...args) {
  const result = await deleteDebtImpl(...args)
  notifyChange()
  return result
}

export async function payDownDebt(...args) {
  const result = await payDownDebtImpl(...args)
  notifyChange()
  return result
}

export async function upsertAccount(...args) {
  const result = await upsertAccountImpl(...args)
  notifyChange()
  return result
}

export async function deleteAccount(...args) {
  const result = await deleteAccountImpl(...args)
  notifyChange()
  return result
}

export async function upsertGoal(...args) {
  const result = await upsertGoalImpl(...args)
  notifyChange()
  return result
}

export async function deleteGoal(...args) {
  const result = await deleteGoalImpl(...args)
  notifyChange()
  return result
}

export async function addToGoalSavings(...args) {
  const result = await addToGoalSavingsImpl(...args)
  notifyChange()
  return result
}

export async function addTransaction(...args) {
  const result = await addTransactionImpl(...args)
  notifyChange()
  return result
}

export async function addTransfer(...args) {
  const result = await addTransferImpl(...args)
  notifyChange()
  return result
}

export async function checkInToday(...args) {
  const result = await checkInTodayImpl(...args)
  notifyChange()
  return result
}

export async function completeLesson(...args) {
  const result = await completeLessonImpl(...args)
  notifyChange()
  return result
}
