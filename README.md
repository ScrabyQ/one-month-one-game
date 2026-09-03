# Один месяц — одна игра

Статическая русскоязычная витрина ежемесячного игрового челленджа. Каждый месяц появляется новая тема, разработчики делают одну игру, а сайт собирает ссылки на готовые работы с внешних площадок.

Сейчас подключён только itch.io. Сайт не хранит игровые бинарники и не запрашивает provider API из браузера.

## Как это работает

```text
itch.io
    ↓
ItchProvider
    ↓
GameEntry (normalized model)
    ↓
src/data/generated/*.json
    ↓
Astro static build
    ↓
GitHub Pages
```

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
```

Чтобы синхронизировать всю историю:

```bash
npm run sync -- --all
```

## Создание следующего месяца

Все canonical-метаданные находятся в [`src/config/jams.ts`](src/config/jams.ts).

1. Создайте новый публичный jam на itch.io.
2. Получите его числовой `JAM_ID`.
3. Добавьте новый объект в `jams`.
4. Укажите `monthLabel`, `theme`, `startsAt`, `endsAt` и описание.
5. Включите itch provider:

   ```ts
   {
     type: "itch",
     enabled: true,
     jamId: 123456,
     jamUrl: "https://itch.io/jam/real-jam-slug"
   }
   ```

6. Установите `dataMode: "live"`.
7. Запустите `npm run sync` и проверьте результат.
8. Закоммитьте новый конфиг и generated snapshot.

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

## Provider architecture

Provider-specific code находится в `src/lib/providers/<provider>/`. Адаптер получает внешний payload, валидирует его, нормализует в `GameEntry`, после чего aggregator сохраняет только normalized snapshot.

Для будущего MyIndie потребуется:

1. Добавить `MyIndieProviderConfig` в domain provider config union.
2. Создать `src/lib/providers/myindie/` с raw schema и normalizer.
3. Реализовать `GameProvider`.
4. Зарегистрировать адаптер и presentation metadata в `registry.ts`.

`GameCard`, grid, archive, sorting и pages при этом менять не нужно.

## Demo data

Пока настоящий JAM_ID не задан, раунд сентября 2026 использует отдельный normalized snapshot в `src/data/demo/2026-09.json`. Эти записи нужны только для визуальной демонстрации и не участвуют в production synchronization. В snapshot есть и запись без cover, чтобы проверить fallback-оформление.

Production snapshots находятся в `src/data/generated/` и не содержат raw itch payloads.

## GitHub Pages

Workflow находится в `.github/workflows/deploy.yml` и запускается:

- при push в `main` или `master`;
- вручную через `workflow_dispatch`;
- по расписанию каждые три часа.

Он выполняет проверку, sync, static build и deploy. При временной ошибке itch.io sync сохраняет существующий snapshot, поэтому публикация может использовать stale data.

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

## Ограничения

- `entries.json` — undocumented/internal itch.io endpoint; все предположения о его структуре изолированы в `ItchProvider`.
- Сайт статический: новые данные появляются после очередного sync/build.
- Обложки загружаются напрямую с внешних URL и не оптимизируются Astro.
- В MVP нет голосований, аккаунтов, комментариев, рейтингов, backend, аналитики и MyIndie.
