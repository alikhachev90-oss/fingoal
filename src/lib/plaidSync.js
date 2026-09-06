import * as db from './db'
import { mapPlaidTransaction } from './plaidCategoryMap'

function cursorKey(userId, context) {
  return `fintera_plaid_cursor_${userId}_${context}`
}
function importedKey(userId, context) {
  return `fintera_plaid_imported_${userId}_${context}`
}

function getCursor(userId, context) {
  return localStorage.getItem(cursorKey(userId, context)) || null
}
function saveCursor(userId, context, cursor) {
  if (cursor) localStorage.setItem(cursorKey(userId, context), cursor)
}
function getImportedIds(userId, context) {
  try {
    return new Set(JSON.parse(localStorage.getItem(importedKey(userId, context))) || [])
  } catch {
    return new Set()
  }
}
function saveImportedIds(userId, context, set) {
  localStorage.setItem(importedKey(userId, context), JSON.stringify([...set]))
}

async function callPlaidApi(path, pin, body) {
  const res = await fetch(`/api/plaid/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-owner-pin': pin },
    body: JSON.stringify(body || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `request_failed_${res.status}`)
  return data
}

export async function createLinkToken(pin) {
  const data = await callPlaidApi('create-link-token', pin)
  return data.link_token
}

export async function exchangePublicToken(pin, publicToken) {
  return callPlaidApi('exchange-token', pin, { public_token: publicToken })
}

// Pulls everything new since the last sync, maps it into this app's category
// tree, and inserts it as normal transactions (so every existing feature —
// insights, the subscription radar, the course — sees it without changes).
// Returns { importedCount, skippedCount }.
export async function syncPlaidTransactions(userId, context, pin) {
  const cursor = getCursor(userId, context)
  const imported = getImportedIds(userId, context)

  const { added, next_cursor } = await callPlaidApi('transactions', pin, { cursor })

  let importedCount = 0
  let skippedCount = 0
  for (const raw of added) {
    if (imported.has(raw.transaction_id)) continue
    const mapped = mapPlaidTransaction(raw)
    if (!mapped) {
      skippedCount += 1
      imported.add(raw.transaction_id)
      continue
    }
    const { external_id, ...tx } = mapped
    await db.addTransaction(userId, context, tx)
    imported.add(external_id)
    importedCount += 1
  }

  saveImportedIds(userId, context, imported)
  saveCursor(userId, context, next_cursor)
  return { importedCount, skippedCount }
}
