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
    label: { ru: 'Аметист', en: 'Amethyst', es: 'Amatista', fr: 'Améthyste' },
    css: 'radial-gradient(ellipse at 12% 0%, #ffffff, transparent 44%), radial-gradient(ellipse at 85% 80%, #c8a7e5, transparent 62%), linear-gradient(145deg, #f2eafd, #4d286f 84%)',
    accent: '#ece0ff',
  },
]
export function getBackground(id) {
  const aliases = { premium: 'default', architecture: 'default', abstract: 'dynamic' }
  return BACKGROUNDS.find((b) => b.id === (aliases[id] || id)) || BACKGROUNDS[0]
}
