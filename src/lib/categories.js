// 50/30/20 category tree + keyword map for autocomplete & AI-style suggestions.

// Plain-Russian labels on purpose — no "Needs/Wants" jargon on screen. The
// English 50/30/20 terms still live in the Lessons content, where there's
// room to explain them; everywhere else people should read their own language.
export const GROUP_LABELS = {
  needs: 'Обязательное',
  wants: 'Необязательное',
  savings: 'Накопления',
}

export const GROUP_LABELS_SHORT = {
  needs: 'Обязательное',
  wants: 'Необязательное',
  savings: 'Накопления',
}

export const GROUP_COLORS = {
  needs: 'needs',
  wants: 'wants',
  savings: 'savings',
}

// Static Tailwind class strings — must NOT be built dynamically (bg-${x}/10),
// Tailwind's JIT scanner only picks up literal class names.
export const GROUP_PILL_CLASSES = {
  needs: 'bg-needs/10 text-needs',
  wants: 'bg-wants/10 text-wants',
  savings: 'bg-savings/10 text-savings',
}

export const CATEGORY_TREE = {
  needs: [
    { key: 'housing', label: 'Жильё', subs: ['Аренда', 'Коммуналка', 'Ремонт'] },
    { key: 'transport', label: 'Транспорт', subs: ['Платёж за авто', 'Топливо', 'Страховка авто', 'Налог на авто', 'Парковка'] },
    { key: 'groceries', label: 'Продукты', subs: [] },
    { key: 'health', label: 'Здоровье', subs: ['Страховка', 'Лекарства'] },
  ],
  wants: [
    { key: 'cafe', label: 'Кафе/рестораны', subs: [] },
    { key: 'coffee', label: 'Кофе на вынос', subs: [] },
    { key: 'entertainment', label: 'Развлечения', subs: [] },
    { key: 'subscriptions', label: 'Подписки', subs: [] },
    { key: 'clothes', label: 'Одежда', subs: [] },
    { key: 'gifts', label: 'Подарки', subs: [] },
    { key: 'hobby', label: 'Хобби', subs: [] },
  ],
  savings: [
    { key: 'emergency', label: 'Подушка безопасности', subs: [] },
    { key: 'investments', label: 'Инвестиции', subs: [] },
    { key: 'debt_extra', label: 'Допплатежи по долгам', subs: [] },
  ],
}

export function findCategory(group, key) {
  return CATEGORY_TREE[group]?.find((c) => c.key === key)
}

export function flatCategories() {
  const out = []
  for (const group of Object.keys(CATEGORY_TREE)) {
    for (const c of CATEGORY_TREE[group]) {
      out.push({ group, key: c.key, label: c.label, subs: c.subs })
    }
  }
  return out
}

// keyword -> { group, key, sub?, explanation }
const KEYWORD_RULES = [
  { words: ['кофе с собой', 'кофе на вынос', 'старбакс', 'кофейня'], group: 'wants', key: 'coffee', explanation: 'Кофе на вынос — регулярная необязательная трата, поэтому это Wants, а не Needs (Продукты).' },
  { words: ['кофе'], group: 'wants', key: 'coffee', explanation: 'Похоже на кофе навынос — отнесли в Wants → Кофе на вынос. Если это зёрна/кофе домой из магазина — измените на Needs → Продукты.' },
  { words: ['кафе', 'ресторан', 'бар', 'обед вне дома', 'ужин в ресторане', 'фастфуд', 'макдак', 'kfc'], group: 'wants', key: 'cafe', explanation: 'Еда вне дома — дискреционная трата (Wants), в отличие от покупки продуктов домой.' },
  { words: ['продукты', 'магазин', 'супермаркет', 'ашан', 'пятерочка', 'перекресток', 'вкусвилл'], group: 'needs', key: 'groceries', explanation: 'Покупка продуктов для дома — обязательная трата (Needs).' },
  { words: ['аренда', 'квартплата', 'снять квартиру'], group: 'needs', key: 'housing', sub: 'Аренда', explanation: 'Аренда жилья — обязательная трата (Needs → Жильё).' },
  { words: ['коммуналка', 'жкх', 'свет', 'вода счет', 'электричество'], group: 'needs', key: 'housing', sub: 'Коммуналка', explanation: 'Коммунальные платежи — Needs → Жильё.' },
  { words: ['ремонт квартиры', 'ремонт дома'], group: 'needs', key: 'housing', sub: 'Ремонт', explanation: 'Ремонт жилья отнесён к Needs → Жильё.' },
  { words: ['бензин', 'заправка', 'топливо', 'азс'], group: 'needs', key: 'transport', sub: 'Топливо', explanation: 'Топливо для машины — обязательная трата (Needs → Транспорт).' },
  { words: ['такси', 'убер', 'yandex go', 'каршеринг'], group: 'needs', key: 'transport', explanation: 'Поездки на такси отнесли к Needs → Транспорт как транспортные расходы. Если это была развлекательная поездка — можно изменить на Wants → Развлечения.' },
  { words: ['страховка авто', 'осаго', 'каско'], group: 'needs', key: 'transport', sub: 'Страховка авто', explanation: 'Автостраховка — Needs → Транспорт.' },
  { words: ['налог на авто', 'транспортный налог'], group: 'needs', key: 'transport', sub: 'Налог на авто', explanation: 'Транспортный налог — Needs → Транспорт.' },
  { words: ['парковка'], group: 'needs', key: 'transport', sub: 'Парковка', explanation: 'Парковка — Needs → Транспорт.' },
  { words: ['автоплатеж за авто', 'кредит на машину', 'платеж за авто', 'лизинг авто'], group: 'needs', key: 'transport', sub: 'Платёж за авто', explanation: 'Регулярный платёж за автомобиль — Needs → Транспорт.' },
  { words: ['лекарств', 'аптека', 'таблетки'], group: 'needs', key: 'health', sub: 'Лекарства', explanation: 'Лекарства — обязательная трата (Needs → Здоровье).' },
  { words: ['медстраховка', 'дмс', 'страховка здоровье'], group: 'needs', key: 'health', sub: 'Страховка', explanation: 'Медстраховка — Needs → Здоровье.' },
  { words: ['подписк', 'netflix', 'spotify', 'youtube premium', 'подписка'], group: 'wants', key: 'subscriptions', explanation: 'Подписки на сервисы — необязательная регулярная трата (Wants).' },
  { words: ['одежда', 'обувь', 'кроссовки', 'куртка'], group: 'wants', key: 'clothes', explanation: 'Одежда/обувь — дискреционная трата (Wants), если это не рабочая форма.' },
  { words: ['подарок', 'подарки'], group: 'wants', key: 'gifts', explanation: 'Подарки — Wants → Подарки.' },
  { words: ['кино', 'концерт', 'театр', 'игры', 'games', 'стим', 'steam'], group: 'wants', key: 'entertainment', explanation: 'Развлечения — необязательная трата (Wants).' },
  { words: ['хобби', 'спортзал доп', 'курсы рисования'], group: 'wants', key: 'hobby', explanation: 'Хобби — Wants → Хобби.' },
  { words: ['инвестиц', 'брокер', 'акции', 'облигации', 'etf'], group: 'savings', key: 'investments', explanation: 'Это откладывание/инвестирование денег, а не трата — отнесено к Savings → Инвестиции.' },
  { words: ['подушка', 'резерв', 'заначка', 'отложил'], group: 'savings', key: 'emergency', explanation: 'Пополнение финансовой подушки — Savings → Подушка безопасности.' },
  { words: ['допплатеж по кредиту', 'досрочное погашение', 'гашение долга сверху'], group: 'savings', key: 'debt_extra', explanation: 'Дополнительный платёж по долгу сверх минимального — Savings → Допплатежи по долгам.' },
]

// Returns ranked suggestions [{group,key,sub,label,explanation,score}] for a free-text query.
export function suggestCategories(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results = []

  for (const rule of KEYWORD_RULES) {
    for (const w of rule.words) {
      if (q.includes(w) || w.includes(q)) {
        const cat = findCategory(rule.group, rule.key)
        const score = q === w ? 3 : q.includes(w) ? 2 : 1
        results.push({
          group: rule.group,
          key: rule.key,
          sub: rule.sub || null,
          label: cat?.label || rule.key,
          groupLabel: GROUP_LABELS[rule.group],
          explanation: rule.explanation,
          score,
        })
      }
    }
  }

  // Also match directly against category / subcategory labels.
  for (const c of flatCategories()) {
    if (c.label.toLowerCase().includes(q)) {
      results.push({ group: c.group, key: c.key, sub: null, label: c.label, groupLabel: GROUP_LABELS[c.group], explanation: null, score: 2 })
    }
    for (const s of c.subs) {
      if (s.toLowerCase().includes(q)) {
        results.push({ group: c.group, key: c.key, sub: s, label: c.label, groupLabel: GROUP_LABELS[c.group], explanation: null, score: 2 })
      }
    }
  }

  const seen = new Set()
  const deduped = []
  for (const r of results.sort((a, b) => b.score - a.score)) {
    const id = `${r.group}:${r.key}:${r.sub || ''}`
    if (!seen.has(id)) {
      seen.add(id)
      deduped.push(r)
    }
  }
  return deduped.slice(0, 5)
}
