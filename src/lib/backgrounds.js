// Curated backdrops for the "personal space" ambient layer behind every
// glass card (see .app-ambient in index.css). Deliberately CSS-only —
// gradients, not photos — so a choice here is instant, needs no network,
// no storage, and never breaks the load. `css` is applied as the ambient
// layer's background (and reused verbatim for the swatch preview in
// Settings), `dark` overrides it for dark mode where a preset needs a
// different balance to keep glass legible.

export const BACKGROUNDS = [
  {
    id: 'default',
    category: { ru: 'Минимал', en: 'Minimal', es: 'Mínimo', fr: 'Minimal' },
    label: { ru: 'Тихий свет', en: 'Quiet light', es: 'Luz suave', fr: 'Lumière douce' },
    css: `radial-gradient(ellipse 60% 40% at 18% -8%, rgb(52 211 153 / 0.11), transparent 60%),
          radial-gradient(ellipse 55% 45% at 88% 8%, rgb(92 138 172 / 0.10), transparent 55%),
          radial-gradient(ellipse 70% 50% at 50% 110%, rgb(52 211 153 / 0.06), transparent 60%)`,
  },
  {
    id: 'dynamic',
    category: { ru: 'Кинематик', en: 'Dynamic', es: 'Dinámico', fr: 'Dynamique' },
    label: { ru: 'Восход', en: 'Daybreak', es: 'Amanecer', fr: 'Aube' },
    css: `radial-gradient(ellipse 70% 55% at 15% -10%, rgb(52 211 153 / 0.20), transparent 55%),
          radial-gradient(ellipse 65% 60% at 100% 20%, rgb(73 159 202 / 0.18), transparent 55%),
          radial-gradient(ellipse 80% 60% at 50% 120%, rgb(120 165 214 / 0.14), transparent 60%)`,
  },
  {
    id: 'nature',
    category: { ru: 'Природа', en: 'Nature', es: 'Naturaleza', fr: 'Nature' },
    label: { ru: 'Лесной полог', en: 'Canopy', es: 'Dosel', fr: 'Canopée' },
    css: `radial-gradient(ellipse 75% 55% at 20% -10%, rgb(52 211 153 / 0.19), transparent 58%),
          radial-gradient(ellipse 60% 50% at 90% 30%, rgb(23 110 82 / 0.18), transparent 55%),
          radial-gradient(ellipse 70% 60% at 50% 115%, rgb(83 128 158 / 0.08), transparent 60%)`,
  },
  {
    id: 'architecture',
    category: { ru: 'Архитектура', en: 'Architecture', es: 'Arquitectura', fr: 'Architecture' },
    label: { ru: 'Стекло и сталь', en: 'Glass and steel', es: 'Vidrio y acero', fr: 'Verre et acier' },
    css: `linear-gradient(155deg, rgb(96 145 186 / 0.14) 0%, transparent 45%),
          radial-gradient(ellipse 60% 45% at 85% 0%, rgb(139 159 165 / 0.10), transparent 55%),
          radial-gradient(ellipse 70% 50% at 10% 100%, rgb(52 211 153 / 0.08), transparent 60%)`,
  },
  {
    id: 'abstract',
    category: { ru: 'Абстракция', en: 'Abstract', es: 'Abstracto', fr: 'Abstrait' },
    label: { ru: 'Смешение', en: 'Blend', es: 'Mezcla', fr: 'Fusion' },
    css: `conic-gradient(from 200deg at 20% 0%, rgb(52 211 153 / 0.16), rgb(72 132 187 / 0.14), transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 100%, rgb(120 165 214 / 0.14), transparent 55%)`,
  },
  {
    id: 'seasonal',
    category: { ru: 'Сезон', en: 'Seasonal', es: 'Estacional', fr: 'Saisonnier' },
    label: { ru: 'Позднее лето', en: 'Late summer', es: 'Verano tardío', fr: 'Fin d’été' },
    css: `radial-gradient(ellipse 70% 55% at 12% -8%, rgb(79 144 182 / 0.14), transparent 55%),
          radial-gradient(ellipse 60% 50% at 92% 15%, rgb(52 211 153 / 0.15), transparent 55%),
          radial-gradient(ellipse 70% 55% at 50% 115%, rgb(82 110 145 / 0.08), transparent 60%)`,
  },
  {
    id: 'premium',
    category: { ru: 'Премиум', en: 'Premium', es: 'Premium', fr: 'Premium' },
    label: { ru: 'Частный клуб', en: 'Private club', es: 'Club privado', fr: 'Club privé' },
    css: `linear-gradient(135deg, rgb(52 211 153 / 0.16) 0%, transparent 35%),
          linear-gradient(315deg, rgb(92 135 170 / 0.12) 0%, transparent 40%),
          radial-gradient(ellipse 90% 70% at 50% 50%, transparent 40%, rgb(0 0 0 / 0.18))`,
  },
]

export function getBackground(id) {
  return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0]
}
