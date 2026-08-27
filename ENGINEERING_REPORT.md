# YOURENERGY — engineering handoff

Дата проверки: 27 августа 2026. Проект локальный; деплой в этот этап не входит.

## 1. Структура

Vite MPA генерирует полноценные HTML-документы из Handlebars до запуска браузера: армянская homepage — `/`, русская — `/ru/`. Также созданы `/privacy/`, `/terms/`, `/soon/` и локализованные RU-версии. Все вспомогательные страницы `noindex`.

## 2. Визуальное соответствие референсу

Сохранены ключевые приёмы: асимметричный hero, Roof Scan c картой/панелями, Solar Passport, тёмная trust-полоса, три решения, редакционная лента проектов, шестишаговый процесс, navy investment section и плотный footer. Намеренное отличие: неподтверждённые проекты, люди, контакты, тарифы и отзывы не выданы за реальные — они имеют видимые demo/illustrative labels.

## 3. Зависимости

Runtime-зависимость только `leaflet`; она подгружается отдельным chunk после load/по взаимодействию. Dev-зависимости: Vite, Handlebars, Sharp, ESLint, `@eslint/js`, globals и Prettier. Локальный Lucide sprite указан в `THIRD_PARTY_NOTICES.md`.

## 4. Реализованный функционал

Работают sticky/mobile navigation, переключение HY/RU обычными ссылками, калькулятор, отмена предыдущего анализа, динамическое обновление всех результатов, upload/drop/remove файла, native Passport dialog с Escape/focus return, native `<details>` решений и FAQ, scroll-snap проектов/отзывов, финальный CTA, chart focus labels и Leaflet Roof Scan.

## 5. Модель расчёта

Базовая demo-модель «Оптимальный»: 17 × 580 W = 9,86 kWp; 14 600 kWh/год; 4 300 000 ֏; 720 000 ֏/год; 5,97 года (`≈ 6,0` в UI); net timeline −4,3 млн / −0,7 млн / +20 тыс. / +2,9 млн / +13,7 млн; gross savings 18,0 млн ֏. Адрес не геокодируется. Arabkir, Abovyan и Ararat выбираются только по demo keywords; всё остальное — стандартный профиль Еревана.

## 6. Demo-зоны и честные ограничения

Фото, имена, отзывы, проекты, расчёты, оборудование, номера телефона и email — демонстрационные. Контакты не являются ссылками и исключены из structured data. Модель не учитывает рост тарифа, деградацию, обслуживание, кредит или дисконтирование. ENA/PVGIS обозначены только как будущие интеграции.

## 7. Assets

Созданы оригинальные illustrative assets: aerial roof, четыре объекта, инженер и social-preview. Исходники находятся в `assets/source/`, responsive AVIF/WebP/JPEG — в `public/images/`; замена описана в `ASSETS.md`. Hero AVIF 1600 px — 119 208 B, то есть меньше установленного лимита 250 KB.

## 8. Future API / env

`HomeAnalysisService.analyze(input, { signal })` разделён от UI и возвращает единый `HomeAnalysis`. Ошибки: `INVALID_INPUT`, `ABORTED`, `UNAVAILABLE`; обновление публикует `solar:analysis-updated`. В `.env.example` оставлены только публичные будущие endpoint-переменные: analysis, geocoding, tariffs, optional map tiles и attribution. Секреты/production credentials во frontend не допускаются.

## 9. SEO

Есть canonical `https://yourenergy.am/` и `/ru/`, reciprocal `hy`, `ru`, `x-default` hreflang, локализованные title/description/OG/X, sitemap только с двумя homepage и `robots.txt`. JSON-LD содержит только WebSite, Organization, Service и отображаемый FAQ. В support routes установлен `noindex`.

## 10. Accessibility

Проверены landmarks, skip-link, один H1 на страницу, lang HY/RU, labels/errors/live regions, focus-visible, 44 px controls, Escape, native dialog, native details, reduced motion, chart labels/table и JS-off fallback. В финальном Lighthouse accessibility — 100 для всех четырёх прогонов.

## 11. Build, QA и performance

`npm test` — 7/7; `npm run lint`, `npm run format:check`, `npm run build`, `npm run verify:build` — успешно. Post-build verifier прошёл все 8 routes, каноникалы/hreflang/JSON-LD/anchors/assets. Browser smoke проверил menu, language navigation, calculator, upload errors/remove, dialog, solutions, projects, testimonials, FAQ, CTA, Leaflet, JS-off, console и overflow на 320/375/430/768/1024/1280/1440/1728 px.

Локальный production-preview Lighthouse (375 и 1440 px):

| Route / viewport | Performance | A11y | Best practices | SEO | FCP / LCP / TBT / CLS      |
| ---------------- | ----------: | ---: | -------------: | --: | -------------------------- |
| HY 375           |          98 |  100 |            100 | 100 | 0,9 s / 1,3 s / 170 ms / 0 |
| RU 375           |         100 |  100 |            100 | 100 | 0,9 s / 1,2 s / 0 ms / 0   |
| HY 1440          |          93 |  100 |            100 | 100 | 0,9 s / 1,7 s / 0 ms / 0   |
| RU 1440          |          93 |  100 |            100 | 100 | 0,9 s / 1,7 s / 0 ms / 0   |

Это lab-результаты локального Vite preview, а не гарантия production CWV. Initial app JS: 5,96 KB gzip; CSS: 7,78 KB gzip; Leaflet остаётся отдельным lazy chunk: 43,38 KB gzip. Финальные full-page screenshots сохранены в `reports/screenshots/` как `hy-375-final.jpg`, `hy-1440-final.jpg`, `ru-375-final.jpg`, `ru-1440-final.jpg`.

## 12. Перед запуском и следующие три шага

Launch blockers: native proofreading армянского текста, юридическое утверждение Privacy/Terms, подтверждённые контакты/проекты/тарифы/согласия на фото.

1. Заменить все demo records и assets на верифицированные данные по чек-листу `ASSETS.md`.
2. Подключить безопасный backend adapter для геокодирования, solar-analysis и тарифов; сохранить честные source/assumption disclosures.
3. Провести legal + Armenian native review, настроить CDN/cache headers и повторить Lighthouse на staging/production origin.
