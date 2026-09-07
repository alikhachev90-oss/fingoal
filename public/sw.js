// Service worker for real push notifications — the whole reason this exists
// is to let a notification show up even when the app/tab is fully closed and
// the screen is off. A push event wakes this worker (the browser/OS does
// that part), and showNotification() is what actually puts a system
// notification on screen; nothing here needs the app to be open.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Fintera'
  const body = data.body || 'Не забудь записать сегодняшние траты.'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'fintera-daily-reminder',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/dashboard')
    }),
  )
})
