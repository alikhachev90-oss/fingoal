import { useEffect, useState } from 'react'
import { GraduationCap, Lock, Check, Clock } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, Button, IconCircle, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { getLessonsWithStatus } from '../lib/lessons'
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

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('lessons.title')} subtitle={t('lessons.doneOfUnlocked', { done: doneCount, total: unlockedCount })} />
      <div className="flex-1 px-4 py-4 space-y-3">
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

        <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-1 pt-2">{t('lessons.storiesSection')}</p>
        {lessons.map((lesson) => {
          const isDone = completed.includes(lesson.key)
          const isOpen = openKey === lesson.key
          return (
            <Card key={lesson.key} className={`!p-0 overflow-hidden ${!lesson.unlocked ? 'opacity-60' : ''}`}>
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
