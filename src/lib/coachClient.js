import * as db from './db'
import { supabase, supabaseEnabled } from './supabaseClient'
import { computePath, saveRate } from './path'
import { computeAccountBalance } from './creditCards'
import { deriveMonthlyIncome } from './finance'
import { toDate } from './dates'

// Talking to the AI money friend (api/coach.js).
//
// The conversation is kept on the phone exactly as the API returned it —
// thinking blocks included — and only ever appended to. The model checks that
// earlier turns weren't edited, so trimming or rewriting history would break
// the conversation; "new conversation" starts a fresh one instead.

const key = (userId) => `fintera_coach_${userId}`

export function loadConversation(userId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId))) || []
  } catch {
    return []
  }
}

export function saveConversation(userId, messages) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(messages))
  } catch {
    // Full or private storage — the chat still works for this session.
  }
}

export function clearConversation(userId) {
  try {
    localStorage.removeItem(key(userId))
  } catch {
    // ignore
  }
}

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US')

// A plain-text picture of the person's money for the model, including the
// phone's own date, time and time zone.
export async function buildSnapshot(user, context, lang) {
  const [settings, transactions, debts, goals, accounts] = await Promise.all([
    db.getSettings(user.id, context).catch(() => null),
    db.listTransactions(user.id, context).catch(() => []),
    db.listDebts(user.id, context).catch(() => []),
    db.listGoals(user.id, context).catch(() => []),
    db.listAccounts(user.id, context).catch(() => []),
  ])
  const path = computePath({ transactions, settings, debts, goals })
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lines = [
    `Local date and time on their phone: ${now.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'full', timeStyle: 'short' })} (${tz})`,
    `App language: ${lang}`,
    `Typical monthly income (from logged income): ${money(deriveMonthlyIncome(transactions))}`,
    `Monthly essentials: ${money(path.essentials)}`,
    `Emergency cushion saved so far: ${money(path.cushion)}`,
    `Current Path step: ${path.index + 1} of ${path.steps.length} (${path.current.key}), ${money(path.current.left)} left on it`,
    `Pay-yourself-first rate: ${saveRate(user)}%`,
  ]
  const open = debts.filter((d) => Number(d.balance) > 0)
  lines.push(open.length
    ? `Debts: ${open.map((d) => `${d.name} ${money(d.balance)}${Number(d.rate) ? ` at ${d.rate}% APR` : ''}${Number(d.min_payment) ? `, min ${money(d.min_payment)}/mo` : ''}`).join('; ')}`
    : 'Debts: none recorded in the app')
  if (accounts.length) {
    lines.push(`Accounts: ${accounts.map((a) => `${a.name} (${a.type}) ${money(computeAccountBalance(a, transactions))}${a.type === 'credit' ? ' owed' : ''}`).join('; ')}`)
  }
  lines.push(goals.length
    ? `Goals: ${goals.map((g) => `${g.name} ${money(g.saved_amount)} of ${money(g.target_amount)} by ${g.deadline}`).join('; ')}`
    : 'Goals: none yet')
  const since = now.getTime() - 30 * 86400000
  const spent = transactions.filter((t) => (t.group === 'needs' || t.group === 'wants') && !t.is_payment && toDate(t.date).getTime() >= since)
  lines.push(`Spent in the last 30 days: needs ${money(spent.filter((t) => t.group === 'needs').reduce((s, t) => s + Number(t.amount), 0))}, wants ${money(spent.filter((t) => t.group === 'wants').reduce((s, t) => s + Number(t.amount), 0))}`)
  return lines.join('\n')
}

// Sends the conversation and streams the reply. `onText` gets the reply as it
// grows; resolves with { content, stop_reason } or throws Error(code).
export async function askCoach(messages, snapshot, onText) {
  // Without a signed-in account the server answers 401, shown as such.
  const { data } = supabaseEnabled ? await supabase.auth.getSession() : { data: null }
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data?.session?.access_token || ''}` },
    body: JSON.stringify({ messages, snapshot }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `http_${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let cut
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, cut).replace(/^data: /, '')
      buffer = buffer.slice(cut + 2)
      if (!line) continue
      const event = JSON.parse(line)
      if (event.t) {
        text += event.t
        onText(text)
      } else if (event.error) {
        throw new Error(event.error)
      } else if (event.done) {
        return { content: event.content, stop_reason: event.stop_reason }
      }
    }
  }
  throw new Error('interrupted')
}
