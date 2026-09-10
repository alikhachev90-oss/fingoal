import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, MonitorSmartphone, Bell, RotateCcw, Trash2, LogOut, Mail, Info } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, Button, Input } from '../components/UI'
import { useApp } from '../context/AppContext'
import { LANGUAGES } from '../i18n/strings'
import { requestNotificationPermission } from '../lib/reminders'
import { resetTour } from '../lib/tours'
import { enablePushNotifications, disablePushNotifications, isPushEnabled, pushSupported } from '../lib/pushNotifications'
import { pushBackendEnabled } from '../lib/pushClient'
import { BACKGROUNDS } from '../lib/backgrounds'

const FEEDBACK_EMAIL = 'a.likhachev90@gmail.com'
const TOUR_SCREENS = ['dashboard', 'goals', 'insights']

export default function SettingsScreen() {
  const { user, context, theme, setTheme, lang, setLang, background, setBackground, t, signOut, updateProfile } = useApp()
  const [notifStatus, setNotifStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const [toursReset, setToursReset] = useState(false)
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState(null)
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    setName(user?.user_metadata?.full_name || '')
  }, [user])

  async function saveName() {
    setNameSaving(true)
    try {
      await updateProfile({ name: name.trim() })
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2500)
    } finally {
      setNameSaving(false)
    }
  }

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifStatus(Notification.permission)
    isPushEnabled().then(setPushOn)
  }, [])

  async function enableNotifications() {
    const result = await requestNotificationPermission()
    setNotifStatus(result)
  }

  async function togglePush() {
    setPushBusy(true)
    setPushError(null)
    try {
      if (pushOn) {
        await disablePushNotifications()
        setPushOn(false)
      } else {
        const result = await enablePushNotifications()
        if (result.ok) setPushOn(true)
        else setPushError(result.reason)
      }
    } finally {
      setPushBusy(false)
    }
  }

  function replayTours() {
    TOUR_SCREENS.forEach((s) => resetTour(user.id, context, s))
    setToursReset(true)
    setTimeout(() => setToursReset(false), 3500)
  }

  function openFeedback() {
    const subject = encodeURIComponent(t('feedback.subject'))
    const body = encodeURIComponent(`\n\n---\n${t('feedback.metaUser')}: ${user?.email}\n${t('feedback.metaContext')}: ${context}\n${t('feedback.metaLang')}: ${lang}`)
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
  }

  async function resetAllData() {
    if (!window.confirm(t('settings.resetConfirm'))) return
    localStorage.clear()
    await signOut()
    window.location.href = '/auth'
  }

  const notifLabel =
    notifStatus === 'granted' ? t('settings.notifStatusGranted')
      : notifStatus === 'denied' ? t('settings.notifStatusDenied')
      : t('settings.notifStatusDefault')

  return (
    <div className="screen-settings flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('settings.title')} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Link to="/dashboard" className="text-xs text-primary font-semibold flex items-center gap-1 mb-1">
          <ArrowLeft size={13} /> {t('nav.overview')}
        </Link>

        <Card className="!p-3.5 space-y-3">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">{t('settings.profile')}</p>
          <p className="text-sm font-medium">{user?.email}</p>
          <div className="space-y-1.5">
            <Input
              label={t('settings.nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.namePlaceholder')}
              className="!font-sans"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                type="button"
                className="!w-auto px-4 text-xs"
                onClick={saveName}
                disabled={nameSaving || !name.trim()}
              >
                {nameSaving ? t('common.saving') : t('settings.nameSave')}
              </Button>
              {nameSaved && <span className="text-xs text-savings font-semibold">{t('settings.nameSaved')}</span>}
            </div>
          </div>
        </Card>

        <Card className="!p-3.5 space-y-3">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">{t('settings.appearance')}</p>
          <div>
            <p className="text-xs text-muted mb-1.5">{t('settings.theme')}</p>
            <div className="flex bg-surface2 rounded-lg p-1 border border-border">
              {[
                { key: 'system', label: t('settings.themeSystem'), icon: MonitorSmartphone },
                { key: 'light', label: t('settings.themeLight'), icon: Sun },
                { key: 'dark', label: t('settings.themeDark'), icon: Moon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-semibold ${theme === key ? 'bg-primary text-onprimary' : 'text-muted'}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">{t('settings.language')}</p>
            <div className="flex gap-1.5 flex-wrap">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${lang === l.code ? 'bg-primary text-onprimary border-primary' : 'bg-surface2 border-border text-muted'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t('settings.background')}</p>
            <p className="text-[11px] text-muted/80 mb-1.5">{t('settings.backgroundNote')}</p>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBackground(b.id)}
                  aria-label={b.label[lang] || b.label.ru}
                  className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                    background === b.id ? 'border-primary scale-[1.03]' : 'border-border/60'
                  }`}
                >
                  <span className="absolute inset-0 bg-[rgb(24,26,29)]" />
                  <span className="absolute inset-0" style={{ background: b.css }} />
                  <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[8.5px] font-semibold text-white/90 bg-black/25 truncate text-center leading-tight">
                    {b.category[lang] || b.category.ru}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="!p-3.5 space-y-2.5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase flex items-center gap-1.5"><Bell size={13} /> {t('settings.notifications')}</p>
          {pushBackendEnabled && pushSupported() ? (
            <>
              <p className="text-sm">{notifLabel}</p>
              <p className="text-[11px] text-muted leading-relaxed">{t('settings.pushNote')}</p>
              <Button variant={pushOn ? 'secondary' : 'primary'} onClick={togglePush} disabled={pushBusy} type="button">
                {pushBusy ? t('common.saving') : pushOn ? t('settings.pushDisable') : t('settings.pushEnable')}
              </Button>
              {pushError === 'denied' && <p className="text-xs text-wants">{t('settings.pushDenied')}</p>}
              {pushError === 'save_failed' && <p className="text-xs text-wants">{t('settings.pushSaveFailed')}</p>}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm">{notifLabel}</p>
                {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
                  <Button className="!w-auto px-3 text-xs" onClick={enableNotifications} type="button">{t('settings.notifEnable')}</Button>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">{t('settings.notifNote')}</p>
              <p className="text-xs text-muted bg-surface2 rounded-lg px-2.5 py-2">
                {!pushBackendEnabled ? t('settings.pushNotConfigured') : t('settings.pushUnsupported')}
              </p>
            </>
          )}
        </Card>

        <Card className="!p-3.5 space-y-2.5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase flex items-center gap-1.5"><RotateCcw size={13} /> {t('settings.replayTours')}</p>
          <Button variant="secondary" onClick={replayTours} type="button">{t('settings.replayToursBtn')}</Button>
          {toursReset && <p className="text-xs text-savings">{t('settings.replayToursDone')}</p>}
        </Card>

        <Card className="!p-3.5 space-y-2.5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase flex items-center gap-1.5"><Mail size={13} /> {t('settings.feedback')}</p>
          <Button variant="secondary" onClick={openFeedback} type="button">{t('settings.feedbackBtn')}</Button>
        </Card>

        <Card className="!p-3.5 space-y-2.5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">{t('settings.data')}</p>
          <p className="text-xs text-muted leading-relaxed">{t('settings.dataNote')}</p>
          <Button variant="secondary" onClick={signOut} type="button">
            <span className="inline-flex items-center gap-1.5"><LogOut size={14} /> {t('settings.signOut')}</span>
          </Button>
          <Button variant="danger" onClick={resetAllData} type="button">
            <span className="inline-flex items-center gap-1.5"><Trash2 size={14} /> {t('settings.resetData')}</span>
          </Button>
        </Card>

        <Card className="!p-3.5 space-y-1.5">
          <p className="text-xs font-bold tracking-wide text-muted uppercase flex items-center gap-1.5"><Info size={13} /> {t('settings.about')}</p>
          <p className="text-xs text-muted leading-relaxed">{t('settings.aboutBody')}</p>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
