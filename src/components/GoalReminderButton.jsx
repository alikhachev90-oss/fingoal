import { useState } from 'react'
import { Bell, BellRing, X, Check } from 'lucide-react'
import { IconButton, Button } from './UI'
import { useApp } from '../context/AppContext'
import { getGoalReminder, setGoalReminder, clearGoalReminder } from '../lib/goalReminders'
import { requestNotificationPermission } from '../lib/reminders'

export default function GoalReminderButton({ goalId }) {
  const { user, context, lang } = useApp()
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(() => getGoalReminder(user?.id, context, goalId)?.time || '21:00')
  const [reminder, setReminderState] = useState(() => (user ? getGoalReminder(user.id, context, goalId) : null))

  async function handleSave() {
    if (!time) return
    await requestNotificationPermission()
    const state = setGoalReminder(user.id, context, goalId, { enabled: true, time })
    setReminderState(state)
    setOpen(false)
  }

  function handleClear() {
    clearGoalReminder(user.id, context, goalId)
    setReminderState(null)
  }

  const labels = {
    remindMe: { ru: 'Ежедневное напоминание', en: 'Daily reminder', es: 'Recordatorio diario', fr: 'Rappel quotidien' },
    save: { ru: 'Сохранить', en: 'Save', es: 'Guardar', fr: 'Enregistrer' },
    cancel: { ru: 'Отмена', en: 'Cancel', es: 'Cancelar', fr: 'Annuler' },
    clear: { ru: 'Убрать напоминание', en: 'Remove reminder', es: 'Quitar recordatorio', fr: 'Supprimer le rappel' },
    at: { ru: 'В', en: 'At', es: 'A las', fr: 'À' },
  }
  const L = (k) => labels[k][lang] || labels[k].ru

  if (reminder && reminder.enabled) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
          <BellRing size={12} strokeWidth={2.25} />
          {L('at')} {reminder.time}
        </span>
        <IconButton icon={X} className="!w-7 !h-7" onClick={handleClear} type="button" aria-label={L('clear')} />
      </div>
    )
  }

  if (open) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary"
        />
        <IconButton icon={Check} className="!w-7 !h-7 !bg-primary/10 !text-primary !border-primary/30" onClick={handleSave} type="button" aria-label={L('save')} />
        <IconButton icon={X} className="!w-7 !h-7" onClick={() => setOpen(false)} type="button" aria-label={L('cancel')} />
      </div>
    )
  }

  return (
    <Button variant="secondary" className="!w-auto px-2.5 text-xs" icon={Bell} onClick={() => setOpen(true)} type="button">
      {L('remindMe')}
    </Button>
  )
}
