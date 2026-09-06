import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calculator, AlertTriangle, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Card, Button, Input } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { estimateFederalTax, getTaxRecommendations } from '../lib/taxEstimate'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export default function TaxEstimateScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [acked, setAcked] = useState(false)
  const [ackChecked, setAckChecked] = useState(false)
  const [filingStatus, setFilingStatus] = useState('single')
  const [wages, setWages] = useState('')
  const [selfEmployment, setSelfEmployment] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then((s) => {
      setSettings(s)
      if (s?.monthly_income) setWages(String(Math.round(s.monthly_income * 12)))
    })
  }, [user, context])

  function calculate() {
    const w = parseFloat(wages) || 0
    const se = parseFloat(selfEmployment) || 0
    const r = estimateFederalTax({ filingStatus, wages: w, selfEmploymentIncome: se })
    setResult(r)
  }

  const recommendations = result ? getTaxRecommendations(result, { selfEmploymentIncome: parseFloat(selfEmployment) || 0 }, lang) : []

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('tax.title')} subtitle={t('tax.subtitle')} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Link to="/insights" className="text-xs text-primary font-semibold flex items-center gap-1 mb-1">
          <ArrowLeft size={13} /> {t('insights.title')}
        </Link>

        {!acked ? (
          <Card className="!p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-wants/10 text-wants flex items-center justify-center shrink-0">
                <AlertTriangle size={17} strokeWidth={2.25} />
              </div>
              <p className="font-semibold text-sm">{t('tax.disclaimerTitle')}</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">{t('tax.disclaimerBody')}</p>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={ackChecked}
                onChange={(e) => setAckChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>{t('tax.disclaimerCheckbox')}</span>
            </label>
            <Button disabled={!ackChecked} onClick={() => setAcked(true)} type="button">
              {t('tax.disclaimerContinue')}
            </Button>
          </Card>
        ) : (
          <>
            <Card className="!p-4 space-y-3">
              <label className="block">
                <span className="block text-xs text-muted mb-1">{t('tax.filingStatus')}</span>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="single">{t('tax.filingSingle')}</option>
                  <option value="mfj">{t('tax.filingMfj')}</option>
                  <option value="hoh">{t('tax.filingHoh')}</option>
                </select>
              </label>
              <Input
                label={t('tax.wages')}
                type="number"
                value={wages}
                onChange={(e) => setWages(e.target.value)}
                placeholder="0"
              />
              <Input
                label={t('tax.selfEmployment')}
                type="number"
                value={selfEmployment}
                onChange={(e) => setSelfEmployment(e.target.value)}
                placeholder="0"
              />
              <Button icon={Calculator} onClick={calculate} type="button">
                {result ? t('tax.recalculate') : t('tax.calculate')}
              </Button>
            </Card>

            {result && (
              <>
                <Card className="!p-4 space-y-1 bg-primary/5 !border-l-[3px] !border-l-primary">
                  <p className="text-xs text-muted font-medium uppercase tracking-wide">{t('tax.totalTax')}</p>
                  <p className="text-2xl font-bold font-num text-primary">{fmt(result.totalTax)}</p>
                  <p className="text-xs text-muted">{t('tax.effectiveRate', { pct: result.effectiveRate.toFixed(1) })}</p>
                </Card>

                <Card className="!p-4 space-y-2">
                  <p className="text-sm font-semibold">{t('tax.breakdownTitle')}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t('tax.incomeTaxLine', { std: result.stdDeduction.toLocaleString('en-US') })}</span>
                    <span className="font-semibold">{fmt(result.incomeTax)}</span>
                  </div>
                  {result.seTax > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">{t('tax.seTaxLine')}</span>
                      <span className="font-semibold">{fmt(result.seTax)}</span>
                    </div>
                  )}
                  {result.additionalMedicareTax > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">{t('tax.addlMedicareLine')}</span>
                      <span className="font-semibold">{fmt(result.additionalMedicareTax)}</span>
                    </div>
                  )}
                  {result.quarterlyPayment !== null && (
                    <p className="text-xs text-text bg-wants/10 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                      {t('tax.quarterlyNote', { amt: fmt(result.quarterlyPayment) })}
                    </p>
                  )}
                </Card>

                {recommendations.length > 0 && (
                  <Card className="!p-4 space-y-2.5">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles size={15} className="text-primary" /> {t('tax.recommendationsTitle')}
                    </p>
                    {recommendations.map((r, i) => (
                      <p key={i} className="text-sm text-muted leading-relaxed">🤖 {r}</p>
                    ))}
                  </Card>
                )}
              </>
            )}

            <p className="text-[11px] text-muted leading-relaxed pt-1">{t('tax.footerDisclaimer')}</p>
          </>
        )}
      </div>
    </div>
  )
}
