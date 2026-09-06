// Maps Plaid's `personal_finance_category` taxonomy onto this app's own
// needs/wants/savings category tree. Best-effort: falls back from the
// "detailed" category to the "primary" category to a generic "other" bucket
// so nothing gets silently dropped, but real accuracy will always be lower
// than a human choosing the category by hand — worth eyeballing after a sync.
const DETAILED_MAP = {
  FOOD_AND_DRINK_COFFEE: { group: 'wants', key: 'coffee' },
  FOOD_AND_DRINK_FAST_FOOD: { group: 'wants', key: 'cafe' },
  FOOD_AND_DRINK_RESTAURANT: { group: 'wants', key: 'cafe' },
  FOOD_AND_DRINK_VENDING_MACHINES: { group: 'wants', key: 'cafe' },
  FOOD_AND_DRINK_GROCERIES: { group: 'needs', key: 'groceries' },

  ENTERTAINMENT_STREAMING_SERVICES: { group: 'wants', key: 'subscriptions' },
  ENTERTAINMENT_MOVIES_AND_DVDS: { group: 'wants', key: 'entertainment' },
  ENTERTAINMENT_MUSIC_AND_AUDIO: { group: 'wants', key: 'entertainment' },
  ENTERTAINMENT_VIDEO_GAMES: { group: 'wants', key: 'entertainment' },
  ENTERTAINMENT_TV_AND_MOVIES: { group: 'wants', key: 'entertainment' },
  ENTERTAINMENT_CASINOS_AND_GAMBLING: { group: 'wants', key: 'entertainment' },

  GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES: { group: 'wants', key: 'clothes' },
  GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES: { group: 'wants', key: 'gifts' },
  GENERAL_MERCHANDISE_SPORTING_GOODS: { group: 'wants', key: 'hobby' },

  PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS: { group: 'wants', key: 'hobby' },

  RENT_AND_UTILITIES_RENT: { group: 'needs', key: 'housing', sub: 'rent' },
  RENT_AND_UTILITIES_GAS_AND_ELECTRICITY: { group: 'needs', key: 'housing', sub: 'utilities' },
  RENT_AND_UTILITIES_WATER: { group: 'needs', key: 'housing', sub: 'utilities' },
  RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT: { group: 'needs', key: 'housing', sub: 'utilities' },
  RENT_AND_UTILITIES_INTERNET_AND_CABLE: { group: 'wants', key: 'subscriptions' },
  RENT_AND_UTILITIES_TELEPHONE: { group: 'wants', key: 'subscriptions' },

  TRANSPORTATION_GAS: { group: 'needs', key: 'transport', sub: 'fuel' },
  TRANSPORTATION_PARKING: { group: 'needs', key: 'transport', sub: 'parking' },
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: { group: 'needs', key: 'transport' },
  TRANSPORTATION_PUBLIC_TRANSIT_AND_TOLLS: { group: 'needs', key: 'transport' },

  LOAN_PAYMENTS_CAR_PAYMENT: { group: 'needs', key: 'transport', sub: 'payment' },
  LOAN_PAYMENTS_CREDIT_CARD_PAYMENT: { group: 'savings', key: 'debt_extra' },
  LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT: { group: 'savings', key: 'debt_extra' },
  LOAN_PAYMENTS_MORTGAGE_PAYMENT: { group: 'needs', key: 'housing', sub: 'rent' },

  MEDICAL_PRIMARY_CARE: { group: 'needs', key: 'health' },
  MEDICAL_DENTAL_CARE: { group: 'needs', key: 'health' },
  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: { group: 'needs', key: 'health', sub: 'medicine' },

  GENERAL_SERVICES_INSURANCE: { group: 'needs', key: 'health', sub: 'insurance' },

  TRANSFER_OUT_SAVINGS: { group: 'savings', key: 'emergency' },
  TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS: { group: 'savings', key: 'investments' },
}

const PRIMARY_MAP = {
  FOOD_AND_DRINK: { group: 'wants', key: 'cafe' },
  ENTERTAINMENT: { group: 'wants', key: 'entertainment' },
  GENERAL_MERCHANDISE: { group: 'wants', key: 'other' },
  RENT_AND_UTILITIES: { group: 'needs', key: 'housing' },
  TRANSPORTATION: { group: 'needs', key: 'transport' },
  LOAN_PAYMENTS: { group: 'savings', key: 'debt_extra' },
  MEDICAL: { group: 'needs', key: 'health' },
  PERSONAL_CARE: { group: 'wants', key: 'other' },
  GENERAL_SERVICES: { group: 'needs', key: 'other' },
  GOVERNMENT_AND_NON_PROFIT: { group: 'needs', key: 'other' },
  TRAVEL: { group: 'wants', key: 'other' },
  BANK_FEES: { group: 'needs', key: 'other' },
}

// A Plaid transaction: positive `amount` = money OUT (an expense), negative = money IN
// (income/refund/transfer in). Returns null for money-in rows — this tracker is
// about spending, not income. Returns {amount, date, comment, group, category_key,
// sub, external_id} ready for db.addTransaction, or null to skip.
export function mapPlaidTransaction(tx) {
  if (!tx || tx.amount === undefined || tx.amount <= 0) return null
  const pfc = tx.personal_finance_category || {}
  const mapped = DETAILED_MAP[pfc.detailed] || PRIMARY_MAP[pfc.primary] || { group: 'wants', key: 'other' }
  return {
    amount: tx.amount,
    date: tx.date,
    comment: tx.merchant_name || tx.name || '',
    group: mapped.group,
    category_key: mapped.key,
    sub: mapped.sub || null,
    external_id: tx.transaction_id,
  }
}
