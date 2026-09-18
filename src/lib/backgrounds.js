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
    css: 'radial-gradient(ellipse 74% 48% at -8% -8%, #fffdf8, transparent 61%), radial-gradient(ellipse 78% 56% at 108% 12%, #dcc9aa66, transparent 70%), linear-gradient(155deg, #f7f1e8, #e7ddcf 82%)',
    accent: '#f7e8ca',
  },
]
export function getBackground(id) {
  const aliases = { premium: 'default', architecture: 'default', abstract: 'dynamic' }
  return BACKGROUNDS.find((b) => b.id === (aliases[id] || id)) || BACKGROUNDS[0]
}
