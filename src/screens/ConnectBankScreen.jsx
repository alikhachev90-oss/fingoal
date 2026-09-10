import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { ArrowLeft, Landmark, Lock, Copy, RefreshCw, Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Card, Button, Input } from '../components/UI'
import { useApp } from '../context/AppContext'
import { createLinkToken, exchangePublicToken, syncPlaidTransactions } from '../lib/plaidSync'

const PIN_STORAGE_KEY = 'fintera_owner_pin'

export default function ConnectBankScreen() {
  const { user, context } = useApp()
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_STORAGE_KEY) || '')
  const [rememberPin, setRememberPin] = useState(true)
  const [linkToken, setLinkToken] = useState(null)
  const [error, setError] = useState(null)
  const [exchangeResult, setExchangeResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  useEffect(() => {
    if (rememberPin && pin) localStorage.setItem(PIN_STORAGE_KEY, pin)
  }, [pin, rememberPin])

  async function handleGetLinkToken() {
    setError(null)
    try {
      const token = await createLinkToken(pin)
      setLinkToken(token)
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  const onSuccess = useCallback(
    async (publicToken) => {
      setError(null)
      try {
        const result = await exchangePublicToken(pin, publicToken)
        setExchangeResult(result)
      } catch (e) {
        setError(String(e.message || e))
      }
    },
    [pin],
  )

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess })

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  async function handleCopy() {
    await navigator.clipboard.writeText(exchangeResult.access_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSync() {
    setError(null)
    setSyncing(true)
    try {
      const result = await syncPlaidTransactions(user.id, context, pin)
      setSyncResult(result)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="screen-connectbank flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title="Привязать банк (бета)" subtitle="Только для владельца — скрыто от остальных" />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Link to="/insights" className="text-xs text-primary font-semibold flex items-center gap-1 mb-1">
          <ArrowLeft size={13} /> Инсайты
        </Link>

        <Card className="!p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock size={16} strokeWidth={2.25} />
            </div>
            <p className="font-semibold text-sm">Owner PIN</p>
          </div>
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Секрет из переменной OWNER_PIN на Vercel"
          />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={rememberPin} onChange={(e) => setRememberPin(e.target.checked)} />
            Запомнить на этом устройстве
          </label>
        </Card>

        {error && (
          <Card className="!p-3 bg-wants/10 !border-l-[3px] !border-l-wants">
            <p className="text-xs text-wants font-medium">{error}</p>
          </Card>
        )}

        {!exchangeResult ? (
          <Card className="!p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Landmark size={16} strokeWidth={2.25} />
              </div>
              <p className="font-semibold text-sm">Шаг 1 — привязать счёт через Plaid</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Откроется окно Plaid Link — выбираешь банк, входишь как обычно (Plaid не передаёт нам пароль от банка).
              После успешного входа здесь появится access token.
            </p>
            <Button disabled={!pin} onClick={handleGetLinkToken} type="button">
              Начать привязку
            </Button>
          </Card>
        ) : (
          <Card className="!p-4 space-y-3">
            <p className="font-semibold text-sm">Шаг 2 — сохрани access token</p>
            <p className="text-xs text-muted leading-relaxed">
              Это единственный раз, когда токен показывается. Скопируй и добавь в Vercel → Project → Settings →
              Environment Variables как <code className="bg-surface2 px-1 rounded">PLAID_ACCESS_TOKEN</code>, затем
              сделай redeploy.
            </p>
            <div className="bg-surface2 border border-border rounded-lg p-2.5 text-[11px] font-mono break-all">
              {exchangeResult.access_token}
            </div>
            <Button variant="secondary" icon={copied ? Check : Copy} onClick={handleCopy} type="button">
              {copied ? 'Скопировано' : 'Скопировать токен'}
            </Button>
          </Card>
        )}

        <Card className="!p-4 space-y-3">
          <p className="font-semibold text-sm">Шаг 3 — синхронизировать транзакции</p>
          <p className="text-xs text-muted leading-relaxed">
            Работает после того, как PLAID_ACCESS_TOKEN сохранён на Vercel и сайт пересобрался. Тянет новые операции
            и раскладывает их по Needs/Wants/Savings автоматически (можно поправить вручную в списке трат).
          </p>
          <Button disabled={!pin || syncing} icon={RefreshCw} onClick={handleSync} type="button">
            {syncing ? 'Синхронизирую…' : 'Синхронизировать'}
          </Button>
          {syncResult && (
            <p className="text-xs text-savings font-medium">
              Импортировано новых операций: {syncResult.importedCount}
              {syncResult.skippedCount > 0 ? ` (пропущено ${syncResult.skippedCount} — доход/переводы)` : ''}
            </p>
          )}
        </Card>

        <p className="text-[11px] text-muted leading-relaxed pt-1">
          Это тестовая привязка только твоего счёта — кнопки нет в общем интерфейсе, доступ защищён PIN-кодом на
          сервере, так что друзья, даже зная ссылку, ничего своего привязать не смогут.
        </p>
      </div>
    </div>
  )
}
