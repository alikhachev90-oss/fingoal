// Educational US federal tax estimator — NOT tax preparation, NOT filing, NOT
// personalized advice. Figures are the official 2026 IRS federal brackets and
// standard deductions (Tax Foundation, citing IRS Rev. Proc. 2025-32) and the
// 2026 Social Security wage base. This deliberately stops at "rough estimate +
// generic educational pointers" — anything closer to an actual return needs a
// licensed preparer or a real tax-engine integration, not this file.

export const STANDARD_DEDUCTION_2026 = { single: 16100, mfj: 32200, hoh: 24150 }

export const FEDERAL_BRACKETS_2026 = {
  single: [
    { upTo: 12400, rate: 0.10 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  mfj: [
    { upTo: 24800, rate: 0.10 },
    { upTo: 100800, rate: 0.12 },
    { upTo: 211400, rate: 0.22 },
    { upTo: 403550, rate: 0.24 },
    { upTo: 512450, rate: 0.32 },
    { upTo: 768700, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  hoh: [
    { upTo: 17700, rate: 0.10 },
    { upTo: 67450, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256200, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
}

export const SS_WAGE_BASE_2026 = 184500
export const ADDITIONAL_MEDICARE_THRESHOLD = { single: 200000, mfj: 250000, hoh: 200000 }

function computeBracketTax(taxableIncome, brackets) {
  let tax = 0
  let prevCap = 0
  for (const b of brackets) {
    if (taxableIncome <= prevCap) break
    const amountInBracket = Math.min(taxableIncome, b.upTo) - prevCap
    tax += amountInBracket * b.rate
    prevCap = b.upTo
  }
  return tax
}

// wages: W-2 wages. selfEmploymentIncome: net business profit (Schedule C style,
// already after business expenses). Ignores state tax, credits, itemizing,
// filing-status nuances beyond the three supported statuses — a rough estimate.
export function estimateFederalTax({ filingStatus = 'single', wages = 0, selfEmploymentIncome = 0 }) {
  const status = FEDERAL_BRACKETS_2026[filingStatus] ? filingStatus : 'single'
  const brackets = FEDERAL_BRACKETS_2026[status]
  const stdDeduction = STANDARD_DEDUCTION_2026[status]

  const seIncome = Math.max(0, selfEmploymentIncome)
  const netSE = seIncome * 0.9235
  const ssPortion = Math.min(netSE, SS_WAGE_BASE_2026) * 0.124
  const medicarePortion = netSE * 0.029
  const seTax = ssPortion + medicarePortion
  const seTaxDeduction = seTax / 2

  const grossIncome = Math.max(0, wages) + seIncome
  const agi = Math.max(0, grossIncome - seTaxDeduction)
  const taxableIncome = Math.max(0, agi - stdDeduction)
  const incomeTax = computeBracketTax(taxableIncome, brackets)

  const medicareThreshold = ADDITIONAL_MEDICARE_THRESHOLD[status]
  const additionalMedicareTax = Math.max(0, grossIncome - medicareThreshold) * 0.009

  const totalTax = incomeTax + seTax + additionalMedicareTax
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0
  const quarterlyPayment = seIncome > 0 ? totalTax / 4 : null

  return {
    filingStatus: status,
    stdDeduction,
    grossIncome,
    agi,
    taxableIncome,
    incomeTax,
    seTax,
    additionalMedicareTax,
    totalTax,
    effectiveRate,
    quarterlyPayment,
  }
}

export function getTaxRecommendations(result, { selfEmploymentIncome = 0 }, lang = 'ru') {
  const en = lang === 'en'
  const fmt = (n) => '$' + Math.round(n || 0).toLocaleString('en-US')
  const recs = []

  if (selfEmploymentIncome > 0) {
    recs.push(
      en
        ? `As self-employed, the IRS generally expects quarterly estimated payments (Apr 15, Jun 15, Sep 15, and Jan 15 of the following year) rather than one lump sum — paying only at filing time can trigger an underpayment penalty. Rough amount per quarter: ${fmt(result.quarterlyPayment)}.`
        : `Как self-employed, IRS обычно ожидает квартальные авансовые платежи (15 апреля, 15 июня, 15 сентября и 15 января следующего года), а не один платёж в конце года — иначе возможен штраф за недоплату. Ориентир на квартал: ${fmt(result.quarterlyPayment)}.`,
    )
    recs.push(
      en
        ? "A SEP-IRA or Solo 401(k) can shelter a meaningful share of self-employment profit from income tax — worth modeling with a CPA before year-end, especially if profit is trending up."
        : "SEP-IRA или Solo 401(k) позволяют увести существенную часть прибыли self-employment от подоходного налога — стоит просчитать с бухгалтером до конца года, особенно если прибыль растёт.",
    )
  }

  if (result.seTax > 0) {
    recs.push(
      en
        ? "Every documented, deductible business expense lowers both income tax and self-employment tax at once — keeping receipts and mileage logs current through the year beats reconstructing them in April."
        : "Каждый документированный бизнес-расход снижает сразу и подоходный налог, и self-employment tax — веди чеки и учёт пробега по ходу года, а не восстанавливай их в апреле.",
    )
  }

  if (result.additionalMedicareTax > 0) {
    recs.push(
      en
        ? "Income is above the Additional Medicare Tax threshold — an extra 0.9% applies on the excess. Check that enough is being withheld or set aside so it isn't a surprise at filing time."
        : "Доход выше порога Additional Medicare Tax — на превышение начисляется ещё 0.9%. Проверь, откладывается ли эта сумма заранее, чтобы не столкнуться с сюрпризом при подаче.",
    )
  }

  if (result.taxableIncome === 0) {
    recs.push(
      en
        ? "Taxable income comes out to zero at the standard deduction — double-check the numbers above reflect your full-year income, not just what's logged so far."
        : "При стандартном вычете налогооблагаемый доход выходит в ноль — проверь, что цифры выше отражают доход за весь год, а не только то, что уже внесено в приложение.",
    )
  }

  return recs
}
