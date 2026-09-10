// Stable IDs preserve previously saved appearance preferences.
export const BACKGROUNDS = [
  { id: 'default', label: { ru: 'Графит', en: 'Graphite', es: 'Grafito', fr: 'Graphite' }, css: 'linear-gradient(135deg, #434141, #18191e 65%)', accent: '#e2bd79' },
  { id: 'nature', label: { ru: 'Изумруд', en: 'Emerald', es: 'Esmeralda', fr: 'Émeraude' }, css: 'linear-gradient(135deg, #176c59, #082e28 65%)', accent: '#76e6bd' },
  { id: 'dynamic', label: { ru: 'Сапфир', en: 'Sapphire', es: 'Zafiro', fr: 'Saphir' }, css: 'linear-gradient(135deg, #344c9c, #111c49 65%)', accent: '#a5bdff' },
]
export function getBackground(id) {
  const aliases = { premium: 'default', architecture: 'default', abstract: 'dynamic' }
  return BACKGROUNDS.find((b) => b.id === (aliases[id] || id)) || BACKGROUNDS[0]
}
