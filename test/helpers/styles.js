import { readFile } from 'node:fs/promises';

export const readStylesheet = async (url) => {
  const css = await readFile(url, 'utf8');
  const imports = [...css.matchAll(/@import ['"]([^'"]+)['"];/gu)];
  const children = await Promise.all(imports.map(([, path]) => readStylesheet(new URL(path, url))));
  return children.join('\n') + css;
};
