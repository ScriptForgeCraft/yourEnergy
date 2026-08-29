import { cloneSerializable, cleanString, deepFreeze } from './numbers.js';
import { ANALYSIS_SCHEMA_VERSION } from './solar-analysis.js';

export const SOLAR_PASSPORT_SCHEMA_VERSION = '1.0.0';

let passportSequence = 0;

const toIsoTimestamp = (value) => {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  if (!Number.isFinite(date.getTime())) throw new TypeError('createdAt must be a valid date');
  return date.toISOString();
};

/**
 * Generates a process-local ID suitable only for the P0 in-memory repository.
 * It is deliberately not a stable public URL or persistent record identifier.
 */
export const createSolarPassportId = (createdAt = new Date()) => {
  const timestamp = toIsoTimestamp(createdAt).replace(/[-:.TZ]/gu, '');
  passportSequence += 1;
  return `passport-${timestamp}-${passportSequence}`;
};

const ensureAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
    throw new TypeError('analysis must be an object');
  }
  return cloneSerializable(analysis);
};

/**
 * Makes a self-contained, serializable snapshot of one calculation. It carries
 * the exact evidence ledger and assumptions used at creation time, and makes
 * the lack of permanent storage explicit.
 *
 * @param {{analysis: Object, id?: string, createdAt?: string|Date, locale?: string}} input
 * @returns {import('./models.js').SolarPassport}
 */
export const buildSolarPassport = ({ analysis, id, createdAt, locale = 'en' } = {}) => {
  const snapshot = ensureAnalysis(analysis);
  const timestamp = toIsoTimestamp(createdAt);
  const passportId = cleanString(id) ?? createSolarPassportId(timestamp);
  const sourceLedger = Array.isArray(snapshot.sourceLedger) ? snapshot.sourceLedger : [];
  const assumptions = Array.isArray(snapshot.assumptions) ? snapshot.assumptions : [];

  return deepFreeze({
    id: passportId,
    schemaVersion: SOLAR_PASSPORT_SCHEMA_VERSION,
    analysisSchemaVersion: snapshot.schemaVersion ?? ANALYSIS_SCHEMA_VERSION,
    createdAt: timestamp,
    locale: cleanString(locale) ?? 'en',
    persistence: 'memory',
    permanentUrlAvailable: false,
    storageNotice: 'This P0 passport is available only in the current browser session.',
    analysis: snapshot,
    sourceLedger,
    assumptions
  });
};

export class SolarPassportRepository {
  constructor({ clock = () => new Date(), idFactory = createSolarPassportId } = {}) {
    this.clock = clock;
    this.idFactory = idFactory;
    this.passports = new Map();
  }

  /** Creates and stores a P0 memory-only passport. */
  create(analysis, options = {}) {
    const createdAt = options.createdAt ?? this.clock();
    const id = options.id ?? this.idFactory(createdAt);
    const passport = buildSolarPassport({ ...options, analysis, id, createdAt });
    return this.save(passport);
  }

  /** Stores a serializable passport snapshot for this process only. */
  save(passport) {
    if (!passport || typeof passport !== 'object' || !cleanString(passport.id)) {
      throw new TypeError('passport with a non-empty id is required');
    }
    const snapshot = deepFreeze(cloneSerializable(passport));
    this.passports.set(snapshot.id, snapshot);
    return cloneSerializable(snapshot);
  }

  get(id) {
    const passport = this.passports.get(cleanString(id));
    return passport ? cloneSerializable(passport) : null;
  }

  has(id) {
    return this.passports.has(cleanString(id));
  }

  list() {
    return [...this.passports.values()].map(cloneSerializable);
  }

  delete(id) {
    return this.passports.delete(cleanString(id));
  }

  clear() {
    const count = this.passports.size;
    this.passports.clear();
    return count;
  }
}
