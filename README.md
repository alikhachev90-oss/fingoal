# FinGoal — MVP личного финансового трекера с геймификацией

React + Vite + Tailwind, mobile-first, тёмная/светлая тема. Готово в этом шаге:
авторизация → онбординг → ввод трат с автокомплитом категорий и AI-подсказками →
dashboard → калькулятор целей + базовая геймификация (стрик, milestone-бейджи,
виджет "эта трата = +N дней до цели"). Инсайты и обучение — следующий шаг
(таблицы `insights`/`lessons` уже заложены в схему).

## Запуск

```bash
npm install
npm run dev
```

Открыть `http://localhost:5173`.

## Supabase

По умолчанию приложение работает в демо-режиме на localStorage (полностью
рабочее, без настройки). Чтобы подключить реальный Supabase:

1. Создайте проект на supabase.com.
2. Выполните `supabase/schema.sql` в SQL Editor — создаст таблицы
   `context_settings, debts, transactions, goals, checkins, insights, lessons`
   с Row Level Security (каждый видит только свои данные).
3. Скопируйте `.env.example` в `.env.local`, впишите `VITE_SUPABASE_URL` и
   `VITE_SUPABASE_ANON_KEY` из настроек проекта (Project Settings → API).
4. Перезапустите `npm run dev` — `src/lib/db.js` автоматически переключится
   с localStorage на Supabase, весь остальной код менять не нужно.

## Структура

- `src/lib/db.js` — единый слой данных (Supabase или localStorage-мок).
- `src/lib/categories.js` — дерево категорий 50/30/20 + правила автокомплита/AI-подсказок.
- `src/lib/finance.js` — расчёт калькулятора цели (день/месяц, требуемый доход, разрыв).
- `src/screens/*` — Auth, Onboarding, Entry (ввод трат), Dashboard, Goals.
- `src/context/AppContext.jsx` — сессия, тема, переключатель Личное/Бизнес.
- `supabase/schema.sql` — DDL + RLS для продакшн-БД.

## Личное / Бизнес

Переключатель в шапке хранит контекст (`personal`/`business`) и полностью
разделяет данные: настройки, долги, транзакции, цели и стрики — отдельные
записи на каждый контекст для одного пользователя.
