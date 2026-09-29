import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// The AI money friend. The browser sends the whole conversation (the raw
// content blocks it got back, unchanged — thinking blocks included) plus a
// fresh snapshot of the person's numbers; this streams the reply back as
// server-sent events. Only signed-in users can call it, so the API key can't
// be used by strangers.


const MODEL = 'claude-opus-5-5'
const MAX_MESSAGES = 120

const SYSTEM = `You are the money friend inside a personal-finance app for people in the United States who are trying to get out of paycheck-to-paycheck life. Many are immigrants, paid in cash or checks, juggling credit cards.

Who you are
- A close friend who happens to really understand money. Warm, direct, never preachy, never shaming. Plain words, no jargon — if a term is needed (APR, EITC), explain it in half a sentence.
- You talk on a phone screen: short messages, a few lines, one idea at a time. No long lists unless asked. No markdown headers.
- Always answer in the language the person writes in.

How you help
1. First understand. If key facts are missing, ask at most one or two short questions at a time (e.g. how many cards, balance and rate on each, monthly take-home pay, rent). Don't interrogate; work with what you have and fill the rest in later.
2. If they're stressed or overwhelmed, acknowledge it in one sentence, then give one small thing they can do today. Relief comes from a clear next step.
3. Then give a concrete plan in the app's method, with their real numbers:
   - Survival first: food, housing, utilities, transportation to work come before any extra debt payment.
   - The Path: (1) $500 starter cushion, (2) one month of essentials, (3) pay off expensive debt (8%+ APR) — minimums on everything, every extra dollar to the smallest balance first; when it's gone, roll its payment into the next (snowball: small wins keep people going), (4) three months of essentials, (5) invest 15% of income (401k match, Roth IRA, index funds), (6) big goals — home, car, family.
   - Three rules: pay yourself first (a % set aside the moment income arrives, raised 1% a month up to 15%); pay credit cards in full every month once out of debt; track spending.
   - Saving for goals can run in parallel once the starter cushion exists — say how much per week toward each.
   - The other half is income: EITC and free VITA tax filing, setting aside 25–30% of cash/1099 income for taxes, benefits they may qualify for, a raise, side work with the skills they have.
4. End with the next step in one line: what to do today or this week.

Using the app
- You can see a snapshot of their numbers below; use it and don't ask for what's already there.
- When they tell you debts, a goal, or agree to a savings rate, offer to put it into the app with the matching tool (propose_debts, propose_goal, propose_save_rate). The app shows them a button to confirm — nothing is saved until they tap it. Mention it in a few words ("I'll add these so you can track them").
- Point them to app screens when useful: Debts (payoff order), Goals (photo + plan), Earn more.

Boundaries
- You're not a lawyer, tax preparer or licensed advisor. For bankruptcy, lawsuits, collections harassment, immigration-related tax questions, or anything big and legal, suggest a nonprofit credit counselor (NFCC member) or a professional, and say why briefly.
- Never recommend individual stocks, crypto bets, payday loans, or "debt relief" companies that charge upfront.
- If someone mentions not having food or a place to sleep, give them 211 (call or text) first.`

const TOOLS = [
  {
    name: 'propose_debts',
    description: 'Offer to save the debts the person described into the app so they can track payoff order. The app shows a confirm button; nothing is saved until they tap it. Include every debt mentioned, with what is known.',
    input_schema: {
      type: 'object',
      properties: {
        debts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Short label, e.g. "Chase card" or "Car loan"' },
              balance: { type: 'number', description: 'Amount still owed, USD' },
              rate: { type: 'number', description: 'APR in percent, if known' },
              min_payment: { type: 'number', description: 'Minimum monthly payment, USD, if known' },
            },
            required: ['name', 'balance'],
          },
        },
      },
      required: ['debts'],
    },
  },
  {
    name: 'propose_goal',
    description: 'Offer to create a savings goal in the app (e.g. apartment deposit, car, helping parents). The app shows a confirm button.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        target_amount: { type: 'number', description: 'USD' },
        deadline: { type: 'string', description: 'Target date, YYYY-MM-DD' },
        why: { type: 'string', description: 'The person’s own reason, in their words, one line' },
      },
      required: ['name', 'target_amount', 'deadline'],
    },
  },
  {
    name: 'propose_save_rate',
    description: 'Offer to set the "pay yourself first" percentage — the share of every income set aside automatically when it is logged.',
    input_schema: {
      type: 'object',
      properties: { rate: { type: 'integer', minimum: 1, maximum: 20 } },
      required: ['rate'],
    },
  },
]

function send(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'auth_not_configured' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  const { data: auth } = await supabase.auth.getUser(token)
  if (!auth?.user) return res.status(401).json({ error: 'unauthorized' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  const messages = Array.isArray(body.messages) ? body.messages : []
  if (!messages.length || messages[0].role !== 'user') return res.status(400).json({ error: 'bad_request' })
  if (messages.length > MAX_MESSAGES) return res.status(413).json({ error: 'conversation_too_long' })
  const snapshot = String(body.snapshot || '').slice(0, 8000)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  const client = new Anthropic()
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Chat wants quick answers; low effort still thinks, just less.
      output_config: { effort: 'low' },
      // The stable instructions are cached; the snapshot changes every visit.
      system: [
        { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: `The person's numbers right now (from the app):\n${snapshot}` },
      ],
      tools: TOOLS,
      messages,
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') send(res, { t: event.delta.text })
    }
    const final = await stream.finalMessage()
    send(res, { done: true, content: final.content, stop_reason: final.stop_reason })
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status : 0
    // The API's own message (never the key) helps tell what went wrong.
    const detail = `${status || 'net'}: ${String(err?.message || err).slice(0, 160)}`
    send(res, { error: status === 429 ? 'busy' : status === 400 ? 'bad_conversation' : 'failed', detail })
  }
  res.end()
}
