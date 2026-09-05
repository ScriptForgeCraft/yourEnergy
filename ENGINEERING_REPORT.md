# YOURENERGY — P1 honest PVGIS Roof Flow handoff

Дата проверки: 1 сентября 2026. Тестовый Cloudflare Pages URL предоставлен
владельцем, но текущая переработка ещё не деплоится автоматически.

## 1. Структура

Vite MPA генерирует семантический HTML из Handlebars до запуска браузера.
Опубликованные homepage-маршруты: Armenian `/`, Russian `/ru/` и English
`/en/`; для каждой локали добавлен единый `/calculator/`. Старые `/offer-checker/`
сохраняются как noindex-переходы к разделу проверки КП внутри калькулятора.
Главная страница — быстрый marketing entry; полный address/map/roof/PVGIS
workflow живёт только на одноимённой локализованной странице Calculator.
Header и footer теперь едины на home, calculator, support и legacy-документах;
внутреннее меню Calculator управляет пятью разделами без перехода на другой URL.
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

## 4. Честный PVGIS Roof Flow

1. На отдельной странице Calculator посетитель сначала вручную выбирает и
   подтверждает точку на карте либо вводит координаты; адрес — только
   необязательная подпись для инженера и не геокодируется. Потребление на этом
   шаге не требуется.
2. `/api/geocode` остаётся выключенным future-adapter до подключения
   утверждённого provider; он не является browser fallback.
3. После подтверждения `/api/potential` запрашивает PVGIS для этой точки и
   показывает годовую/месячную генерацию на 1 kWp, а также ориентир optimum
   orientation/tilt для свободно стоящей фиксированной системы. Это отдельный
   статус «Потенциал участка», а не заявление об угле реальной крыши.
4. Только затем посетитель продолжает в detailed flow: на geographic Leaflet
   map строит контур доступного ската **либо** вводит измеренную площадь
   плоскости, указывает монтаж, направление и примерный наклон. Контур — это
   площадь сверху; до 75° она предварительно переводится в площадь ската, а
   для более крутого ската требуется измеренная площадь. Клавиатурный fallback
   позволяет выбрать центр карты, затем подтвердить точку. Можно выбрать точку
   контура, сдвинуть её, отменить или сбросить контур.
5. `/api/analysis` запрашивает server-side PVGIS yield для 1 kWp и прозрачно
   масштабирует его от введённого потребления. Для `roof-parallel` используется
   введённая плоскость ската; для `elevated` — PVGIS-ориентир свободно стоящей
   конструкции. Любой запрос требует KV-кэш и salt; ошибка даёт
   retry/manual-contact, а не demo-цифры.
6. Dashboard, карта, Passport, chart, ledger и три варианта системы получают
   один `SolarAnalysis`; финансовые поля скрываются, если их источники не
   подтверждены. `dataCompleteness` никогда не выше `preliminary`.
7. Если provider/configuration недоступны, UI показывает ошибку и очищенные
   значения, а не demo-результат.

## 5. Consumption, tariffs и расчёт

Pure domain-модули содержат JSDoc-модели Property, Consumption, Roof, Tariff,
SolarAnalysis, SolarPassport и DataCompleteness. `ARMENIA_TARIFF_DATASET` versioned,
но намеренно не содержит неподтверждённой ставки. Пользователь может ввести
AMD/kWh из собственного счёта: ledger и Passport прямо показывают источник
`user`, а без usable tariff savings и payback скрыты.

Контур крыши теперь влияет на предварительную мощность: server-side сначала
получает предварительную площадь плоскости ската, затем применяет
консервативные 70% этой площади и модуль 580 W / 2 м². Оба допущения
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

На home добавлен компактный блок проверяемой юридической информации. Он
использует только безопасные сведения из предоставленных выписки и устава:
юридическое лицо, дату и номера регистрации, ИНН, юридический адрес и
контрольный номер для `verify.e-gov.am`. Исходные PDF не публикуются, поскольку
содержат персональные идентификаторы. Блок не выдаётся за лицензию монтажника,
страховку, гарантию или подтверждение применимости оборудования.

Прямая кнопка звонка использует этот подтверждённый номер. Публичный e-mail
владелец пока не предоставил, поэтому сайт не придумывает адрес и не выводит
ложную кнопку `mailto:`.

04.09.2026 добавлен доступный без JavaScript раздел «Техническая документация
оборудования» с четырьмя предоставленными PDF в `public/documents/`: двумя
листами LONGi 640–665 W, листом инвертора SolaX X1-Lite-LV и батареи SolaX
T-BAT-SYS-LV D53. Карточки показывают только параметры, стандарты и гарантийные
формулировки, которые заявлены в соответствующем PDF, и всегда дают ссылку на
первичный файл. Это product data sheets, а не лицензии YOUR ENERGY, не
доказательство авторизации производителя, наличия на складе или применимости
для конкретной крыши. Для настоящего trust-блока по компании нужны отдельно
проверенные регистрационные, страховые, монтажные и гарантийные документы с
разрешением на публикацию.

## 7. API, security и env

Есть same-origin JSON endpoints:

- `POST /api/geocode` — выключенный по умолчанию future provider-adapter;
- `POST /api/potential` — PVGIS site-benchmark для подтверждённой точки;
- `POST /api/analysis` — ручная плоскость крыши + PVGIS + ledger;
- `POST /api/lead` — валидированный lead после результата.

Все provider, CRM и Turnstile secrets читаются только server-side из
`functions/.dev.vars`; `.env.example` содержит лишь публичные endpoint/map
поля. `PVGIS_CACHE` — обязательный Cloudflare KV binding, а
`PVGIS_CACHE_SALT` — обязательный secret. Ключ кэша — salted hash
нормализованного PVGIS-запроса; в KV остаётся только normalized PVGIS answer с
timestamp на 7 дней, без адреса, расхода, тарифа или точек контура. API до
вызова PVGIS отвергает неподтверждённый объект, координаты вне Армении,
незавершённую/некорректную крышу и игнорирует client capex: активный PriceBook
выбирается на сервере.
OpenStreetMap — явный публичный fallback tile provider с attribution;
`VITE_MAP_TILE_URL` можно заменить только на утверждённый HTTPS origin, который
Vite добавит в `img-src` CSP. Functions не логируют адрес, координаты или lead
PII.

До установки KV binding и `PVGIS_CACHE_SALT` на Pages `/api/potential` и
`/api/analysis` намеренно отвечают `PVGIS_CACHE_NOT_CONFIGURED`. Это
безопасное состояние: публичный сайт не выполняет безлимитные запросы к
бесплатному PVGIS и не подставляет демонстрационные цифры. После настройки
нужен отдельный живой smoke: ручная точка в Армении → potential → контур →
analysis → Passport.

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

Финальный локальный прогон от 04.09.2026 прошёл успешно:

- `npm test` — 43/43 Node unit/API tests;
- `npm run lint` и `npm run format:check` — без замечаний;
- `npm run build` — production build завершён;
- `npm run verify:build` — 18 маршрутов прошли structural/SEO validation.

Новые проверки покрывают area conversion и запрет слишком крутого контура,
measured roof-face без polygon, границу Армении до PVGIS, обязательные KV/salt,
TTL 7 дней и отсутствие private data в cache record, cache hit без повторного
PVGIS-вызова, elevated benchmark и правило «только preliminary». Общий набор
также покрывает consumption/tariffs, finite values, Passport memory flow,
API envelopes, PVGIS normalization/failure без demo fallback, отмену запросов,
PriceBook, ручной тариф, скрытие финансов без тарифа и Offer Checker.

Post-build validator проверяет canonical/hreflang, JSON-LD, anchors, template
tokens, localhost URLs, локальные assets и теперь PDF-links: каждый документ из
equipment-section обязан существовать в `dist/documents/`. Local production
preview вернул `200` для Calculator HY/RU/EN и статический HTML содержит
coordinate fallback, mounting/area controls, cache-status и real-contact fallback.

Automated interactive browser smoke, свежие screenshots и Lighthouse в этом
окружении не засчитываются как пройденные: доступный browser runner не смог
инициализироваться из-за локальной ошибки runtime. Это не маскируется как
успешная проверка. После Pages deploy обязательно вручную пройти шаги карты,
keyboard-only flow, upload/remove, Passport, Offer Checker и viewport 320–1440,
затем снять Lighthouse на реальном origin.

## 11. Build и performance

Fresh production build: homepage enhancement is 0.11 KB gzip (plus shared
navigation/scroller chunks), full Calculator `main` is 13.45 KB gzip + shared
domain chunk 4.14 KB gzip, CSS 11.87 KB gzip; Leaflet 43.38 KB gzip remains a
lazy chunk and the separate Offer Checker enhancement is 1.54 KB gzip. The four
PDFs are only fetched after a visitor opens a documentation link.

The 31.08 Lighthouse table in `reports/lighthouse/*-p1.json` belongs to the
pre-separation layout and is intentionally not reused as a score for this
revision. The next trustworthy lab audit must run against a newly deployed
staging revision. It is a lab measurement, never a production CWV guarantee.

## 12. Launch blockers и следующие три шага

1. Bind `PVGIS_CACHE` and add a non-public `PVGIS_CACHE_SALT` secret in
   Cloudflare Pages. Until then the live potential/analysis endpoints correctly
   remain disabled. An approved geocoder, tariff source/revision, CRM and
   Turnstile credentials remain optional future integrations.
2. Keep the supplied manufacturer sheets current and separately provide
   publishable company-registration, installer-authorisation, insurance and
   warranty documents if those claims are to appear on the site. Replace every
   illustrative project/photo/review/price with approved evidence; complete
   Armenian native proofreading and legal approval for Privacy/Terms.
3. Confirm the new Pages deployment separately from Git push, run the live
   manual-point → PVGIS → roof → Passport smoke with configured KV, then repeat
   browser/keyboard/mobile checks and Lighthouse on the real origin.
