import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./json-import-loader.mjs', pathToFileURL('./scripts/'));
