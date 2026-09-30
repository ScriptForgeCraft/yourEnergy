import assert from 'node:assert/strict';
import test from 'node:test';

import { loadBlogArticles } from '../src/content/blog.js';
import { createArticleSearchIndex, matchesArticleSearch } from '../src/domain/article-search.js';

test('article search accepts Russian, transliterated and wrong-layout queries', () => {
  const russianIndex = createArticleSearchIndex('Солнечные панели для дома');

  assert.equal(matchesArticleSearch(russianIndex, 'солнечные панели'), true);
  assert.equal(matchesArticleSearch(russianIndex, 'solnechnye paneli'), true);
  assert.equal(matchesArticleSearch(russianIndex, 'cjkytxyst gfytkb'), true);
  assert.equal(matchesArticleSearch(russianIndex, 'ветряная турбина'), false);
});

test('article search accepts English text entered with a Russian keyboard layout', () => {
  const englishIndex = createArticleSearchIndex('Solar panels for a home');

  assert.equal(matchesArticleSearch(englishIndex, 'solar panels'), true);
  assert.equal(matchesArticleSearch(englishIndex, 'ыщдфк зфтуды'), true);
});

test('each localized article exposes compact search aliases from its translations', async () => {
  const [article] = await loadBlogArticles();

  assert.match(article.ru.searchAliases, /Solar Power for a Home/u);
  assert.match(article.en.searchAliases, /Солнечная электростанция/u);
});
