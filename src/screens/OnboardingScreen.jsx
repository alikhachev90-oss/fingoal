import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Home, Car, ShoppingCart, HeartPulse, CreditCard, ChevronLeft, PlusCircle } from 'lucide-react'
import { Button, Input, Card, IconCircle } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'

const emptyDebt = { name: '', balance: '', rate: '', termMonths: '', minPayment: '' }

export default function OnboardingScreen() {
  const { user, context, t } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [income, setIncome] = useState('')
  const [needs, setNeeds] = useState({ housing: '', transport: '', groceries: '', health: '' })
  const [hasDebts, setHasDebts] = useState(null)
  const [debts, setDebts] = useState([{ ...emptyDebt }])
  const [saving, setSaving] = useState(false)

  const NEEDS_FIELDS = [
    { key: 'housing', label: t('onboarding.needsFieldHousing'), hint: t('onboarding.needsFieldHousingHint'), icon: Home, color: 'bg-needs/10 text-needs' },
    { key: 'transport', label: t('onboarding.needsFieldTransport'), hint: t('onboarding.needsFieldTransportHint'), icon: Car, color: 'bg-wants/10 text-wants' },
    { key: 'groceries', label: t('onboarding.needsFieldGroceries'), hint: '', icon: ShoppingCart, color: 'bg-savings/10 text-savings' },
    { key: 'health', label: t('onboarding.needsFieldHealth'), hint: t('onboarding.needsFieldHealthHint'), icon: HeartPulse, color: 'bg-primary/10 text-primary' },
  ]

  const totalNeeds = Object.values(needs).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  function updateDebt(i, field, value) {
    setDebts((ds) => ds.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)))
  }

  async function finish() {
    setSaving(true)
    try {
      await db.saveSettings(user.id, context, {
        monthly_income: parseFloat(income) || 0,
        needs_budget: Object.fromEntries(Object.entries(needs).map(([k, v]) => [k, parseFloat(v) || 0])),
        has_debts: hasDebts === 'yes',
        onboarded: true,
      })
      if (hasDebts === 'yes') {
        for (const d of debts) {
          if (!d.name && !d.balance) continue
          await db.addDebt(user.id, context, {
            name: d.name || 'Credit',
            balance: parseFloat(d.balance) || 0,
            rate: parseFloat(d.rate) || 0,
            term_months: parseInt(d.termMonths) || 0,
            min_payment: parseFloat(d.minPayment) || 0,
          })
        }
      }
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const stepMeta = [
    { title: t('onboarding.step0Title'), icon: Wallet },
    { title: t('onboarding.step1Title'), icon: Home },
    { title: t('onboarding.step2Title'), icon: CreditCard },
  ]

  const steps = [
    // Step 0: income
    <div key="income" className="space-y-5 animate-slide-up">
      <p className="text-muted text-sm">
        {t('onboarding.contextLabel')}:{' '}
        <span className="font-semibold text-text">{context === 'personal' ? t('topbar.personal') : t('topbar.business')}</span>.{' '}
        {t('onboarding.incomeAfterTax')}
      </p>
      <Input icon={Wallet} label={t('onboarding.income')} type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="5000" autoFocus />
      <p className="text-xs text-muted">{t('onboarding.incomeReassure')}</p>
    </div>,

    // Step 1: needs
    <div key="needs" className="space-y-5 animate-slide-up">
      <p className="text-muted text-sm">{t('onboarding.needsHint')}</p>
      <div className="space-y-3">
        {NEEDS_FIELDS.map((f) => (
          <Card key={f.key} className="!p-3 flex items-center gap-3" animate={false}>
            <IconCircle icon={f.icon} className={f.color} size={38} iconSize={17} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{f.label}</p>
              {f.hint && <p className="text-xs text-muted truncate">{f.hint}</p>}
            </div>
            <input
              type="number"
              min="0"
              value={needs[f.key]}
              onChange={(e) => setNeeds((n) => ({ ...n, [f.key]: e.target.value }))}
              placeholder="0"
              className="w-24 bg-surface2 border border-border rounded-lg px-2.5 py-2 text-right text-[15px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between bg-surface2 rounded-xl px-4 py-3 border border-border">
        <span className="text-sm text-muted font-medium">{t('onboarding.totalNeeds')}</span>
        <span className="text-lg font-bold font-num">${totalNeeds.toLocaleString('en-US')}</span>
      </div>
    </div>,

    // Step 2: debts
    <div key="debts" className="space-y-5 animate-slide-up">
      <p className="text-muted text-sm">{t('onboarding.debtsHint')}</p>
      <div className="flex gap-3">
        <Button variant={hasDebts === 'yes' ? 'primary' : 'secondary'} onClick={() => setHasDebts('yes')} type="button">{t('common.yes')}</Button>
        <Button variant={hasDebts === 'no' ? 'primary' : 'secondary'} onClick={() => setHasDebts('no')} type="button">{t('common.no')}</Button>
      </div>
      {hasDebts === 'yes' && (
        <div className="space-y-4 mt-2">
          {debts.map((d, i) => (
            <Card key={i} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <IconCircle icon={CreditCard} className="bg-danger/10 text-danger" size={32} iconSize={15} />
                <Input label="" value={d.name} onChange={(e) => updateDebt(i, 'name', e.target.value)} placeholder={t('onboarding.debtName')} className="!py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('onboarding.debtBalance')} type="number" value={d.balance} onChange={(e) => updateDebt(i, 'balance', e.target.value)} />
                <Input label={t('onboarding.debtRate')} type="number" value={d.rate} onChange={(e) => updateDebt(i, 'rate', e.target.value)} />
                <Input label={t('onboarding.debtTerm')} type="number" value={d.termMonths} onChange={(e) => updateDebt(i, 'termMonths', e.target.value)} />
                <Input label={t('onboarding.debtMinPayment')} type="number" value={d.minPayment} onChange={(e) => updateDebt(i, 'minPayment', e.target.value)} />
              </div>
            </Card>
          ))}
          <Button variant="secondary" icon={PlusCircle} type="button" onClick={() => setDebts((ds) => [...ds, { ...emptyDebt }])}>
            {t('onboarding.addDebt')}
          </Button>
        </div>
      )}
    </div>,
  ]

  const canNext = [income !== '', true, hasDebts !== null][step]
  const CurrentIcon = stepMeta[step].icon

  return (
    <div className="flex flex-col min-h-[100svh] px-6 py-8 max-w-app mx-auto w-full">
      <div className="flex gap-1.5 mb-7">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-surface2'}`} />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <IconCircle icon={CurrentIcon} className="bg-primary/10 text-primary" size={44} iconSize={20} />
        <h2 className="text-xl font-semibold font-display leading-tight">{stepMeta[step].title}</h2>
      </div>

      <div className="flex-1">{steps[step]}</div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" icon={ChevronLeft} onClick={() => setStep((s) => s - 1)} type="button" className="!w-auto px-4">
            {t('common.back')}
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} type="button">{t('common.next')}</Button>
        ) : (
          <Button onClick={finish} disabled={saving || hasDebts === null}>{saving ? t('common.saving') : t('common.done')}</Button>
        )}
      </div>
    </div>
  )
}
