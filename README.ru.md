![Один месяц — одна игра](public/og/ru/default.png)

[English](README.md) | Русский

# Один месяц — одна игра

Один месяц. Одна тема. Одна законченная игра.

«Один месяц — одна игра» — постоянный челлендж для независимых разработчиков. Каждый месяц участники делают небольшую игру, доводят её до конца и показывают результат на поддерживаемой площадке.

[Сайт](https://scrabyq.github.io/one-month-one-game/) · [Текущий раунд — сентябрь 2026](https://scrabyq.github.io/one-month-one-game/ru/jam/2026-09/)

Участие: [itch.io](https://itch.io/jam/evening-jam) · [MyIndie.net](https://myindie.net/jams/jam/myindie-level-10)

## Что это

Сайт собирает витрину законченных игр из ежемесячных раундов. Игровые страницы остаются на внешних площадках, а здесь появляются нормализованные ссылки, обложки, авторы, описания и даты отправки.

Это не конкурс и не рейтинг: цель — закончить одну небольшую идею за один месяц.

## Как участвовать

1. Сделайте одну небольшую игру.
2. Загрузите её на поддерживаемую площадку.
3. Добавьте игру в текущий джем.
4. После очередной синхронизации она появится в галерее.

## Как работает сайт

```text
itch.io ───────┐
               ├─ Provider adapters ──┐
MyIndie.net ───┘                      │
                                      ↓
                              Provider registry
                                      ↓
                              GameEntry model
                                      ↓
                         src/data/generated/*.json
                                      ↓
                              Astro static build
                                      ↓
                                GitHub Pages
```

Сайт статический: браузер не обращается к API площадок, backend не используется, игровые бинарные файлы здесь не хранятся. Внешние payload-ы валидируются и преобразуются в общую модель `GameEntry` до записи snapshot.

## Локализация

Английский — язык по умолчанию, его страницы используют URL без префикса. Русский доступен под `/ru/`:

```text
/                         английская главная
/archive/                 английский архив
/jam/2026-09/             английский раунд
/ru/                      русская главная
/ru/archive/              русский архив
/ru/jam/2026-09/          русский раунд
```

Переключатель языка в шапке сохраняет эквивалентную страницу, query string и hash. Новый посетитель с русским языком браузера перенаправляется на `/ru/`; явный выбор сохраняется в `localStorage` под ключом `one-month-one-game:locale`. Прямая ссылка на `/ru/` всегда остаётся русской.

Переводы находятся в `src/lib/i18n/en.ts` и `src/lib/i18n/ru.ts`, общие типы и форматтеры — в `src/lib/i18n/`. Чтобы добавить перевод нового джема, оставьте общими ID, даты, providers, snapshot и номер раунда, а затем добавьте полные `en` и `ru` записи в поле `content` объекта в `src/config/jams.ts`.

## Локальный запуск

Требуется Node.js 22 и npm.

```bash
npm install
npm run dev
```

При стандартном project-pages base откройте `http://localhost:4321/OneMonthOneGame/`. Для запуска от корня используйте `PUBLIC_BASE=/ npm run dev`.

Другие команды:

```bash
npm run sync        # текущий и недавние раунды
npm run test        # Vitest
npm run check       # проверка типов Astro
npm run build       # production static build
npm run preview     # просмотр production build
npm run generate:og # пересоздать все локализованные OG-карточки
```

## Добавление нового раунда

Все canonical-метаданные находятся в [`src/config/jams.ts`](src/config/jams.ts). Добавьте стабильный уникальный номер и локализованный контент:

```ts
{
  id: "2026-10",
  round: 3,
  slug: "2026-10",
  content: {
    en: {
      title: "One Month — One Game",
      monthLabel: "October 2026",
      theme: "A new theme",
      themeAnnouncement: "The theme will appear at the start of the month",
      description: "One game in one month.",
    },
    ru: {
      title: "Один месяц — одна игра",
      monthLabel: "Октябрь 2026",
      theme: "Новая тема",
      themeAnnouncement: "Тема появится в начале месяца",
      description: "Одна игра за один месяц.",
    },
  },
  themeState: "announced",
  startsAt: "2026-10-01T00:00:00+03:00",
  endsAt: "2026-10-31T23:59:59+03:00",
  dataMode: "live",
  providers: [
    {
      type: "itch",
      enabled: true,
      jamId: 123456,
      jamUrl: "https://itch.io/jam/real-jam-slug",
    },
  ],
  presentation: {
    accent: "#9ed8ff",
  },
}
```

`round` — стабильный номер выпуска; нельзя вычислять его по порядку объектов в массиве. `presentation.accent` задаёт визуальную identity раунда и должен иметь формат `#RRGGBB`. Пути к social images автоматически строятся из языка и номера раунда.

Запускайте `npm run generate:og` после изменения списка раундов. Команда читает canonical-конфигурацию джемов и оба словаря переводов и создаёт PNG размером `1200×630` для каждого языка и раунда в `public/og/en/` и `public/og/ru/`. Генератор работает только от конфигурации и не принимает ручные параметры карточки.

Порядок добавления:

1. Создайте публичный джем на itch.io и получите числовой `JAM_ID`.
2. Добавьте общие метаданные раунда и полный контент `en`/`ru` в `jams`.
3. Для известной темы используйте `themeState: "announced"`; пока тема не готова — `"pending"` и локализованные `themeAnnouncement`.
4. Установите `dataMode: "live"`, настоящие URLs и включённые providers.
5. Запустите `npm run generate:og` и `npm run sync`.
6. Проверьте локализованные статические страницы и generated snapshots.

Для MyIndie.net укажите человекочитаемый alias и публичный URL:

```ts
{
  type: "myindie",
  enabled: true,
  jamAlias: "myindie-level-10",
  jamUrl: "https://myindie.net/jams/jam/myindie-level-10",
}
```

При синхронизации provider сначала находит alias через постраничный `POST /api/jams`, получает UUID, а затем загружает все submissions через постраничный `POST /api/games`.

### Где найти `JAM_ID`

Внутренний endpoint использует числовой ID:

```text
https://itch.io/jam/{JAM_ID}/entries.json
```

Число можно увидеть в URL/API-запросе страницы entries или в исходных данных публичного jam. Public slug сам по себе не заменяет числовой ID.

## Синхронизация и demo data

```bash
npm run sync
npm run sync -- --all
```

Обычная синхронизация обрабатывает featured и недавние раунды; `--all` обновляет всю историю. При временной ошибке provider существующий snapshot сохраняется, поэтому публикация может использовать последние доступные данные.

Раунд сентября 2026 использует отдельный normalized demo snapshot в `src/data/demo/2026-09.json`. Demo entries нужны для проверки UI-состояний, включая карточку без cover и даты отправки. Production snapshots находятся в `src/data/generated/` и не содержат raw provider payloads.

## Providers

Provider-specific код находится в `src/lib/providers/<provider>/`. Каждый адаптер отвечает за HTTP/API-логику, DTO-схемы, pagination и mapping в normalized `GameEntry`.

`src/lib/providers/registry.ts` хранит registry адаптеров и presentation metadata. UI использует registry для provider label, badge и participation URL, поэтому добавление нового provider не требует переписывать основные страницы и карточки.

Сейчас подключены read-only адаптеры:

- `itch.io` — entries endpoint и нормализация game pages;
- `MyIndie.net` — постраничные `/api/jams` и `/api/games` с разрешением jam alias в UUID.

## GitHub Pages

Workflow находится в `.github/workflows/deploy.yml` и запускается:

- при push в `main` или `master`;
- вручную через `workflow_dispatch`;
- по расписанию каждые три часа.

Он генерирует локализованные OG-карточки, выполняет проверку, sync, static build и deploy.

После push в GitHub:

1. Откройте **Settings → Pages**.
2. В качестве Source выберите **GitHub Actions**.
3. Дождитесь окончания workflow deployment.

Для project pages используется base path, вычисляемый из имени репозитория. По умолчанию локально это `/OneMonthOneGame/`. Его можно переопределить:

```env
PUBLIC_SITE_URL=https://username.github.io
PUBLIC_BASE=/OneMonthOneGame
```

Для custom domain:

```env
PUBLIC_SITE_URL=https://example.com
PUBLIC_BASE=/
```

Добавьте домен одной строкой в `public/CNAME`.

Canonical и Open Graph asset URLs, локализованные ссылки и base path строятся общими helpers, поэтому project-pages и custom-domain deployment используют один код.

## Ограничения

- `entries.json` — undocumented/internal itch.io endpoint; все предположения о его структуре изолированы в `ItchProvider`.
- Сайт статический: новые данные появляются после очередного sync/build.
- Обложки загружаются напрямую с внешних URL и не оптимизируются Astro.
- В проекте нет голосований, аккаунтов, комментариев, рейтингов, backend, realtime API requests и аналитики.
