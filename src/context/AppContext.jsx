import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as db from '../lib/db'
import { translate } from '../i18n/strings'

const AppContext = createContext(null)

function detectDefaultLang() {
  const nav = typeof navigator !== 'undefined' ? navigator.language || navigator.userLanguage : 'ru'
  const short = (nav || 'ru').slice(0, 2).toLowerCase()
  return ['ru', 'en', 'es', 'fr'].includes(short) ? short : 'ru'
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out
  const [context, setContext] = useState(() => localStorage.getItem('fintrack_context') || 'personal')
  const [theme, setTheme] = useState(() => localStorage.getItem('fintrack_theme') || 'system')
  const [lang, setLang] = useState(() => localStorage.getItem('fintrack_lang') || detectDefaultLang())
  const [background, setBackground] = useState(() => localStorage.getItem('fintrack_background') || 'default')

  useEffect(() => {
    db.getSession().then(setUser)
  }, [])

  useEffect(() => {
    localStorage.setItem('fintrack_context', context)
  }, [context])

  useEffect(() => {
    localStorage.setItem('fintrack_lang', lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('fintrack_background', background)
  }, [background])

  const t = useCallback((key, params) => translate(key, lang, params), [lang])

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
    }
    apply()
    localStorage.setItem('fintrack_theme', theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  const refreshUser = useCallback(async () => {
    const u = await db.getSession()
    setUser(u)
    return u
  }, [])

  const signOut = useCallback(async () => {
    await db.signOut()
    setUser(null)
  }, [])

  const value = {
    user,
    setUser,
    refreshUser,
    signOut,
    context,
    setContext,
    theme,
    setTheme,
    lang,
    setLang,
    background,
    setBackground,
    t,
    toggleContext: () => setContext((c) => (c === 'personal' ? 'business' : 'personal')),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
