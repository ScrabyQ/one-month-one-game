![One Month One Game](public/og/en/default.png)

English | [Русский](README.ru.md)

# One Month — One Game

One month. One theme. One finished game.

One Month One Game is an ongoing challenge for independent game developers. Each month, participants make a small game, finish it, and share the result on a supported platform.

[Live website](https://scrabyq.github.io/one-month-one-game/) · [Current round — September 2026](https://scrabyq.github.io/one-month-one-game/jam/2026-09/)

Participation: [itch.io](https://itch.io/jam/evening-jam) · [MyIndie.net](https://myindie.net/jams/jam/myindie-level-10)

## What it is

The site showcases finished games from monthly rounds. Game pages stay on their external platforms; this site provides normalized links, covers, authors, descriptions, and submission dates.

This is not a contest or a ranking. The goal is to finish one small idea in one month.

## How to participate

1. Make one small game.
2. Upload it to a supported platform.
3. Submit the game to the current jam.
4. After the next synchronization, it will appear in the gallery.

## How the site works

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

The site is static: the browser never calls provider APIs, there is no backend, and game binaries are not stored here. Provider-specific payloads are validated and converted into the shared `GameEntry` model before a snapshot is written.

## Providers

Provider-specific code lives in `src/lib/providers/<provider>/`. Each adapter owns HTTP/API logic, DTO schemas, pagination, and mapping into the normalized `GameEntry` model.

`src/lib/providers/registry.ts` stores provider adapters and presentation metadata. The UI uses the registry for provider labels, badges, and participation URLs, so adding a provider does not require rewriting the main pages or cards.

The current read-only adapters are:

- `itch.io` — entries endpoint and game-page normalization;
- `MyIndie.net` — paginated `/api/jams` and `/api/games`, resolving a jam alias to a UUID.

## Localization

English is the default locale and uses unprefixed routes. Russian is available under `/ru/`:

```text
/                         English home
/archive/                 English archive
/jam/2026-09/             English round
/ru/                      Russian home
/ru/archive/              Russian archive
/ru/jam/2026-09/          Russian round
```

The header language selector preserves the equivalent page, query string, and hash. A new visitor with a Russian browser is redirected to `/ru/`; an explicit selector choice is stored in `localStorage` under `one-month-one-game:locale`. Direct `/ru/` links always remain Russian.

Translations live in `src/lib/i18n/en.ts` and `src/lib/i18n/ru.ts`, with shared types and formatters in `src/lib/i18n/`. To add a translated jam, keep the round ID, dates, providers, snapshot, and round number shared, then add complete `en` and `ru` entries under that round's `content` field in `src/config/jams.ts`.

## Local development

Node.js 22 and npm are required.

```bash
npm install
npm run dev
```

With the default project-pages base, open `http://localhost:4321/OneMonthOneGame/`. To run from the domain root, use `PUBLIC_BASE=/ npm run dev`.

Other commands:

```bash
npm run sync        # current and recent rounds
npm run test        # Vitest
npm run check       # Astro type-check
npm run build       # production static build
npm run preview     # preview the production build
npm run generate:og # regenerate all localized OG cards
```

## Adding a new round

Canonical round metadata lives in [`src/config/jams.ts`](src/config/jams.ts). Add a stable, unique round number and localized content:

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

`round` is the stable release number; never derive it from array order. `presentation.accent` controls the round's visual identity and must use `#RRGGBB` format. Social-image paths are derived automatically from the locale and round number.

Run `npm run generate:og` after changing the configured rounds. It reads the canonical jam configuration and both translation dictionaries, generating one 1200×630 PNG for every locale and round under `public/og/en/` and `public/og/ru/`. The generator is config-driven and accepts no ad-hoc card metadata flags.

The normal order for adding a round is:

1. Create a public jam on itch.io and obtain its numeric `JAM_ID`.
2. Add the shared round metadata and complete `en`/`ru` content to `jams`.
3. Use `themeState: "announced"` for a known theme, or `"pending"` with localized `themeAnnouncement` values while it is unavailable.
4. Set `dataMode: "live"`, real URLs, and enabled providers.
5. Run `npm run generate:og` and `npm run sync`.
6. Check the localized static pages and generated snapshots.

For MyIndie.net, provide a human-readable alias and public URL:

```ts
{
  type: "myindie",
  enabled: true,
  jamAlias: "myindie-level-10",
  jamUrl: "https://myindie.net/jams/jam/myindie-level-10",
}
```

During synchronization, the provider resolves the alias through paginated `POST /api/jams`, obtains the UUID, then loads submissions through paginated `POST /api/games`.

### Finding `JAM_ID`

The internal endpoint uses a numeric ID:

```text
https://itch.io/jam/{JAM_ID}/entries.json
```

The number can be found in the entries page URL/API request or in the public jam's source data. A public slug does not replace the numeric ID.

## Synchronization and demo data

```bash
npm run sync
npm run sync -- --all
```

The normal synchronization processes the featured and recent rounds; `--all` updates the full history. If a provider temporarily fails, the existing snapshot is kept so a deployment can use the latest available data.

September 2026 uses a separate normalized demo snapshot at `src/data/demo/2026-09.json`. Demo entries exercise UI states such as a missing cover and submission dates. Production snapshots are stored in `src/data/generated/` and contain no raw provider payloads.

## GitHub Pages

The workflow is in `.github/workflows/deploy.yml` and runs:

- on pushes to `main` or `master`;
- manually through `workflow_dispatch`;
- every three hours on a schedule.

It generates localized OG cards, checks the project, synchronizes data, builds the static site, and deploys it.

After pushing to GitHub:

1. Open **Settings → Pages**.
2. Select **GitHub Actions** as the source.
3. Wait for the deployment workflow to finish.

For project pages, the base path is derived from the repository name. Locally this defaults to `/OneMonthOneGame/`; override it with:

```env
PUBLIC_SITE_URL=https://username.github.io
PUBLIC_BASE=/OneMonthOneGame
```

For a custom domain:

```env
PUBLIC_SITE_URL=https://example.com
PUBLIC_BASE=/
```

Then add the domain as one line in `public/CNAME`.

Canonical URLs, localized links, and OpenGraph asset URLs use the shared site helpers, so project-pages bases and custom-domain roots use the same code.

## Limitations

- `entries.json` is an undocumented/internal itch.io endpoint; assumptions about its shape are isolated in `ItchProvider`.
- The site is static, so new data appears after the next synchronization and build.
- Covers are loaded directly from external URLs and are not optimized by Astro.
- There are no votes, accounts, comments, ratings, backend services, realtime API requests, or analytics.
