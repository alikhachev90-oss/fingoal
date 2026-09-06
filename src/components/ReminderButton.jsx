import { useState } from 'react'
import { Bell, BellRing, X, Check } from 'lucide-react'
import { IconButton, Button } from './UI'
import { useApp } from '../context/AppContext'
import { getReminderFor, setReminder, clearReminder, requestNotificationPermission } from '../lib/reminders'

function defaultDateTimeLocal() {
  // Default to tomorrow, same time-of-day rounded to the next hour.
  const d = new Date(Date.now() + 86400000)
  d.setMinutes(0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function formatWhen(iso, lang) {
  const d = new Date(iso)
  return d.toLocaleString(lang === 'ru' ? 'ru-RU' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// billId must be stable across renders for a given bill (e.g. `needs:housing` or `debt:<uuid>`).
export default function ReminderButton({ billId, label, amount }) {
  const { user, context, t, lang } = useApp()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultDateTimeLocal())
  const [reminder, setReminderState] = useState(() => (user ? getReminderFor(user.id, context, billId) : null))

  async function handleSave() {
    if (!value) return
    await requestNotificationPermission()
    const iso = new Date(value).toISOString()
    setReminder(user.id, context, { billId, label, amount, when: iso })
    setReminderState(getReminderFor(user.id, context, billId))
    setOpen(false)
  }

  function handleClear() {
    clearReminder(user.id, context, billId)
    setReminderState(null)
  }

  if (reminder && !reminder.fired) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
          <BellRing size={12} strokeWidth={2.25} />
          {formatWhen(reminder.when, lang)}
        </span>
        <IconButton icon={X} className="!w-7 !h-7" onClick={handleClear} type="button" aria-label={t('bills.clearReminder')} />
      </div>
    )
  }

  if (open) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary"
        />
        <IconButton icon={Check} className="!w-7 !h-7 !bg-primary/10 !text-primary !border-primary/30" onClick={handleSave} type="button" aria-label={t('bills.saveReminder')} />
        <IconButton icon={X} className="!w-7 !h-7" onClick={() => setOpen(false)} type="button" aria-label={t('common.cancel')} />
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      className="!w-auto px-2.5 shrink-0 text-xs"
      icon={Bell}
      onClick={() => setOpen(true)}
      type="button"
    >
      {t('bills.remindMe')}
    </Button>
  )
}
