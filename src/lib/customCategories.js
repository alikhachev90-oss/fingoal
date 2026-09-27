import * as db from './db'
import { getCustomCategories, setCustomCategories } from './categories'

// Your own categories live in the account (so they're on every device) and
// are mirrored locally, so they're there instantly and even offline.
const LOCAL_KEY = 'fintrack_custom_categories_v1'

function readLocal(userId) {
  try {
    return JSON.parse(localStorage.getItem(`${LOCAL_KEY}:${userId}`)) || null
  } catch {
    return null
  }
}

function writeLocal(userId, data) {
  try {
    localStorage.setItem(`${LOCAL_KEY}:${userId}`, JSON.stringify(data))
  } catch {
    // Private mode — the account copy still has it.
  }
}

export function loadCustomCategories(user) {
  if (!user) return setCustomCategories(null)
  // Whichever copy was written last wins — the local one is newer when the
  // last save couldn't reach the account.
  const remote = user.user_metadata?.custom_categories
  const local = readLocal(user.id)
  setCustomCategories((local?.at || 0) > (remote?.at || 0) ? local : remote || local)
}

async function save(user, next) {
  const data = { ...next, at: Date.now() }
  setCustomCategories(data)
  writeLocal(user.id, data)
  try {
    await db.saveUserMeta(user.id, { custom_categories: data })
  } catch {
    // Offline or the auth call failed: it's kept locally and goes up next time.
  }
}

const clean = (label) => label.replace(/\s+/g, ' ').trim().slice(0, 40)

export async function addCustomCategory(user, group, label) {
  const name = clean(label)
  if (!name) return null
  const cur = getCustomCategories()
  const list = cur.cats[group] || []
  if (!list.some((l) => l.toLowerCase() === name.toLowerCase())) {
    await save(user, { ...cur, cats: { ...cur.cats, [group]: [...list, name] } })
  }
  return name
}

export async function addCustomSub(user, group, key, label) {
  const name = clean(label)
  if (!name) return null
  const cur = getCustomCategories()
  const id = `${group}:${key}`
  const list = cur.subs[id] || []
  if (!list.some((l) => l.toLowerCase() === name.toLowerCase())) {
    await save(user, { ...cur, subs: { ...cur.subs, [id]: [...list, name] } })
  }
  return name
}

export async function removeCustomCategory(user, group, label) {
  const cur = getCustomCategories()
  await save(user, { ...cur, cats: { ...cur.cats, [group]: (cur.cats[group] || []).filter((l) => l !== label) } })
}

export async function removeCustomSub(user, group, key, label) {
  const cur = getCustomCategories()
  const id = `${group}:${key}`
  await save(user, { ...cur, subs: { ...cur.subs, [id]: (cur.subs[id] || []).filter((l) => l !== label) } })
}
