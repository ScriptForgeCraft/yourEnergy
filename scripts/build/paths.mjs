import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const siteRoot = resolve(projectRoot, '.generated/site');
export const publicRoot = resolve(projectRoot, '.generated/public');
export const distRoot = resolve(projectRoot, 'dist');
