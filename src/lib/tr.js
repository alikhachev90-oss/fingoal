// Pick the text for the current language: { ru, en, es, fr }. A language
// with no text yet falls back to English, never to Russian.
export function tr(lang, texts) {
  return texts[lang] ?? texts.en ?? texts.ru
}
