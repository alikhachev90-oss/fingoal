import { useEffect, useState } from 'react'
import { GraduationCap, Lock, Check, Clock, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, Button, IconCircle, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { getLessonsWithStatus } from '../lib/lessons'
import { getRecommendedLesson } from '../lib/coach'
import { useSearchParams } from 'react-router-dom'
import { TRACKS, isTrackUnlocked } from '../lib/course'
import CourseTrack from '../components/CourseTrack'

export default function LessonsScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [debts, setDebts] = useState([])
  const [goals, setGoals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [completed, setCompleted] = useState([])
  const [openKey, setOpenKey] = useState(null)
  const [searchParams] = useSearchParams()
  const focusKey = searchParams.get('focus')

  useEffect(() => {
    if (focusKey) setOpenKey(focusKey)
  }, [focusKey])

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    db.listDebts(user.id, context).then(setDebts)
    db.listGoals(user.id, context).then(setGoals)
    db.listTransactions(user.id, context).then(setTransactions)
    refreshCompleted()
  }, [user, context])

  function refreshCompleted() {
    db.listCompletedLessons(user.id, context).then(setCompleted)
  }

  async function markDone(key) {
    await db.completeLesson(user.id, context, key)
    refreshCompleted()
  }

  if (settings === null) {
    return (
      <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full items-center justify-center px-6">
        <EmptyState icon={GraduationCap} title={t('lessons.onboardingRequiredTitle')} subtitle={t('lessons.onboardingRequiredSubtitle')} />
      </div>
    )
  }

  const lessons = getLessonsWithStatus({ settings, debts, goals, transactions, lang })
  const unlockedCount = lessons.filter((l) => l.unlocked).length
  const doneCount = lessons.filter((l) => l.unlocked && completed.includes(l.key)).length
  const recommended = getRecommendedLesson(lessons, completed, focusKey)
  const progressPct = unlockedCount > 0 ? Math.round((doneCount / unlockedCount) * 100) : 0
  const orderedLessons = recommended ? [recommended, ...lessons.filter((lesson) => lesson.key !== recommended.key)] : lessons

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('lessons.title')} subtitle={t('lessons.doneOfUnlocked', { done: doneCount, total: unlockedCount })} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Card className="!p-5 overflow-hidden learning-hero">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[.18em] text-primary font-bold">FINANCIAL IQ</p>
              <p className="font-display text-[24px] leading-tight mt-2">{lang === 'en' ? 'Build knowledge in small steps.' : 'Прокачивай финансовое мышление маленькими шагами.'}</p>
              <p className="text-xs text-muted leading-relaxed mt-2">{lang === 'en' ? 'Short lessons, tied to what is actually happening with your money.' : 'Короткие уроки, связанные с тем, что реально происходит с твоими деньгами.'}</p>
            </div>
            <div className="w-[72px] h-[72px] rounded-full border border-primary/25 bg-primary/10 flex flex-col items-center justify-center shrink-0 shadow-[0_0_35px_-16px_rgb(var(--color-primary)/.9)]">
              <span className="text-xl font-bold font-num text-primary">{progressPct}%</span>
              <span className="text-[9px] uppercase tracking-wide text-muted">{lang === 'en' ? 'done' : 'пройдено'}</span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[.06] overflow-hidden mt-4">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(4, progressPct)}%` }} />
          </div>
        </Card>

        <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-1">{t('lessons.courseSection')}</p>
        <div className="space-y-3 mb-2">
          {TRACKS.map((track) => (
            <CourseTrack
              key={track.key}
              track={track}
              unlocked={isTrackUnlocked(track, user.id, context)}
              userId={user.id}
              context={context}
              settings={settings}
              debts={debts}
            />
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase">{t('lessons.storiesSection')}</p>
          {recommended && <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold"><Sparkles size={12} /> {lang === 'en' ? 'For you' : 'Для тебя'}</span>}
        </div>
        {orderedLessons.map((lesson) => {
          const isDone = completed.includes(lesson.key)
          const isOpen = openKey === lesson.key
          return (
            <Card key={lesson.key} className={`!p-0 overflow-hidden ${!lesson.unlocked ? 'opacity-60' : ''} ${recommended?.key === lesson.key ? '!border-primary/30 gold-glow' : ''}`}>
              <button
                type="button"
                disabled={!lesson.unlocked}
                onClick={() => setOpenKey(isOpen ? null : lesson.key)}
                className="w-full flex items-center gap-3 p-4 text-left disabled:cursor-not-allowed"
              >
                <IconCircle
                  icon={!lesson.unlocked ? Lock : isDone ? Check : GraduationCap}
                  size={38}
                  iconSize={17}
                  className={
                    !lesson.unlocked
                      ? 'bg-surface2 text-muted'
                      : isDone
                        ? 'bg-savings/10 text-savings'
                        : 'bg-primary/10 text-primary'
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-display text-[15px] leading-snug">{lesson.title}</p>
                  {recommended?.key === lesson.key && <p className="text-[10px] uppercase tracking-[.14em] text-primary font-bold mt-1">{lang === 'en' ? 'Recommended now' : 'Рекомендуем сейчас'}</p>}
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    {!lesson.unlocked ? (
                      t('lessons.locked')
                    ) : (
                      <>
                        <Clock size={11} /> {lesson.minutes} {t('lessons.minutesSuffix')} {isDone && t('lessons.minutesDone')}
                      </>
                    )}
                  </p>
                </div>
              </button>
              {isOpen && lesson.unlocked && (
                <div className="px-4 pb-4 space-y-3 animate-slide-up">
                  {lesson.body.split('\n\n').map((para, i) => {
                    const isPersonal = /^(Твои цифры|Заполни|Создай|Добавь)/.test(para)
                    return isPersonal ? (
                      <p key={i} className="text-sm font-medium bg-surface2 border-l-[3px] border-primary rounded-r-lg pl-3 pr-2 py-2 leading-relaxed">
                        {para}
                      </p>
                    ) : (
                      <p key={i} className="text-sm text-muted leading-relaxed">{para}</p>
                    )
                  })}
                  {!isDone && (
                    <Button variant="secondary" onClick={() => markDone(lesson.key)} type="button">
                      {t('lessons.markDone')}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
