# YOURENERGY — P1 engineering handoff

Дата проверки: 1 сентября 2026. Тестовый Cloudflare Pages URL предоставлен
владельцем, но текущая переработка ещё не деплоится автоматически.

## 1. Структура

Vite MPA генерирует семантический HTML из Handlebars до запуска браузера.
Опубликованные homepage-маршруты: Armenian `/`, Russian `/ru/` и English
`/en/`; для каждой локали добавлены `/calculator/` и `/offer-checker/`.
Главная страница — быстрый marketing entry; полный address/map/roof/PVGIS
workflow живёт только на одноимённой локализованной странице Calculator.
Privacy, Terms и Soon существуют для всех трёх локалей и имеют `noindex`.
В `functions/` лежат Cloudflare Pages Functions, а расчётная логика отделена
в `src/domain/`.

## 2. Визуальное соответствие референсу

Сохранены asymmetric hero, Roof Scan, Solar Passport, тёмная trust-полоса,
карты решений, editorial projects, шестишаговый процесс, navy investment
section и плотный footer. Homepage больше не раскрывает сложную форму и карту:
её CTA ведут на Calculator, поэтому первый экран остаётся понятным и быстрым.
Адаптивная проверка на 320, 375, 430, 768, 1024, 1280 и 1440 px не нашла
горизонтального overflow. Неподтверждённые статические карточки имеют
видимые маркировки illustrative/demo; они не выдаются за результат введённого
адреса.

## 3. Зависимости

Единственная runtime dependency — `leaflet`; она загружается отдельным
chunk только после начала map workflow. Dev dependencies: Vite, Handlebars,
Sharp, ESLint, `@eslint/js`, globals и Prettier. `npm ls --depth=0` подтверждён;
свежий `npx --yes knip --dependencies` не нашёл неиспользуемых declared
dependencies. Устаревший модуль `CRS.Simple` удалён.

## 4. Честный P0 real-analysis flow

1. На отдельной странице Calculator посетитель сначала вводит адрес **или**
   выбирает ручную точку; потребление на этом шаге не требуется.
2. `/api/geocode` возвращает только кандидатов; выбор точки всегда требует
   явного подтверждения. При недоступности доступна ручная точка.
3. После подтверждения `/api/potential` запрашивает PVGIS для этой точки и
   показывает годовую/месячную генерацию на 1 kWp, а также ориентир optimum
   orientation/tilt для свободно стоящей фиксированной системы. Это отдельный
   статус «Потенциал участка», а не заявление об угле реальной крыши.
4. Только затем посетитель продолжает в detailed flow: на geographic Leaflet
   map строит контур доступного ската и при наличии данных указывает его
   направление/наклон. Можно выбрать точку, сдвинуть её, отменить или сбросить
   контур. «Завершить» недоступно до трёх точек; среднее kWh либо 12-месячный
   профиль требуются только на этом шаге.
5. `/api/analysis` запрашивает у server-side PVGIS yield для 1 kWp и
   прозрачным образом масштабирует его от введённого потребления. Если
   `PVGIS_ENDPOINT` не задан, Function использует публичный endpoint PVGIS;
   его ошибка показывает retry/manual-contact, а не demo-цифры.
6. Dashboard, карта, Passport, chart, ledger и три варианта системы получают
   один `SolarAnalysis`; финансовые поля скрываются, если их источники не
   подтверждены.
7. Если provider/configuration недоступны, UI показывает ошибку и очищенные
   значения, а не demo-результат.

## 5. Consumption, tariffs и расчёт

Pure domain-модули содержат JSDoc-модели Property, Consumption, Roof, Tariff,
SolarAnalysis, SolarPassport и Confidence. `ARMENIA_TARIFF_DATASET` versioned,
но намеренно не содержит неподтверждённой ставки. Пользователь может ввести
AMD/kWh из собственного счёта: ledger и Passport прямо показывают источник
`user`, а без usable tariff savings и payback скрыты.

Контур крыши теперь влияет на предварительную мощность: server-side применяет
консервативные 70% отмеченной площади и модуль 580 W / 2 м². Оба допущения
видны в ledger. Это ограничение вместимости, а не раскладка панелей и не
инженерное измерение.

Для предварительного бюджета server-side выбирает единственный versioned
`PriceBook`: `yourenergy-am-residential-grid-v0-1`, проверен 29.08.2026,
действует 30 дней до 28.09.2026. Диапазон 232 / 247 / 264 AMD/Wp округляется
до 10 000 AMD; P50 — основной ориентир. Это «Предварительная цена YOUR ENERGY
· v0.1 · не является офертой», а не рыночное доказательство. Включены панели,
инвертор, крепёж, стандартный монтаж и базовое подключение; исключены батарея,
ремонт крыши, нестандартные электрические работы и финансирование. НДС и
разрешения требуют подтверждения. После expiry цена скрывается и предлагается
обследование. Статический Offer Checker не выводит числовой диапазон без
JavaScript; браузер проверяет срок `validUntil` перед его показом.

## 6. Real versus demo content

Контакты предоставлены владельцем и показаны как реальные: `+374 91 095 950`,
Artashisyan 48 14 Kotayq, Zovuni, 26 33 str, Yerevan. Проекты, отзывы, люди,
изображения, статические варианты систем и фиксированные финансовые цифры
остаются clearly labelled illustrative/demo. Runtime demo-анализатор удалён:
`ProductApiClient` никогда не подставляет демонстрационный ответ вместо
provider-ответа.

Прямая кнопка звонка использует этот подтверждённый номер. Публичный e-mail
владелец пока не предоставил, поэтому сайт не придумывает адрес и не выводит
ложную кнопку `mailto:`.

## 7. API, security и env

Есть same-origin JSON endpoints:

- `POST /api/geocode` — provider candidates;
- `POST /api/potential` — PVGIS-ориентир для подтверждённой точки;
- `POST /api/analysis` — подтверждённый property + контур + PVGIS + ledger;
- `POST /api/lead` — валидированный lead после результата.

Все provider, CRM и Turnstile secrets читаются только server-side из
`functions/.dev.vars`; `.env.example` содержит лишь публичные endpoint/map
поля. API до вызова PVGIS отвергает неподтверждённый объект или незавершённую
крышу и игнорирует client capex: активный PriceBook выбирается на сервере.
OpenStreetMap — явный публичный fallback tile provider с attribution;
`VITE_MAP_TILE_URL` можно заменить только на утверждённый HTTPS origin, который
Vite добавит в `img-src` CSP. Functions не логируют адрес, координаты или lead
PII.

OSM не является спутниковой/3D моделью. Поэтому адрес и карта не могут честно
определить фактический наклон, полезную площадь, затенение или несущую
способность крыши. Для автоматического roof-scan нужен отдельный approved
aerial/3D roof provider; до его подключения используются ручной контур,
введённые параметры и обязательная инженерная проверка.

## 8. Passport, lead и analytics

`SolarPassportRepository` — memory-only реализация P1: permanent URL и PDF
честно недоступны. Lead form требует имя, телефон и consent; без CRM не
показывает успех. Turnstile adapter подготовлен, но не заявляется работающим
без настроенного site key/secret. Browser analytics публикует только
локальные события без PII.

## 9. SEO, i18n и accessibility

Основной HTML crawlable без JavaScript. Есть localized title/description/OG,
canonical и reciprocal `hy`/`ru`/`en`/`x-default` hreflang, FAQ JSON-LD,
а sitemap включает home, calculator и Offer Checker для трёх локалей.
Маршруты Privacy/Terms/Soon — noindex.
Проверены один H1, landmarks, skip-link, visible labels/errors, `aria-live`,
native dialog с Escape/focus return, native details, keyboard map controls,
reduced motion и текстовые chart/table alternatives.

## 10. QA

Свежий `npm run check` проходит: 32 Node unit/API tests покрывают
consumption/tariffs, finite values, Passport memory flow, API envelopes,
PVGIS normalization and free-standing optimum calculation, unconfirmed property
rejection, provider failure without demo fallback, aborts, polygon area and
roof-capacity limit, P25/P50/P75 и округление, expiry PriceBook, ручной тариф,
скрытие финансов без тарифа, server-selected pricebook/client-capex rejection
и статусы Offer Checker. `npm run lint`, `npm run format:check`, `npm run build`
и `npm run verify:build` входят в эту команду; verifier подтверждает 18 routes,
canonical/hreflang, JSON-LD, anchors, template tokens и assets.

В локальном production preview вручную проверены HY/RU/EN language routes и один H1,
responsive menu, no-overflow, отсутствие calculator form/map/file input на
homepage, прямые CTA homepage → same-locale Calculator, ручная точка на карте,
отдельный четырёхшаговый flow «точка → PVGIS → крыша → расчёт», скрытый до
подтверждённого provider-ответа result panel, контур крыши с keyboard-кнопкой,
custom azimuth, Escape для Passport dialog и provider-failure state без
подстановки цифр. Найденный overlay статической roof-card, блокировавший клики
по интерактивной карте, устранён; скрытые controls больше не отображаются из-за
CSS. Offer Checker проверен в сценариях
P50 «в диапазоне» и неполной комплектации «несопоставимо»; в обоих случаях
copy локализован. Leaflet/OSM загружается лениво с attribution; console errors
не обнаружены.
Полный PVGIS/geocoder/CRM E2E не выполнялся на Vite preview: Pages Functions
там не запускаются, поэтому они покрыты изолированными Node API tests с
provider mocks. MIME/size rules upload покрыты unit-тестом; Chrome extension
заблокировал автоматический file chooser. Для повторения browser upload нужно
включить **Allow access to file URLs** в Details расширения ChatGPT в
`chrome://extensions`.

## 11. Build и performance

Fresh production build: homepage enhancement is 0.11 KB gzip (plus shared
navigation/scroller chunks), full Calculator `main` is 11.98 KB gzip + shared
domain chunk 3.98 KB gzip, CSS 11.21 KB gzip; Leaflet 43.38 KB gzip remains a
lazy chunk and the separate Offer Checker enhancement is 1.54 KB gzip.

The 31.08 Lighthouse table in `reports/lighthouse/*-p1.json` belongs to the
pre-separation layout and is intentionally not reused as a score for this
revision. A fresh local browser smoke confirms the lighter homepage and the
lazy calculator stack; a repeated CLI Lighthouse attempt stalled while launching
Chrome, so the next trustworthy lab audit must run against the newly deployed
staging revision. This is a lab measurement task, never a production CWV
guarantee.

Fresh production-preview captures from this revision are saved locally in
`reports/screenshots/hy-375-p1-current.png`, `hy-1440-p1-current.png`,
`ru-375-p1-current.png` and `ru-1440-p1-current.png`. They are test artefacts
and intentionally ignored by Git.

## 12. Launch blockers и следующие три шага

1. Owner must supply and configure an approved geocoder, dated verified tariff
   source/revision, CRM and Turnstile credentials, plus a public e-mail if an
   e-mail fallback is required. To determine roof geometry automatically, owner
   must also approve an aerial/3D roof-data provider; address + OSM cannot do
   it. PVGIS/OSM fallbacks are configured, but an approved commercial provider
   can replace either without changing the browser flow.
2. Replace every illustrative project/photo/review/price with approved evidence;
   complete Armenian native proofreading and legal approval for Privacy/Terms.
3. Deploy to staging, repeat browser upload/keyboard/mobile smoke and Lighthouse
   on the real origin, then record actual production results.
