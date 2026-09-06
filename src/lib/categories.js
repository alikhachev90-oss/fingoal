// 50/30/20 category tree + keyword map for autocomplete & AI-style suggestions.

// Plain-language labels on purpose — no "Needs/Wants" jargon on screen. The
// English 50/30/20 terms still live in the Lessons content, where there's
// room to explain them; everywhere else people should read their own language.
export const GROUP_LABELS = {
  needs: { ru: 'Обязательное', en: 'Needs' },
  wants: { ru: 'Необязательное', en: 'Wants' },
  savings: { ru: 'Накопления', en: 'Savings' },
}

export const GROUP_LABELS_SHORT = GROUP_LABELS

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
    { key: 'housing', label: { ru: 'Жильё', en: 'Housing' }, subs: ['Аренда', 'Коммуналка', 'Ремонт'] },
    { key: 'transport', label: { ru: 'Транспорт', en: 'Transport' }, subs: ['Платёж за авто', 'Топливо', 'Страховка авто', 'Налог на авто', 'Парковка'] },
    { key: 'groceries', label: { ru: 'Продукты', en: 'Groceries' }, subs: [] },
    { key: 'health', label: { ru: 'Здоровье', en: 'Health' }, subs: ['Страховка', 'Лекарства'] },
  ],
  wants: [
    { key: 'cafe', label: { ru: 'Кафе/рестораны', en: 'Cafes/restaurants' }, subs: [] },
    { key: 'coffee', label: { ru: 'Кофе на вынос', en: 'Coffee to go' }, subs: [] },
    { key: 'entertainment', label: { ru: 'Развлечения', en: 'Entertainment' }, subs: [] },
    { key: 'subscriptions', label: { ru: 'Подписки', en: 'Subscriptions' }, subs: [] },
    { key: 'clothes', label: { ru: 'Одежда', en: 'Clothes' }, subs: [] },
    { key: 'gifts', label: { ru: 'Подарки', en: 'Gifts' }, subs: [] },
    { key: 'hobby', label: { ru: 'Хобби', en: 'Hobby' }, subs: [] },
  ],
  savings: [
    { key: 'emergency', label: { ru: 'Подушка безопасности', en: 'Emergency fund' }, subs: [] },
    { key: 'investments', label: { ru: 'Инвестиции', en: 'Investments' }, subs: [] },
    { key: 'debt_extra', label: { ru: 'Допплатежи по долгам', en: 'Extra debt payments' }, subs: [] },
  ],
}

// Resolve a bilingual {ru,en} field (or a plain string, for backward compat) to one language.
export function pickLang(field, lang = 'ru') {
  if (field && typeof field === 'object' && !Array.isArray(field)) return field[lang] || field.ru
  return field
}

export function findCategory(group, key) {
  return CATEGORY_TREE[group]?.find((c) => c.key === key)
}

export function categoryLabel(group, key, lang = 'ru') {
  return pickLang(findCategory(group, key)?.label, lang) || key
}

export function flatCategories(lang = 'ru') {
  const out = []
  for (const group of Object.keys(CATEGORY_TREE)) {
    for (const c of CATEGORY_TREE[group]) {
      out.push({ group, key: c.key, label: pickLang(c.label, lang), subs: c.subs })
    }
  }
  return out
}

// keyword -> { group, key, sub?, explanation }
// `words` covers Russian input, `wordsEn` covers English input — both are checked
// regardless of UI language, since a user may type in either.
const KEYWORD_RULES = [
  { words: ['кофе с собой', 'кофе на вынос', 'старбакс', 'кофейня'], wordsEn: ['coffee to go', 'starbucks', 'coffee shop'], group: 'wants', key: 'coffee', explanation: { ru: 'Кофе на вынос — регулярная необязательная трата, поэтому это Wants, а не Needs (Продукты).', en: 'Coffee to go is a regular discretionary expense, so it\'s Wants, not Needs (Groceries).' } },
  { words: ['кофе'], wordsEn: ['coffee'], group: 'wants', key: 'coffee', explanation: { ru: 'Похоже на кофе навынос — отнесли в Wants → Кофе на вынос. Если это зёрна/кофе домой из магазина — измените на Needs → Продукты.', en: 'Looks like coffee to go — filed under Wants → Coffee to go. If this is beans/coffee for home from the store, change it to Needs → Groceries.' } },
  { words: ['кафе', 'ресторан', 'бар', 'обед вне дома', 'ужин в ресторане', 'фастфуд', 'макдак', 'kfc'], wordsEn: ['cafe', 'restaurant', 'bar', 'dining out', 'fast food', 'mcdonald'], group: 'wants', key: 'cafe', explanation: { ru: 'Еда вне дома — дискреционная трата (Wants), в отличие от покупки продуктов домой.', en: 'Eating out is discretionary (Wants), unlike buying groceries for home.' } },
  { words: ['продукты', 'магазин', 'супермаркет', 'ашан', 'пятерочка', 'перекресток', 'вкусвилл'], wordsEn: ['groceries', 'supermarket', 'grocery store', 'trader joe', 'whole foods'], group: 'needs', key: 'groceries', explanation: { ru: 'Покупка продуктов для дома — обязательная трата (Needs).', en: 'Buying groceries for home is an essential expense (Needs).' } },
  { words: ['аренда', 'квартплата', 'снять квартиру'], wordsEn: ['rent', 'lease'], group: 'needs', key: 'housing', sub: 'Аренда', explanation: { ru: 'Аренда жилья — обязательная трата (Needs → Жильё).', en: 'Rent is an essential expense (Needs → Housing).' } },
  { words: ['коммуналка', 'жкх', 'свет', 'вода счет', 'электричество'], wordsEn: ['utilities', 'electricity bill', 'water bill'], group: 'needs', key: 'housing', sub: 'Коммуналка', explanation: { ru: 'Коммунальные платежи — Needs → Жильё.', en: 'Utility bills — Needs → Housing.' } },
  { words: ['ремонт квартиры', 'ремонт дома'], wordsEn: ['home repair', 'renovation'], group: 'needs', key: 'housing', sub: 'Ремонт', explanation: { ru: 'Ремонт жилья отнесён к Needs → Жильё.', en: 'Home repairs are filed under Needs → Housing.' } },
  { words: ['бензин', 'заправка', 'топливо', 'азс'], wordsEn: ['gas', 'fuel', 'gas station'], group: 'needs', key: 'transport', sub: 'Топливо', explanation: { ru: 'Топливо для машины — обязательная трата (Needs → Транспорт).', en: 'Fuel for the car is an essential expense (Needs → Transport).' } },
  { words: ['такси', 'убер', 'yandex go', 'каршеринг'], wordsEn: ['taxi', 'uber', 'lyft', 'car share'], group: 'needs', key: 'transport', explanation: { ru: 'Поездки на такси отнесли к Needs → Транспорт как транспортные расходы. Если это была развлекательная поездка — можно изменить на Wants → Развлечения.', en: 'Taxi rides are filed under Needs → Transport as a transportation cost. If it was a recreational trip, you can change it to Wants → Entertainment.' } },
  { words: ['страховка авто', 'осаго', 'каско'], wordsEn: ['car insurance', 'auto insurance'], group: 'needs', key: 'transport', sub: 'Страховка авто', explanation: { ru: 'Автостраховка — Needs → Транспорт.', en: 'Car insurance — Needs → Transport.' } },
  { words: ['налог на авто', 'транспортный налог'], wordsEn: ['car tax', 'vehicle tax'], group: 'needs', key: 'transport', sub: 'Налог на авто', explanation: { ru: 'Транспортный налог — Needs → Транспорт.', en: 'Vehicle tax — Needs → Transport.' } },
  { words: ['парковка'], wordsEn: ['parking'], group: 'needs', key: 'transport', sub: 'Парковка', explanation: { ru: 'Парковка — Needs → Транспорт.', en: 'Parking — Needs → Transport.' } },
  { words: ['автоплатеж за авто', 'кредит на машину', 'платеж за авто', 'лизинг авто'], wordsEn: ['car payment', 'auto loan', 'car lease'], group: 'needs', key: 'transport', sub: 'Платёж за авто', explanation: { ru: 'Регулярный платёж за автомобиль — Needs → Транспорт.', en: 'A recurring car payment — Needs → Transport.' } },
  { words: ['лекарств', 'аптека', 'таблетки'], wordsEn: ['medicine', 'pharmacy', 'pills'], group: 'needs', key: 'health', sub: 'Лекарства', explanation: { ru: 'Лекарства — обязательная трата (Needs → Здоровье).', en: 'Medicine is an essential expense (Needs → Health).' } },
  { words: ['медстраховка', 'дмс', 'страховка здоровье'], wordsEn: ['health insurance'], group: 'needs', key: 'health', sub: 'Страховка', explanation: { ru: 'Медстраховка — Needs → Здоровье.', en: 'Health insurance — Needs → Health.' } },
  { words: ['подписк', 'netflix', 'spotify', 'youtube premium', 'подписка'], wordsEn: ['subscription', 'netflix', 'spotify', 'youtube premium'], group: 'wants', key: 'subscriptions', explanation: { ru: 'Подписки на сервисы — необязательная регулярная трата (Wants).', en: 'Service subscriptions are a recurring discretionary expense (Wants).' } },
  { words: ['одежда', 'обувь', 'кроссовки', 'куртка'], wordsEn: ['clothes', 'shoes', 'sneakers', 'jacket'], group: 'wants', key: 'clothes', explanation: { ru: 'Одежда/обувь — дискреционная трата (Wants), если это не рабочая форма.', en: 'Clothes/shoes are discretionary (Wants), unless it\'s a required work uniform.' } },
  { words: ['подарок', 'подарки'], wordsEn: ['gift', 'present'], group: 'wants', key: 'gifts', explanation: { ru: 'Подарки — Wants → Подарки.', en: 'Gifts — Wants → Gifts.' } },
  { words: ['кино', 'концерт', 'театр', 'игры', 'games', 'стим', 'steam'], wordsEn: ['movie', 'concert', 'theater', 'games', 'steam'], group: 'wants', key: 'entertainment', explanation: { ru: 'Развлечения — необязательная трата (Wants).', en: 'Entertainment is a discretionary expense (Wants).' } },
  { words: ['хобби', 'спортзал доп', 'курсы рисования'], wordsEn: ['hobby', 'art class'], group: 'wants', key: 'hobby', explanation: { ru: 'Хобби — Wants → Хобби.', en: 'Hobby — Wants → Hobby.' } },
  { words: ['инвестиц', 'брокер', 'акции', 'облигации', 'etf'], wordsEn: ['invest', 'broker', 'stocks', 'bonds', 'etf'], group: 'savings', key: 'investments', explanation: { ru: 'Это откладывание/инвестирование денег, а не трата — отнесено к Savings → Инвестиции.', en: 'This is setting aside/investing money, not spending — filed under Savings → Investments.' } },
  { words: ['подушка', 'резерв', 'заначка', 'отложил'], wordsEn: ['emergency fund', 'savings buffer'], group: 'savings', key: 'emergency', explanation: { ru: 'Пополнение финансовой подушки — Savings → Подушка безопасности.', en: 'Adding to your emergency fund — Savings → Emergency fund.' } },
  { words: ['допплатеж по кредиту', 'досрочное погашение', 'гашение долга сверху'], wordsEn: ['extra debt payment', 'early payoff'], group: 'savings', key: 'debt_extra', explanation: { ru: 'Дополнительный платёж по долгу сверх минимального — Savings → Допплатежи по долгам.', en: 'An extra payment on a debt beyond the minimum — Savings → Extra debt payments.' } },
]

// Returns ranked suggestions [{group,key,sub,label,explanation,score}] for a free-text query.
export function suggestCategories(query, lang = 'ru') {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results = []

  for (const rule of KEYWORD_RULES) {
    const allWords = [...rule.words, ...(rule.wordsEn || [])]
    for (const w of allWords) {
      if (q.includes(w) || w.includes(q)) {
        const cat = findCategory(rule.group, rule.key)
        const score = q === w ? 3 : q.includes(w) ? 2 : 1
        results.push({
          group: rule.group,
          key: rule.key,
          sub: rule.sub || null,
          label: pickLang(cat?.label, lang) || rule.key,
          groupLabel: pickLang(GROUP_LABELS[rule.group], lang),
          explanation: pickLang(rule.explanation, lang),
          score,
        })
      }
    }
  }

  // Also match directly against category / subcategory labels.
  for (const c of flatCategories(lang)) {
    if (c.label.toLowerCase().includes(q)) {
      results.push({ group: c.group, key: c.key, sub: null, label: c.label, groupLabel: pickLang(GROUP_LABELS[c.group], lang), explanation: null, score: 2 })
    }
    for (const s of c.subs) {
      if (s.toLowerCase().includes(q)) {
        results.push({ group: c.group, key: c.key, sub: s, label: c.label, groupLabel: pickLang(GROUP_LABELS[c.group], lang), explanation: null, score: 2 })
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
