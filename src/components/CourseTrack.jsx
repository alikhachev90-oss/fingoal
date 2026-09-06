import { useState } from 'react'
import { Lock, Check, Clock, GraduationCap, ChevronRight, ExternalLink } from 'lucide-react'
import { Card, Button, IconCircle } from './UI'
import { useApp } from '../context/AppContext'
import { getExamResult, saveExamResult, getCompletedLessons, markLessonDone } from '../lib/course'

function ExamView({ track, userId, context, onDone }) {
  const { t } = useApp()
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(() => getExamResult(userId, context, track.key))

  function submit() {
    const total = track.exam.questions.length
    let correct = 0
    track.exam.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct += 1
    })
    const pct = Math.round((correct / total) * 100)
    const passed = pct >= track.exam.passPct
    const res = { correct, total, pct, passed, at: new Date().toISOString() }
    saveExamResult(userId, context, track.key, res)
    setResult(res)
    onDone?.(res)
  }

  const allAnswered = track.exam.questions.every((_, i) => answers[i] !== undefined)

  if (result) {
    return (
      <Card className={`!p-4 space-y-2 ${result.passed ? 'bg-savings/10' : 'bg-wants/10'}`}>
        <p className="font-semibold">{result.passed ? t('course.examPassed') : t('course.examNotPassed')}</p>
        <p className="text-sm text-muted">
          {t('course.examScore', { correct: result.correct, total: result.total, pct: result.pct, passPct: track.exam.passPct })}
        </p>
        {!result.passed && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setResult(null)
              setAnswers({})
            }}
          >
            {t('course.retake')}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card className="!p-4 space-y-4">
      <p className="font-semibold text-sm">{t('course.examForTrack', { title: track.title })}</p>
      {track.exam.questions.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-medium">{i + 1}. {q.q}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border ${
                  answers[i] === oi ? 'border-primary bg-primary/10' : 'border-border bg-surface2'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={submit} disabled={!allAnswered} type="button">
        {t('course.checkAnswers')}
      </Button>
    </Card>
  )
}

export default function CourseTrack({ track, unlocked, userId, context, settings, debts }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [openLesson, setOpenLesson] = useState(null)
  const [showExam, setShowExam] = useState(false)
  const [completed, setCompleted] = useState(() => getCompletedLessons(userId, context, track.key))
  const examResult = getExamResult(userId, context, track.key)

  if (track.comingSoon) {
    return (
      <Card className="!p-4 opacity-70 space-y-2">
        <div className="flex items-center gap-2.5">
          <IconCircle icon={Lock} className="bg-surface2 text-muted" size={34} iconSize={15} />
          <div className="min-w-0">
            <p className="font-semibold text-sm">{track.title}</p>
            <p className="text-xs text-muted">{t('course.comingSoon')}</p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">{track.description}</p>
        <p className="text-[11px] text-muted uppercase tracking-wide">{t('course.source', { source: track.source })}</p>
      </Card>
    )
  }

  if (!unlocked) {
    return (
      <Card className="!p-4 opacity-70">
        <div className="flex items-center gap-2.5">
          <IconCircle icon={Lock} className="bg-surface2 text-muted" size={34} iconSize={15} />
          <div className="min-w-0">
            <p className="font-semibold text-sm">{track.title}</p>
            <p className="text-xs text-muted">{t('course.locked')}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 text-left">
        <IconCircle
          icon={examResult?.passed ? Check : GraduationCap}
          className={examResult?.passed ? 'bg-savings/10 text-savings' : 'bg-primary/10 text-primary'}
          size={38}
          iconSize={17}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px]">{track.title}</p>
          <p className="text-xs text-muted mt-0.5">
            {t('course.lessonsOf', { done: completed.length, total: track.lessons.length, exam: examResult?.passed ? t('course.examPassedSuffix') : '' })}
          </p>
          <p className="text-[11px] text-muted mt-0.5">{t('course.source', { source: track.source })}</p>
        </div>
        <ChevronRight size={16} className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {track.lessons.map((lesson) => {
            const isDone = completed.includes(lesson.key)
            const isOpenL = openLesson === lesson.key
            return (
              <div key={lesson.key} className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenLesson(isOpenL ? null : lesson.key)}
                  className="w-full flex items-center gap-2.5 p-3 text-left bg-surface2/50"
                >
                  <IconCircle
                    icon={isDone ? Check : Clock}
                    size={28}
                    iconSize={13}
                    className={isDone ? 'bg-savings/10 text-savings' : 'bg-surface2 text-muted'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{lesson.title}</p>
                    <p className="text-[11px] text-muted">{lesson.minutes} {t('course.minutesSuffix')} · {lesson.source}</p>
                  </div>
                </button>
                {isOpenL && (
                  <div className="p-3 space-y-2.5 animate-slide-up">
                    {lesson.body({ settings, debts: debts || [] }).split('\n\n').map((para, i) => (
                      <p key={i} className="text-sm text-muted leading-relaxed">{para}</p>
                    ))}
                    {!isDone && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setCompleted(markLessonDone(userId, context, track.key, lesson.key))}
                      >
                        {t('course.markDone')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {!showExam && !examResult?.passed && (
            <Button
              variant="secondary"
              type="button"
              icon={ExternalLink}
              onClick={() => setShowExam(true)}
              disabled={completed.length < track.lessons.length}
            >
              {completed.length < track.lessons.length ? t('course.completeAllLessons') : t('course.takeExam')}
            </Button>
          )}
          {examResult?.passed && (
            <p className="text-xs text-savings font-medium text-center">{t('course.examPassedNextUnlocked')}</p>
          )}
          {(showExam || (examResult && !examResult.passed)) && (
            <ExamView track={track} userId={userId} context={context} onDone={() => setShowExam(true)} />
          )}
        </div>
      )}
    </Card>
  )
}
