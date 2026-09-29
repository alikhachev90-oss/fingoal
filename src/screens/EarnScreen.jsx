import { Link } from 'react-router-dom'
import { ExternalLink, ArrowRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Card } from '../components/UI'
import { useApp } from '../context/AppContext'
import { EARN_MORE } from '../lib/earnMore'

const pick = (field, lang) => field?.[lang] || field?.ru || ''

// The income half of the Path: spending cuts have a floor, income doesn't.
export default function EarnScreen() {
  const { t, lang } = useApp()
  const groups = ['tax', 'help', 'work', 'quick']

  return (
    <div className="screen-earn flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('earn.title')} subtitle={t('earn.subtitle')} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <p className="text-sm text-muted leading-relaxed">{t('earn.intro')}</p>
        {groups.map((g) => (
          <div key={g} className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-muted">{t(`earn.group.${g}`)}</p>
            {EARN_MORE.filter((item) => item.tag === g).map((item) => (
              <Card key={item.key} className="!p-4 space-y-2">
                <p className="font-semibold text-[15px] leading-snug">{pick(item.title, lang)}</p>
                <p className="text-[13px] text-muted leading-relaxed">{pick(item.body, lang)}</p>
                {item.href && (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary font-medium pt-1">
                    {pick(item.cta, lang)} <ExternalLink size={12} />
                  </a>
                )}
                {item.to && (
                  <Link to={item.to} className="inline-flex items-center gap-1.5 text-xs text-primary font-medium pt-1">
                    {pick(item.cta, lang)} <ArrowRight size={12} />
                  </Link>
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
