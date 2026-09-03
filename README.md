![One Month One Game](public/og/default.png)

# Один месяц — одна игра

Один месяц. Одна тема. Одна законченная игра.

One Month One Game — постоянный челлендж для независимых разработчиков. Каждый месяц участники делают небольшую игру, доводят её до конца и показывают результат на поддерживаемой площадке.

[Live website](https://scrabyq.github.io/one-month-one-game/) · [Текущий раунд — сентябрь 2026](https://scrabyq.github.io/one-month-one-game/jam/2026-09/)

Участие: [itch.io](https://itch.io/jam/evening-jam) · [MyIndie.net](https://myindie.net/jams/jam/myindie-level-10)

## Что это

Сайт собирает витрину законченных игр из ежемесячных раундов. Игровые страницы остаются на внешних площадках, а здесь появляются normalized links, обложки, авторы, описания и дата отправки.

Это не конкурс и не рейтинг: цель — закончить одну небольшую идею за один месяц.

## Как участвовать

1. Сделайте одну небольшую игру.
2. Загрузите её на поддерживаемую площадку.
3. Добавьте игру в текущий jam.
4. После очередной синхронизации она появится в галерее.

## Как сайт работает

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

Сайт статический: браузер не обращается к provider API, не используется backend и не хранятся игровые бинарники. Provider-specific payloads валидируются и преобразуются в общую `GameEntry` model до записи snapshot.

## Providers

Provider-specific код находится в `src/lib/providers/<provider>/`. Каждый адаптер отвечает за HTTP/API-логику, DTO-схемы, pagination и mapping в normalized `GameEntry`.

`src/lib/providers/registry.ts` хранит registry адаптеров и presentation metadata. UI использует registry для provider label, badge и participation URL, поэтому добавление нового provider не требует переписывать основные страницы и карточки.

Сейчас подключены read-only адаптеры:

- `itch.io` — entries endpoint и нормализация game pages;
- `MyIndie.net` — постраничные `/api/jams` и `/api/games` с разрешением jam alias в UUID.

## Локальный запуск

Требуется Node.js 22 и npm.

```bash
npm install
npm run dev
```

При стандартном project-pages base откройте `http://localhost:4321/OneMonthOneGame/`. Для локального запуска от корня используйте `PUBLIC_BASE=/ npm run dev`.

Другие команды:

```bash
npm run sync       # текущий и недавние раунды
npm run test       # Vitest
npm run check      # Astro type-check
npm run build      # production static build
npm run preview    # просмотр production build
npm run generate:og # regenerate OG cards
```

## Добавление нового раунда

Все canonical-метаданные находятся в [`src/config/jams.ts`](src/config/jams.ts). Новый раунд добавляется с отдельным стабильным номером:

```ts
{
  id: "2026-10",
  round: 3,
  slug: "2026-10",
  title: challengeTitle,
  monthLabel: "Октябрь 2026",
  theme: "Новая тема",
  themeState: "announced",
  startsAt: "2026-10-01T00:00:00+03:00",
  endsAt: "2026-10-31T23:59:59+03:00",
  description: "Одна игра за один месяц.",
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
    socialImage: "/og/round-003.png",
  },
}
```

`round` — стабильный уникальный номер выпуска. Его нельзя вычислять из порядка объектов в массиве. `presentation.accent` задаёт визуальную identity раунда и должен быть в формате `#RRGGBB`. `presentation.socialImage` указывает на PNG Open Graph card в `public/`; если presentation или отдельное поле не задано, используются безопасные defaults.

Для каждого нового раунда создайте PNG размером `1200×630`, если хотите отдельный social preview. Минимальные текущие cards: `public/og/default.png`, `public/og/round-001.png` и `public/og/round-002.png`.

Генератор OG-карточек находится в `scripts/generate-og-cards.mjs`. Без аргументов он пересоздаёт три стандартные карточки. Для нового раунда передайте стабильный номер, месяц и accent:

```bash
npm run generate:og -- --round 3 --month "Октябрь 2026" --accent "#9ed8ff"
```

Команда создаст `public/og/round-003.png`. При необходимости можно добавить `--tagline "СДЕЛАЙ. ЗАКОНЧИ. ПОКАЖИ."` или указать другой путь через `--output`. Генератор использует `sharp` только как dev-инструмент; сайт не запускает его во время runtime.

Порядок добавления:

1. Создайте новый публичный jam на itch.io и получите числовой `JAM_ID`.
2. Добавьте объект в `jams`, включая уникальный `round`, даты, тему и presentation metadata.
3. Для объявленной темы используйте `themeState: "announced"`; пока тема не готова — `themeState: "pending"` и при необходимости `themeAnnouncement`.
4. Установите `dataMode: "live"`, укажите настоящие URLs и включённые providers.
5. Запустите `npm run sync` и проверьте generated snapshot.
6. Закоммитьте конфиг, social card и snapshot.

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

Для текущего demo-раунда замените:

```ts
dataMode: "demo"
```

на `dataMode: "live"`, замените placeholder URL, поставьте `enabled: true` и укажите настоящий числовой `jamId`.

### Где найти JAM_ID

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

Обычная синхронизация обрабатывает featured и недавние раунды; `--all` обновляет всю историю. При временной ошибке provider существующий snapshot сохраняется, поэтому публикация может использовать stale data.

Раунд сентября 2026 использует отдельный normalized snapshot в `src/data/demo/2026-09.json`. Demo entries нужны для проверки UI states, включая карточку без cover и submission dates. Production snapshots находятся в `src/data/generated/` и не содержат raw provider payloads.

## GitHub Pages

Workflow находится в `.github/workflows/deploy.yml` и запускается:

- при push в `main` или `master`;
- вручную через `workflow_dispatch`;
- по расписанию каждые три часа.

Он выполняет проверку, sync, static build и deploy.

После push в GitHub:

1. Откройте **Settings → Pages**.
2. В качестве Source выберите **GitHub Actions**.
3. Дождитесь workflow deployment.

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

и добавьте домен одной строкой в `public/CNAME`.

Canonical и Open Graph asset URLs строятся через `Astro.site` и `withBase()`, поэтому project-pages base path и custom-domain root поддерживаются одним helper.

## Ограничения

- `entries.json` — undocumented/internal itch.io endpoint; все предположения о его структуре изолированы в `ItchProvider`.
- Сайт статический: новые данные появляются после очередного sync/build.
- Обложки загружаются напрямую с внешних URL и не оптимизируются Astro.
- В проекте нет голосований, аккаунтов, комментариев, рейтингов, backend, realtime API requests и аналитики.
