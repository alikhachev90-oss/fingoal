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
    <div className="sticky top-0 z-20 bg-bg/85 backdrop-blur-lg border-b border-border px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-display tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onHelp && <IconButton icon={HelpCircle} onClick={onHelp} aria-label="?" />}
          <div className="relative">
            <IconButton icon={Globe} onClick={() => setLangOpen((o) => !o)} aria-label={t('topbar.language')} />
            {langOpen && (
              <div className="absolute right-0 top-11 z-30 bg-surface border border-border rounded-xl shadow-soft p-1 w-16">
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
          <IconButton
            icon={theme === 'dark' ? Sun : Moon}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('topbar.themeToggle')}
          />
          <IconButton icon={Settings} onClick={() => navigate('/settings')} aria-label={t('topbar.settings')} />
        </div>
      </div>
      <div className="mt-3 flex bg-surface2 rounded-lg p-1 border border-border">
        {[
          { key: 'personal', label: t('topbar.personal'), icon: User },
          { key: 'business', label: t('topbar.business'), icon: Briefcase },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => key !== context && toggleContext()}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              context === key ? 'bg-primary text-onprimary' : 'text-muted'
            }`}
          >
            <Icon size={14} strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
