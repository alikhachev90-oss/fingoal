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
    label: { ru: 'Слоновая кость', en: 'Ivory', es: 'Marfil', fr: 'Ivoire' },
    css: 'radial-gradient(ellipse 72% 44% at -8% -8%, #e7d1a344, transparent 67%), radial-gradient(ellipse 66% 46% at 108% 12%, #f7ead122, transparent 72%), linear-gradient(155deg, #24211b, #100f0d 74%)',
    accent: '#e7d1a3',
  },
]
export function getBackground(id) {
  const aliases = { premium: 'default', architecture: 'default', abstract: 'dynamic' }
  return BACKGROUNDS.find((b) => b.id === (aliases[id] || id)) || BACKGROUNDS[0]
}
