import * as db from './db'
import { supabase, supabaseEnabled } from './supabaseClient'

// A goal you can see: a photo attached to it (the car, the house, mom), shown
// on the goal and on the home screen, and — if you want — sent once a week in
// the morning as a push with that photo and how far along you are.

// Photos are shrunk on the phone before upload: a 12-megapixel shot becomes
// a ~150 KB JPEG, plenty for a card and a notification.
const MAX_SIDE = 1080

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

export async function shrinkImage(file) {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function goalImage(user, goalId) {
  return user?.user_metadata?.goal_images?.[goalId] || null
}

// Uploads the photo and records its address on the account, so it shows on
// every device. Returns the updated user.
export async function setGoalImage(user, goalId, file) {
  const dataUrl = await shrinkImage(file)
  let url = dataUrl
  if (supabaseEnabled) {
    const { data } = await supabase.auth.getSession()
    const res = await fetch('/api/goal-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data?.session?.access_token || ''}` },
      body: JSON.stringify({ goalId, dataUrl }),
    })
    if (!res.ok) throw new Error(`upload_failed_${res.status}`)
    url = (await res.json()).url
  }
  const images = { ...(user.user_metadata?.goal_images || {}), [goalId]: url }
  return db.saveUserMeta(user.id, { goal_images: images })
}

export async function removeGoalImage(user, goalId) {
  const images = { ...(user.user_metadata?.goal_images || {}) }
  delete images[goalId]
  return db.saveUserMeta(user.id, { goal_images: images })
}

// ------------------------------------------------------ weekly photo push
// Kept on the device like the other reminders and copied to the account by
// serverReminders.js. `snapshot` is the goal's numbers at the last visit, so
// the Monday message can say how much is left.
const key = (userId, goalId) => `fintera_vision_${userId}_${goalId}`

export function getVision(userId, goalId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId, goalId))) || null
  } catch {
    return null
  }
}

export function setVision(userId, goalId, next) {
  const value = { ...(getVision(userId, goalId) || {}), ...next }
  try {
    localStorage.setItem(key(userId, goalId), JSON.stringify(value))
  } catch {
    // Private mode — nothing to schedule from.
  }
  return value
}

export function clearVision(userId, goalId) {
  try {
    localStorage.removeItem(key(userId, goalId))
  } catch {
    // ignore
  }
}

export function goalSnapshot(goal) {
  return { name: goal.name, target: Number(goal.target_amount) || 0, saved: Number(goal.saved_amount) || 0 }
}
