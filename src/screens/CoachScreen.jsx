import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Send, Square, RotateCcw, Check, X, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Button } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { todayStr } from '../lib/dates'
import { loadConversation, saveConversation, clearConversation, buildSnapshot, askCoach } from '../lib/coachClient'

const SPEECH_LANG = { ru: 'ru-RU', en: 'en-US', es: 'es-US', fr: 'fr-FR' }

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US')

// Text of a stored message, for display: user turns may be a string or blocks
// (text + tool results); assistant turns are the raw API content blocks.
function visibleText(message) {
  if (typeof message.content === 'string') return message.content
  return message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}

// Voice input through the phone's own speech recognition. Returns null where
// the browser has none (the mic button just doesn't show).
function useSpeech(lang, onText) {
  const recRef = useRef(null)
  const [listening, setListening] = useState(false)
  const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  function start() {
    if (!Recognition) return
    const rec = new Recognition()
    rec.lang = SPEECH_LANG[lang] || 'ru-RU'
    rec.continuous = true
    rec.interimResults = true
    let base = ''
    rec.onresult = (e) => {
      let finalText = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      if (finalText) base = `${base} ${finalText}`.trim()
      onText(`${base} ${interim}`.trim())
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function stop() {
    recRef.current?.stop()
    setListening(false)
  }

  useEffect(() => () => recRef.current?.abort?.(), [])
  return Recognition ? { listening, start, stop } : null
}

export default function CoachScreen() {
  const { user, setUser, context, lang, t } = useApp()
  const [messages, setMessages] = useState(() => (user ? loadConversation(user.id) : []))
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(null) // text of the reply being written
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resolved, setResolved] = useState({}) // tool_use id -> result text
  const bottom = useRef(null)
  const draftBefore = useRef('')
  const speech = useSpeech(lang, (text) => setDraft(`${draftBefore.current} ${text}`.trim()))

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages, streaming])

  // Tool proposals in the latest reply that still wait for a tap.
  const last = messages[messages.length - 1]
  const pending = useMemo(() => {
    if (!last || last.role !== 'assistant' || !Array.isArray(last.content)) return []
    return last.content.filter((b) => b.type === 'tool_use')
  }, [last])

  async function send(userContent) {
    const next = [...messages, { role: 'user', content: userContent }]
    setMessages(next)
    saveConversation(user.id, next)
    setBusy(true)
    setError('')
    setStreaming('')
    try {
      const snapshot = await buildSnapshot(user, context, lang)
      const reply = await askCoach(next, snapshot, setStreaming)
      const withReply = [...next, { role: 'assistant', content: reply.content }]
      setMessages(withReply)
      saveConversation(user.id, withReply)
      setResolved({})
      if (reply.stop_reason === 'refusal') setError(t('coach.refusal'))
    } catch (err) {
      setError(t(`coach.error.${err.message}`) === `coach.error.${err.message}` ? t('coach.error.failed') : t(`coach.error.${err.message}`))
    } finally {
      setStreaming(null)
      setBusy(false)
    }
  }

  // Tool proposals must be answered before the next turn: whatever the person
  // did with each (confirmed, declined, or just kept talking) goes back first.
  function toolResults(overrides = {}) {
    return pending.map((b) => ({
      type: 'tool_result',
      tool_use_id: b.id,
      content: overrides[b.id] || resolved[b.id] || 'The person has not answered this proposal yet.',
    }))
  }

  function submitDraft() {
    const text = draft.trim()
    if (!text || busy) return
    if (speech?.listening) speech.stop()
    setDraft('')
    draftBefore.current = ''
    send(pending.length ? [...toolResults(), { type: 'text', text }] : text)
  }

  async function applyTool(block) {
    const input = block.input || {}
    if (block.name === 'propose_debts') {
      for (const d of input.debts || []) {
        await db.addDebt(user.id, context, {
          name: String(d.name || 'Debt').slice(0, 60),
          balance: Number(d.balance) || 0,
          rate: Number(d.rate) || 0,
          min_payment: Number(d.min_payment) || 0,
        })
      }
      return `Saved ${(input.debts || []).length} debt(s) in the app.`
    }
    if (block.name === 'propose_goal') {
      await db.upsertGoal(user.id, context, {
        name: String(input.name || '').slice(0, 80),
        target_amount: Number(input.target_amount) || 0,
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(input.deadline || '') ? input.deadline : todayStr(new Date(Date.now() + 365 * 86400000)),
        why: input.why || null,
        priority: 99,
      })
      return 'Goal created in the app.'
    }
    if (block.name === 'propose_save_rate') {
      const rate = Math.max(1, Math.min(20, Math.round(Number(input.rate) || 5)))
      setUser(await db.saveUserMeta(user.id, { save_rate: rate, save_rate_at: new Date().toISOString() }))
      return `Pay-yourself-first rate set to ${rate}%.`
    }
    return 'Unknown action.'
  }

  async function answer(block, accept) {
    let result = 'The person declined.'
    if (accept) {
      try {
        result = await applyTool(block)
      } catch {
        result = 'Saving failed in the app.'
      }
    }
    const done = { ...resolved, [block.id]: result }
    setResolved(done)
    // Once every proposal is answered, let the friend continue.
    if (pending.every((b) => done[b.id])) send(toolResults(done))
  }

  function describe(block) {
    const i = block.input || {}
    if (block.name === 'propose_debts') return t('coach.proposeDebts', { list: (i.debts || []).map((d) => `${d.name} ${money(d.balance)}`).join(', ') })
    if (block.name === 'propose_goal') return t('coach.proposeGoal', { name: i.name, amt: money(i.target_amount), date: i.deadline })
    if (block.name === 'propose_save_rate') return t('coach.proposeRate', { rate: i.rate })
    return block.name
  }

  function restart() {
    clearConversation(user.id)
    setMessages([])
    setResolved({})
    setError('')
  }

  const shown = messages.filter((m) => visibleText(m))

  return (
    <div className="screen-coach flex flex-col h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('coach.title')} subtitle={t('coach.subtitle')} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {shown.length === 0 && streaming === null && (
          <div className="space-y-3 pt-2">
            <div className="glass rounded-[18px] p-4 space-y-2">
              <p className="flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-primary" /> {t('coach.helloTitle')}</p>
              <p className="text-sm text-muted leading-relaxed">{t('coach.hello')}</p>
            </div>
            {['coach.starter1', 'coach.starter2', 'coach.starter3'].map((k) => (
              <button key={k} type="button" disabled={busy} onClick={() => send(t(k))} className="w-full text-left text-sm rounded-xl border border-border px-3.5 py-3 text-text/90">
                {t(k)}
              </button>
            ))}
          </div>
        )}

        {shown.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed rounded-2xl px-3.5 py-2.5 ${m.role === 'user' ? 'bg-primary/20 text-text rounded-br-md' : 'glass rounded-bl-md'}`}>
              {visibleText(m)}
            </p>
          </div>
        ))}

        {streaming !== null && (
          <div className="flex justify-start">
            <p className="max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed rounded-2xl rounded-bl-md px-3.5 py-2.5 glass">
              {streaming || <span className="text-muted">{t('coach.thinking')}</span>}
            </p>
          </div>
        )}

        {!busy && pending.map((block) => (
          <div key={block.id} className="rounded-xl border border-primary/40 bg-primary/10 p-3 space-y-2.5">
            <p className="text-sm">{describe(block)}</p>
            {resolved[block.id] ? (
              <p className="text-xs text-muted">{t('coach.answered')}</p>
            ) : (
              <div className="flex gap-2">
                <Button type="button" className="!w-auto px-4 text-xs" icon={Check} onClick={() => answer(block, true)}>{t('coach.accept')}</Button>
                <Button type="button" variant="secondary" className="!w-auto px-4 text-xs" icon={X} onClick={() => answer(block, false)}>{t('coach.decline')}</Button>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="text-xs text-wants space-y-1.5">
            <p>{error}</p>
            {error === t('coach.error.bad_conversation') && <button type="button" className="text-primary" onClick={restart}>{t('coach.restart')}</button>}
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] border-t border-border/60 space-y-2">
        <div className="flex items-end gap-2">
          {speech && (
            <button
              type="button"
              onClick={() => {
                if (speech.listening) speech.stop()
                else { draftBefore.current = draft; speech.start() }
              }}
              className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${speech.listening ? 'bg-wants text-white animate-pulse' : 'bg-surface2 text-primary border border-border'}`}
              aria-label={speech.listening ? t('coach.stopVoice') : t('coach.voice')}
            >
              {speech.listening ? <Square size={16} /> : <Mic size={18} />}
            </button>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={1}
            placeholder={speech?.listening ? t('coach.listening') : t('coach.placeholder')}
            className="flex-1 min-h-11 max-h-32 resize-none bg-surface2 border border-border rounded-2xl px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
          <button type="button" disabled={busy || !draft.trim()} onClick={submitDraft} className="w-11 h-11 shrink-0 rounded-full bg-primary text-onprimary flex items-center justify-center disabled:opacity-40" aria-label={t('coach.send')}>
            <Send size={17} />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted px-1">
          <span>{t('coach.disclaimer')}</span>
          {messages.length > 0 && (
            <button type="button" onClick={restart} className="flex items-center gap-1 shrink-0"><RotateCcw size={11} /> {t('coach.new')}</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CoachLink() {
  const { t } = useApp()
  return (
    <Link to="/coach" className="block">
      <div className="glass rounded-[18px] p-4 flex items-center gap-3 border-primary/30">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0"><Sparkles size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{t('coach.linkTitle')}</p>
          <p className="text-xs text-muted mt-0.5">{t('coach.linkSubtitle')}</p>
        </div>
        <Mic size={16} className="text-primary shrink-0" />
      </div>
    </Link>
  )
}
