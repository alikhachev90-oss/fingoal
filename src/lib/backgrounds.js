// Stable IDs preserve previously saved appearance preferences.
export const BACKGROUNDS = [
  {
    id: 'default',
    label: { ru: 'Графит', en: 'Graphite', es: 'Grafito', fr: 'Graphite' },
    css: 'radial-gradient(ellipse at 20% 0%, #40504d, transparent 58%), linear-gradient(145deg, #26302f, #0d1212 72%)',
    accent: '#d7e6e1',
  },
  {
    id: 'nature',
    label: { ru: 'Розовый кварц', en: 'Rose Quartz', es: 'Cuarzo rosa', fr: 'Quartz rose' },
    css: 'radial-gradient(ellipse 70% 42% at 105% -4%, #9c536f55, transparent 72%), radial-gradient(ellipse 56% 38% at -8% 68%, #dca5b522, transparent 74%), linear-gradient(155deg, #251b22, #100d12 70%)',
    accent: '#e8a1b6',
  },
  {
    id: 'dynamic',
    label: { ru: 'Жидкая медь', en: 'Liquid Copper', es: 'Cobre líquido', fr: 'Cuivre liquide' },
    css: 'radial-gradient(ellipse 74% 46% at 108% -6%, #c96f434d, transparent 70%), radial-gradient(ellipse 58% 40% at -8% 66%, #f0a06b20, transparent 74%), linear-gradient(155deg, #251713, #100d0c 74%)',
    accent: '#df8b58',
  },
]
export function getBackground(id) {
  const aliases = { premium: 'default', architecture: 'default', abstract: 'dynamic' }
  return BACKGROUNDS.find((b) => b.id === (aliases[id] || id)) || BACKGROUNDS[0]
}
