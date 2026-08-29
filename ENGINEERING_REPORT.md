# YOURENERGY — P0 engineering handoff

Дата проверки: 29 августа 2026. Проект остаётся локальным: деплой и выдача
production credentials не выполнялись.

## 1. Структура

Vite MPA генерирует семантический HTML из Handlebars до запуска браузера.
Опубликованные homepage-маршруты: Armenian `/`, Russian `/ru/` и English
`/en/`. Privacy, Terms и Soon существуют для всех трёх локалей и имеют
`noindex`; post-build validator проверяет 12 маршрутов. В `functions/` лежат
Cloudflare Pages Functions, а расчётная логика отделена в `src/domain/`.

## 2. Визуальное соответствие референсу

Сохранены asymmetric hero, Roof Scan, Solar Passport, тёмная trust-полоса,
карты решений, editorial projects, шестишаговый процесс, navy investment
section и плотный footer. Адаптивная проверка на 375 и 1440 px не нашла
горизонтального overflow. Неподтверждённые статические карточки имеют
видимые маркировки illustrative/demo; они не выдаются за результат введённого
адреса.

## 3. Зависимости

Единственная runtime dependency — `leaflet`; она загружается отдельным
chunk только после начала map workflow. Dev dependencies: Vite, Handlebars,
Sharp, ESLint, `@eslint/js`, globals и Prettier. `npm ls --depth=0` подтверждён;
`npx knip --include files` проходит без неиспользуемых файлов. Устаревший
модуль `CRS.Simple` удалён.

## 4. Честный P0 real-analysis flow

1. Посетитель вводит адрес и среднее kWh либо 12-месячный профиль.
2. `/api/geocode` возвращает только кандидатов; выбор точки всегда требует
   явного подтверждения. При недоступности доступна ручная точка.
3. На geographic Leaflet map пользователь строит контур крыши, выбирает
   ориентацию/наклон, может выбрать точку, сдвинуть её, отменить или сбросить
   контур. «Завершить» недоступно до трёх точек.
4. `/api/analysis` запрашивает у PVGIS yield для 1 kWp и прозрачным образом
   масштабирует его от введённого потребления.
5. Dashboard, карта, Passport, chart, ledger и три варианта системы получают
   один `SolarAnalysis`; финансовые поля скрываются, если их источники не
   подтверждены.
6. Если provider/configuration недоступны, UI показывает ошибку и очищенные
   значения, а не demo-результат.

## 5. Consumption, tariffs и расчёт

Pure domain-модули содержат JSDoc-модели Property, Consumption, Roof, Tariff,
SolarAnalysis, SolarPassport и Confidence. `ARMENIA_TARIFF_DATASET` versioned,
но намеренно не содержит неподтверждённой ставки. Поэтому счёт в AMD не
конвертируется без verified tariff, а savings, price и payback не показываются
без подтверждённых tariff + capex источников. В ledger видны источник,
полнота и ограничения; PVGIS loss 14% отмечен как допущение.

## 6. Real versus demo content

Контакты предоставлены владельцем и показаны как реальные: `+374 91 095 950`,
Artashisyan 48 14 Kotayq, Zovuni, 26 33 str, Yerevan. Проекты, отзывы, люди,
изображения, статические варианты систем и фиксированные финансовые цифры
остаются clearly labelled illustrative/demo. Старый `DemoHomeAnalysisService`
изолирован от homepage и возвращает явное disclosure; `ProductApiClient`
никогда не подставляет его вместо provider-ответа.

## 7. API, security и env

Есть same-origin JSON endpoints:

- `POST /api/geocode` — provider candidates;
- `POST /api/analysis` — подтверждённый property + контур + PVGIS + ledger;
- `POST /api/lead` — валидированный lead после результата.

Все provider, CRM и Turnstile secrets читаются только server-side из
`functions/.dev.vars`; `.env.example` содержит лишь публичные endpoint/map
поля. API до вызова PVGIS отвергает неподтверждённый объект или незавершённую
крышу. CSP/headers ограничивают источники self и явным HTTPS tile origin,
если он конфигурирован. Functions не логируют адрес, координаты или lead PII.

## 8. Passport, lead и analytics

`SolarPassportRepository` — memory-only реализация P0: permanent URL и PDF
честно недоступны. Lead form требует имя, телефон и consent; без CRM не
показывает успех. Turnstile adapter подготовлен, но не заявляется работающим
без настроенного site key/secret. Browser analytics публикует только
локальные события без PII.

## 9. SEO, i18n и accessibility

Основной HTML crawlable без JavaScript. Есть localized title/description/OG,
canonical и reciprocal `hy`/`ru`/`en`/`x-default` hreflang, FAQ JSON-LD,
sitemap только с тремя homepage. Маршруты Privacy/Terms/Soon — noindex.
Проверены один H1, landmarks, skip-link, visible labels/errors, `aria-live`,
native dialog с Escape/focus return, native details, keyboard map controls,
reduced motion и текстовые chart/table alternatives.

## 10. QA

`npm test` проходит: 26 unit/API tests покрывают consumption/tariffs,
finite values, Passport memory flow, API envelopes, PVGIS normalization,
unconfirmed property rejection, aborts и polygon area. `npm run lint`,
`npm run format:check`, `npm run build`, `npm run verify:build` и `npm run
check` проходят; verifier подтверждает 12 routes, canonical/hreflang,
JSON-LD, anchors, template tokens и assets.

В production preview вручную проверены HY/RU navigation, responsive menu,
dialog + Escape/focus return, solutions/FAQ, project/testimonial controls,
manual point, polygon add/undo/reset, unavailable provider flow, desktop/mobile
overflow и console (чисто при загрузке). Browser upload валидирован unit-тестом;
автоматический file chooser Chrome extension отказал в доступе к file URLs.
Для повторения browser upload нужно включить **Allow access to file URLs** в
Details расширения ChatGPT в `chrome://extensions`.

## 11. Build и performance

Production build: initial main JS 12.51 KB gzip, CSS 9.21 KB gzip, Leaflet
43.38 KB gzip в lazy chunk. Lighthouse ниже запущен на локальном Vite preview;
это lab result, а не гарантия production CWV.

| Route / viewport | Performance | A11y | Best practices | SEO | FCP / LCP / TBT / CLS    |
| ---------------- | ----------: | ---: | -------------: | --: | ------------------------ |
| HY mobile        |         100 |  100 |            100 | 100 | 1.1 s / 1.5 s / 0 ms / 0 |
| RU mobile        |         100 |  100 |            100 | 100 | 1.1 s / 1.5 s / 0 ms / 0 |
| HY desktop       |         100 |  100 |            100 | 100 | 0.3 s / 0.4 s / 0 ms / 0 |
| RU desktop       |         100 |  100 |            100 | 100 | 0.3 s / 0.4 s / 0 ms / 0 |

JSON reports: `reports/lighthouse/*-p0.json`. Visual QA captures:
`reports/screenshots/hy-375-final.jpg`, `hy-1440-final.jpg`,
`ru-375-final.jpg`, `ru-1440-final.jpg`.

## 12. Launch blockers и следующие три шага

1. Owner must supply and configure an approved geocoder, PVGIS endpoint,
   map-tile provider, dated verified tariff source/revision, CRM and Turnstile
   credentials. Until then P0 intentionally shows no property-specific result.
2. Replace every illustrative project/photo/review/price with approved evidence;
   complete Armenian native proofreading and legal approval for Privacy/Terms.
3. Deploy to staging, repeat browser upload/keyboard/mobile smoke and Lighthouse
   on the real origin, then record actual production results.
