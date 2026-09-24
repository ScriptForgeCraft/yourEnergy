const origin = 'https://yourenergy.am';

export const renderSitemap = (pages) => {
  const published = pages.filter(({ indexable }) => indexable);
  const entries = published.map((page) => {
    const siblings = published.filter(
      (candidate) =>
        candidate.kind === page.kind &&
        candidate.slug === page.slug &&
        candidate.article?.hy.slug === page.article?.hy.slug
    );
    const alternates = [
      ...siblings.map(({ locale, path }) => [locale, path]),
      ['x-default', siblings.find(({ locale }) => locale === 'hy').path]
    ];
    return `  <url>\n    <loc>${origin}${page.path}</loc>\n${alternates
      .map(
        ([locale, path]) =>
          `    <xhtml:link rel="alternate" hreflang="${locale}" href="${origin}${path}" />`
      )
      .join('\n')}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
};
