import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button, Card } from './UI'

// Zero-backend feedback: the app has no server to receive messages, so this
// opens the user's own mail app pre-filled to the app owner's address via a
// plain mailto: link — honest about what it actually does (no fake "message
// sent" claim, no third-party form service).
const FEEDBACK_EMAIL = 'a.likhachev90@gmail.com'

export default function FeedbackButton({ inline = false }) {
  const { user, context, lang, t } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  if (!user || !inline) return null

  function send() {
    const subject = encodeURIComponent(t('feedback.subject'))
    const meta = `\n\n---\n${t('feedback.metaUser')}: ${user.email}\n${t('feedback.metaContext')}: ${context}\n${t('feedback.metaLang')}: ${lang}`
    const body = encodeURIComponent((text || '') + meta)
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
    setOpen(false)
    setText('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('feedback.button')}
        className={inline ? "home-tool" : "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 w-11 h-11 rounded-full bg-primary text-onprimary shadow-soft flex items-center justify-center"}
      >
        <MessageCircle size={19} strokeWidth={2.25} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-app space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t('feedback.title')}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-muted"><X size={16} /></button>
            </div>
            <p className="text-xs text-muted">{t('feedback.explain')}</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('feedback.placeholder')}
              rows={4}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary resize-none"
            />
            <Button onClick={send} type="button">{t('feedback.send')}</Button>
          </Card>
        </div>
      )}
    </>
  )
}
