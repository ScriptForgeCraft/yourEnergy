const CYRILLIC_TO_LATIN = Object.freeze({
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
});

const LATIN_KEYBOARD_TO_CYRILLIC = Object.freeze({
  q: 'й',
  w: 'ц',
  e: 'у',
  r: 'к',
  t: 'е',
  y: 'н',
  u: 'г',
  i: 'ш',
  o: 'щ',
  p: 'з',
  '[': 'х',
  ']': 'ъ',
  a: 'ф',
  s: 'ы',
  d: 'в',
  f: 'а',
  g: 'п',
  h: 'р',
  j: 'о',
  k: 'л',
  l: 'д',
  ';': 'ж',
  "'": 'э',
  z: 'я',
  x: 'ч',
  c: 'с',
  v: 'м',
  b: 'и',
  n: 'т',
  m: 'ь',
  ',': 'б',
  '.': 'ю'
});

const CYRILLIC_KEYBOARD_TO_LATIN = Object.freeze(
  Object.fromEntries(
    Object.entries(LATIN_KEYBOARD_TO_CYRILLIC).map(([latin, cyrillic]) => [cyrillic, latin])
  )
);

const replaceCharacters = (value, replacements) =>
  [...value].map((character) => replacements[character] ?? character).join('');

/**
 * Makes search input consistent across punctuation, case and accents. In
 * particular, Russian е and ё are intentionally treated as the same letter.
 */
export const normalizeArticleSearchText = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');

const transliterateCyrillicToLatin = (value) =>
  replaceCharacters(normalizeArticleSearchText(value), CYRILLIC_TO_LATIN);

/**
 * Prepares text once per card. Besides its original form it includes a
 * Russian-to-Latin form, so a query such as "solnechnye paneli" finds
 * "солнечные панели" without a third-party client-side search dependency.
 */
export const createArticleSearchIndex = (...sources) => {
  const normalized = normalizeArticleSearchText(sources.filter(Boolean).join(' '));
  const transliterated = transliterateCyrillicToLatin(normalized);
  return [normalized, transliterated].filter(Boolean).join(' ');
};

const queryForms = (query) => {
  const rawQuery = String(query ?? '').toLocaleLowerCase();
  const normalized = normalizeArticleSearchText(rawQuery);
  if (!normalized) return [];
  return [
    normalized,
    transliterateCyrillicToLatin(normalized),
    normalizeArticleSearchText(replaceCharacters(rawQuery, LATIN_KEYBOARD_TO_CYRILLIC)),
    normalizeArticleSearchText(replaceCharacters(rawQuery, CYRILLIC_KEYBOARD_TO_LATIN))
  ].filter((form, index, forms) => form && forms.indexOf(form) === index);
};

/**
 * Matches every word of a query independently, making word order and common
 * separators irrelevant. The keyboard-layout forms also recover a Russian or
 * English word entered while the other layout was active.
 */
export const matchesArticleSearch = (index, query) => {
  const searchableText = normalizeArticleSearchText(index);
  if (!searchableText) return false;
  return queryForms(query).some((form) =>
    form.split(' ').every((term) => searchableText.includes(term))
  );
};
