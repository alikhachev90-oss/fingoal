import FeedbackButton from './FeedbackButton'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, User, Briefcase, Globe, HelpCircle, Settings } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { IconButton } from './UI'
import { LANGUAGES } from '../i18n/strings'

export default function TopBar({ title, subtitle, onHelp }) {
  const { context, toggleContext, theme, setTheme, lang, setLang, t } = useApp()
  const [langOpen, setLangOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="page-header relative z-20 px-5 pt-[max(env(safe-area-inset-top),24px)] pb-2">
      <div className="page-header-inner">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="text-[11px] text-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="header-tools flex items-center gap-1.5 shrink-0">
            <FeedbackButton inline />
            {onHelp && <IconButton icon={HelpCircle} onClick={onHelp} aria-label="?" />}
            <div className="relative">
              <IconButton icon={Globe} onClick={() => setLangOpen((o) => !o)} aria-label={t('topbar.language')} />
              {langOpen && (
                <div className="absolute right-0 top-12 z-30 glass rounded-2xl shadow-soft p-1.5 w-20">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} type="button" onClick={() => { setLang(l.code); setLangOpen(false) }} className={`w-full text-left text-xs font-semibold px-2.5 py-2 rounded-xl ${lang === l.code ? 'bg-primary text-onprimary' : 'text-muted hover:bg-white/5'}`}>{l.label}</button>
                  ))}
                </div>
              )}
            </div>
            <IconButton icon={theme === 'dark' ? Sun : Moon} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('topbar.themeToggle')} />
            <IconButton icon={Settings} onClick={() => navigate('/settings')} aria-label={t('topbar.settings')} />
          </div>
        </div>
        <div className="mt-5 flex rounded-2xl p-1 bg-white/[.025] border border-white/[.07]">
          {[{ key: 'personal', label: t('topbar.personal'), icon: User }, { key: 'business', label: t('topbar.business'), icon: Briefcase }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => key !== context && toggleContext()} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${context === key ? 'bg-white/[.07] text-primary shadow-[0_1px_0_rgb(255_255_255/.09)_inset]' : 'text-muted hover:text-text'}`}>
              <Icon size={14} strokeWidth={2.3} /> {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
