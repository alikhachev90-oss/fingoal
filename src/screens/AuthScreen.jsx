import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Mail, Lock, Sparkles, HelpCircle, Globe, Eye, EyeOff, Phone } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [authMethod, setAuthMethod] = useState('email')
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [notice, setNotice] = useState('')
  const [rememberEmail, setRememberEmail] = useState(() => localStorage.getItem('fintera_remember_email') !== '0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { user, refreshUser, lang, setLang, t } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('fintera_saved_email')
    if (saved) setEmail(saved)
  }, [])

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
    setNotice('')
    setLoading(true)
    try {
      if (authMethod === 'phone') {
        if (!phoneCodeSent) {
          await db.sendPhoneCode(phone.trim(), mode === 'signup')
          setPhoneCodeSent(true)
          setNotice(t('auth.smsSent'))
          return
        }
        await db.verifyPhoneCode(phone.trim(), phoneCode.trim())
      } else if (mode === 'signup') {
        const result = await db.signUp(email, password)
        if (rememberEmail) localStorage.setItem('fintera_saved_email', email)
        if (supabaseEnabled && !result.session) {
          setNotice(t('auth.emailSent'))
          return
        }
      } else {
        await db.signIn(email, password)
        if (rememberEmail) localStorage.setItem('fintera_saved_email', email)
        else localStorage.removeItem('fintera_saved_email')
      }
      const loggedInUser = await refreshUser()
      if (!loggedInUser) {
        setNotice(t('auth.emailSent'))
        return
      }
      const settings = await db.getSettings(loggedInUser.id, 'personal')
      navigate(settings?.onboarded ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err.message || 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setPhoneCodeSent(false)
    setPhoneCode('')
    setError('')
    setNotice('')
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
              onClick={() => switchMode(m)}
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === m ? 'bg-surface shadow-softer text-text' : 'text-muted'
              }`}
            >
              {m === 'signin' ? t('auth.signin') : t('auth.signup')}
            </button>
          ))}
        </div>

        <div className="flex bg-surface2 rounded-xl p-1 border border-border">
          {['email', 'phone'].map((method) => (
            <button key={method} type="button" onClick={() => { setAuthMethod(method); setPhoneCodeSent(false); setNotice('') }} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${authMethod === method ? 'bg-surface text-text shadow-softer' : 'text-muted'}`}>
              {method === 'email' ? t('auth.emailMethod') : t('auth.phoneMethod')}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <p className="text-xs text-muted leading-relaxed bg-surface2 border border-border rounded-lg px-3 py-2.5">
            {t('auth.disclaimer')}
          </p>
        )}

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-3">
          {authMethod === 'email' ? (
            <>
              <Input icon={Mail} label={t('auth.email')} id="auth-email" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <div className="relative">
                <Input icon={Lock} label={t('auth.password')} id="auth-password" name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-12" />
                <button type="button" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[31px] p-2 text-muted hover:text-text">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input type="checkbox" checked={rememberEmail} onChange={(e) => setRememberEmail(e.target.checked)} className="accent-primary" />
                {t('auth.remember')}
              </label>
            </>
          ) : (
            <>
              <Input icon={Phone} label={t('auth.phone')} id="auth-phone" name="tel" autoComplete="tel" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
              {phoneCodeSent && <Input label={t('auth.smsCode')} id="auth-sms-code" name="one-time-code" autoComplete="one-time-code" inputMode="numeric" type="text" required value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} placeholder="123456" />}
            </>
          )}
          {notice && <p role="status" className="text-savings text-sm font-medium">{notice}</p>}
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
