// Shared operational hours for every public touchpoint. Keep office and
// communication availability distinct so the footer cannot contradict a
// location card.
export const CONTACT_HOURS = Object.freeze({
  hy: Object.freeze({
    office: 'Երկ–Ուրբ՝ 09:00–18:00 · Շբ՝ 10:00–15:00',
    footer: 'Երկ–Ուրբ 09:00–18:00'
  }),
  ru: Object.freeze({
    office: 'Пн–Пт: 09:00–18:00 · Сб: 10:00–15:00',
    footer: 'Пн–Пт 09:00–18:00'
  }),
  en: Object.freeze({
    office: 'Mon–Fri: 09:00–18:00 · Sat: 10:00–15:00',
    footer: 'Mon–Fri 09:00–18:00'
  })
});
