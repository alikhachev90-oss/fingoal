import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Mail, Lock, Sparkles, HelpCircle, Globe } from 'lucide-react'
import { Button, Input, Card } from '../components/UI'
import HowItWorksModal from '../components/HowItWorksModal'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { supabaseEnabled } from '../lib/supabaseClient'
import { LANGUAGES } from '../i18n/strings'

export default function AuthScreen() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { user, refreshUser, lang, setLang, t } = useApp()
  const navigate = useNavigate()

  // A back-button press (or any other navigation) can land here while a
  // session is still valid — e.g. Android's back button walking through SPA
  // history. Without this, the screen shows a blank sign-in form and someone
  // who doesn't realize they're still logged in can end up creating a second,
  // empty account instead of just going back to the one they already have.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await db.signUp(email, password)
      } else {
        await db.signIn(email, password)
      }
      const loggedInUser = await refreshUser()
      const settings = await db.getSettings(loggedInUser.id, 'personal')
      navigate(settings?.onboarded ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err.message || 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col justify-center min-h-[100svh] px-6 py-10 max-w-app mx-auto w-full">
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center"
          aria-label={t('topbar.language')}
        >
          <Globe size={16} strokeWidth={2.25} />
        </button>
        {langOpen && (
          <div className="absolute right-0 top-11 bg-surface border border-border rounded-xl shadow-soft p-1 w-16">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code)
                  setLangOpen(false)
                }}
                className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                  lang === l.code ? 'bg-primary text-onprimary' : 'text-muted hover:bg-surface2'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 text-center relative animate-pop-in">
        <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4">
          <Target size={28} className="text-primary" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-semibold font-display tracking-tight">Fintera</h1>
        <p className="text-muted text-sm mt-2">{t('auth.tagline')}</p>
        <button
          onClick={() => setShowHowItWorks(true)}
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-4 border-b border-primary/40 pb-0.5"
        >
          <HelpCircle size={15} strokeWidth={2.3} />
          {t('auth.howItWorks')}
        </button>
        {!supabaseEnabled && (
          <p className="text-xs text-muted mt-5 bg-surface2 border border-border rounded-lg px-3 py-2.5 flex items-center gap-2 text-left">
            <Sparkles size={14} className="text-primary shrink-0" />
            {t('auth.demoNote')}
          </p>
        )}
      </div>

      <Card className="space-y-4 relative">
        <div className="flex bg-surface2 rounded-xl p-1 border border-border">
          {['signin', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === m ? 'bg-surface shadow-softer text-text' : 'text-muted'
              }`}
            >
              {m === 'signin' ? t('auth.signin') : t('auth.signup')}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <p className="text-xs text-muted leading-relaxed bg-surface2 border border-border rounded-lg px-3 py-2.5">
            {t('auth.disclaimer')}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input icon={Mail} label={t('auth.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input icon={Lock} label={t('auth.password')} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p className="text-danger text-sm font-medium">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? t('auth.loading') : mode === 'signin' ? t('auth.submitSignin') : t('auth.submitSignup')}
          </Button>
        </form>
      </Card>

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </div>
  )
}
