export const ALLOWED_DEPICTION_POLICIES = Object.freeze([
  'anonymous-back-facing',
  'identified-approved',
  'silhouette-only',
  'stylized-faceless',
]);

export const ALLOWED_CHARACTER_STATUSES = Object.freeze([
  'draft',
  'review',
  'approved',
  'blocked',
]);

export const ALLOWED_VISUAL_RENDERING_MODES = Object.freeze([
  'faceless',
  'stylized',
  'faceless-stylized',
  'silhouette',
]);

export const REQUIRED_CANON_PROHIBITED_VARIANTS = Object.freeze([
  'sacred-figure',
  'real-person-likeness',
]);

export const REQUIRED_CANON_GUARD_RULES = Object.freeze(['CAN-0004', 'CAN-0011']);

export const MOONWITNESS_XII_REQUIRED_IDS = Object.freeze([
  'rocksoul-witness',
  'isrockfeel-punk',
  'walterwhite-engineer',
  'fourlah-batteries',
]);

export const EXTENDED_LORE_REQUIRED_IDS = Object.freeze([
  'the-shadow',
  'baby-doll',
  'blue-witch',
  'dogs-from-universe',
  'dj-david',
  'electric-forest',
  'indestructible',
  'the-listener',
]);

export const ROCKSOUL_LORE_REQUIRED_IDS = Object.freeze([
  ...MOONWITNESS_XII_REQUIRED_IDS,
  ...EXTENDED_LORE_REQUIRED_IDS,
]);

export const ROCKSOUL_REQUIRED_CAP_MODES = Object.freeze([
  'green-mercy',
  'black-resolve',
]);

const ALLOWED_DEPICTION = new Set(ALLOWED_DEPICTION_POLICIES);
const ALLOWED_STATUS = new Set(ALLOWED_CHARACTER_STATUSES);
const ALLOWED_RENDERING_MODES = new Set(ALLOWED_VISUAL_RENDERING_MODES);
const ALLOWED_LORE_GROUPS = new Set(['moonwitness-xii', 'rocksoul-extended']);

const CAN_0011_FORBIDDEN_PATTERNS = Object.freeze([
  /\ballah\b/iu,
  /\bprophet\s+muhammad\b/iu,
  /\bnabi\s+muhammad\b/iu,
  /\bmuhammad\b/iu,
  /\bmohammad\b/iu,
  /\bmohammed\b/iu,
  /\brasulullah\b/iu,
  /\bnabi\s+isa\b/iu,
  /\bisa\s+al[-\s]?masih\b/iu,
  /\bisa\b/iu,
  /\byesus\b/iu,
  /\bjesus\b/iu,
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value, filePath, fieldPath) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${filePath}: ${fieldPath} must be a non-empty string`);
  }
}

function assertStringArray(value, filePath, fieldPath, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    throw new Error(`${filePath}: ${fieldPath} must be an array`);
  }
  if (nonEmpty && value.length === 0) {
    throw new Error(`${filePath}: ${fieldPath} must be a non-empty array`);
  }
  for (const [itemIndex, item] of value.entries()) {
    assertNonEmptyString(item, filePath, `${fieldPath}[${itemIndex}]`);
  }
}

export function validateCan0011Text(value, filePath = 'character-registry.json', fieldPath = 'field') {
  if (typeof value === 'string') {
    for (const pattern of CAN_0011_FORBIDDEN_PATTERNS) {
      if (pattern.test(value)) {
        throw new Error(
          `${filePath}: ${fieldPath} violates CAN-0011 sacred visual boundary (forbidden sacred figure depiction reference)`
        );
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const [idx, entry] of value.entries()) {
      validateCan0011Text(entry, filePath, `${fieldPath}[${idx}]`);
    }
  }
}

function checkCan0011Fields(character, filePath, field) {
  for (const key of [
    'id',
    'characterId',
    'name',
    'displayName',
    'callsign',
    'title',
    'role',
    'silhouette',
    'outfit',
    'summary',
    'visualPrompt',
  ]) {
    if (character[key] !== undefined) {
      validateCan0011Text(character[key], filePath, `${field}.${key}`);
    }
  }
  if (Array.isArray(character.aliases)) {
    validateCan0011Text(character.aliases, filePath, `${field}.aliases`);
  }
  if (Array.isArray(character.dialogueLines)) {
    validateCan0011Text(character.dialogueLines, filePath, `${field}.dialogueLines`);
  }
  if (Array.isArray(character.capModes)) {
    for (const [idx, mode] of character.capModes.entries()) {
      if (typeof mode === 'string') {
        validateCan0011Text(mode, filePath, `${field}.capModes[${idx}]`);
      } else if (isPlainObject(mode)) {
        for (const modeKey of ['id', 'label', 'semanticTheme', 'visualCue']) {
          if (mode[modeKey] !== undefined) {
            validateCan0011Text(mode[modeKey], filePath, `${field}.capModes[${idx}].${modeKey}`);
          }
        }
      }
    }
  }
}

export function validateRocksoulCapModes(character, filePath = 'character-registry.json', field = 'character') {
  const id = character.id ?? character.characterId;
  const isRocksoul = id === 'rocksoul-witness';
  if (character.capModes === undefined) {
    if (isRocksoul) {
      throw new Error(
        `${filePath}: ${field}.capModes is required for rocksoul-witness (${ROCKSOUL_REQUIRED_CAP_MODES.join(', ')})`
      );
    }
    return;
  }

  if (!Array.isArray(character.capModes) || character.capModes.length === 0) {
    throw new Error(`${filePath}: ${field}.capModes must be a non-empty array`);
  }

  const seenModes = new Set();
  for (const [index, mode] of character.capModes.entries()) {
    const modeField = `${field}.capModes[${index}]`;
    let modeId;
    if (typeof mode === 'string') {
      assertNonEmptyString(mode, filePath, modeField);
      modeId = mode.trim();
    } else if (isPlainObject(mode)) {
      assertNonEmptyString(mode.id, filePath, `${modeField}.id`);
      assertNonEmptyString(mode.label, filePath, `${modeField}.label`);
      assertNonEmptyString(mode.capColor, filePath, `${modeField}.capColor`);
      assertNonEmptyString(mode.visualCue, filePath, `${modeField}.visualCue`);
      if (mode.paletteTokens !== undefined) {
        assertStringArray(mode.paletteTokens, filePath, `${modeField}.paletteTokens`, { nonEmpty: true });
      }
      modeId = mode.id.trim();
    } else {
      throw new Error(`${filePath}: ${modeField} must be a non-empty string or mode descriptor object`);
    }
    if (seenModes.has(modeId)) {
      throw new Error(`${filePath}: ${modeField} duplicates cap mode ${modeId}`);
    }
    seenModes.add(modeId);
  }

  if (isRocksoul) {
    for (const requiredMode of ROCKSOUL_REQUIRED_CAP_MODES) {
      if (!seenModes.has(requiredMode)) {
        throw new Error(
          `${filePath}: ${field}.capModes must include ${requiredMode} for rocksoul-witness`
        );
      }
    }
  }
}

export function validateCanonGuardMetadata(
  character,
  filePath = 'character-registry.json',
  field = 'character',
  options = {}
) {
  const requireGuards = Boolean(options.requireGuards);
  const hasAnyCanonMetadata =
    requireGuards ||
    character.canonLevel !== undefined ||
    character.autoMergeForbidden !== undefined ||
    character.canonGuard !== undefined;

  if (character.canonLevel !== undefined || requireGuards) {
    if (character.canonLevel !== 'lore') {
      throw new Error(
        `${filePath}: ${field}.canonLevel must be 'lore' (CAN-0005 lore canon tagging)`
      );
    }
  }

  if (character.autoMergeForbidden !== undefined || requireGuards) {
    if (character.autoMergeForbidden !== true) {
      throw new Error(
        `${filePath}: ${field}.autoMergeForbidden must be true (CAN-0004 alias non-auto-merge)`
      );
    }
  }

  if (hasAnyCanonMetadata && Array.isArray(character.prohibitedVariants)) {
    for (const requiredVariant of REQUIRED_CANON_PROHIBITED_VARIANTS) {
      if (!character.prohibitedVariants.includes(requiredVariant)) {
        throw new Error(
          `${filePath}: ${field}.prohibitedVariants must include '${requiredVariant}' for CAN-0004/CAN-0011 enforcement`
        );
      }
    }
  }

  if (character.canonGuard === undefined) {
    if (requireGuards) {
      throw new Error(
        `${filePath}: ${field}.canonGuard metadata object is required for CAN-0004/CAN-0011 compliance`
      );
    }
    return;
  }

  const guard = character.canonGuard;
  const guardField = `${field}.canonGuard`;
  if (!isPlainObject(guard)) {
    throw new Error(`${filePath}: ${guardField} must be an object`);
  }
  if (guard.canonLevel !== 'lore') {
    throw new Error(`${filePath}: ${guardField}.canonLevel must be 'lore'`);
  }
  if (guard.autoMergeForbidden !== true) {
    throw new Error(`${filePath}: ${guardField}.autoMergeForbidden must be true`);
  }
  assertStringArray(guard.rules, filePath, `${guardField}.rules`, { nonEmpty: true });
  for (const requiredRule of REQUIRED_CANON_GUARD_RULES) {
    if (!guard.rules.includes(requiredRule)) {
      throw new Error(`${filePath}: ${guardField}.rules must include ${requiredRule}`);
    }
  }
  if (!ALLOWED_RENDERING_MODES.has(guard.visualRenderingMode)) {
    throw new Error(
      `${filePath}: ${guardField}.visualRenderingMode must be one of ${ALLOWED_VISUAL_RENDERING_MODES.join(', ')}`
    );
  }
  for (const boolKey of [
    'facelessOrStylizedOnly',
    'photorealismForbidden',
    'realPersonLikenessForbidden',
    'sacredDepictionForbidden',
  ]) {
    if (guard[boolKey] !== true) {
      throw new Error(`${filePath}: ${guardField}.${boolKey} must be true`);
    }
  }
  assertStringArray(guard.prohibitedVariants, filePath, `${guardField}.prohibitedVariants`, {
    nonEmpty: true,
  });
  for (const requiredVariant of REQUIRED_CANON_PROHIBITED_VARIANTS) {
    if (!guard.prohibitedVariants.includes(requiredVariant)) {
      throw new Error(
        `${filePath}: ${guardField}.prohibitedVariants must include '${requiredVariant}'`
      );
    }
  }
  assertNonEmptyString(guard.rationale, filePath, `${guardField}.rationale`);
  validateCan0011Text(guard.rationale, filePath, `${guardField}.rationale`);
}

export function validateCharacterRegistry(
  registry,
  filePath = 'character-registry.json',
  options = {}
) {
  const byId = new Map();
  if (!isPlainObject(registry)) {
    throw new Error(`${filePath}: registry must be an object`);
  }
  if (registry.schemaVersion !== 1) {
    throw new Error(`${filePath}: schemaVersion must be 1`);
  }
  if (!Array.isArray(registry.characters)) {
    throw new Error(`${filePath}: characters must be an array`);
  }

  const requireGuards = Boolean(options.requireCanonGuards || registry.requireCanonGuards);

  for (const [index, character] of registry.characters.entries()) {
    const field = `characters[${index}]`;
    if (!isPlainObject(character)) {
      throw new Error(`${filePath}: ${field} must be an object`);
    }
    for (const key of [
      'characterId',
      'role',
      'depictionPolicy',
      'silhouette',
      'outfit',
      'proportions',
      'license',
      'status',
    ]) {
      assertNonEmptyString(character[key], filePath, `${field}.${key}`);
    }
    for (const key of [
      'paletteTokens',
      'allowedVariants',
      'prohibitedVariants',
      'masterAssetIds',
      'variantAssetIds',
    ]) {
      assertStringArray(character[key], filePath, `${field}.${key}`);
    }
    if (!ALLOWED_DEPICTION.has(character.depictionPolicy)) {
      throw new Error(
        `${filePath}: ${field}.depictionPolicy must be one of ${ALLOWED_DEPICTION_POLICIES.join(', ')}`
      );
    }
    if (!ALLOWED_STATUS.has(character.status)) {
      throw new Error(
        `${filePath}: ${field}.status must be draft, review, approved, or blocked`
      );
    }
    const id = character.characterId;
    if (byId.has(id)) {
      throw new Error(`${filePath}: ${field}.characterId duplicates ${byId.get(id)}`);
    }
    byId.set(id, index);
    if (character.masterAssetIds.some((assetId) => character.variantAssetIds.includes(assetId))) {
      throw new Error(`${filePath}: ${field} master and variant asset ids must not overlap`);
    }

    checkCan0011Fields(character, filePath, field);
    validateCanonGuardMetadata(character, filePath, field, { requireGuards });
    if (requireGuards || character.capModes !== undefined) {
      validateRocksoulCapModes(character, filePath, field);
    }
  }
  return { characterCount: registry.characters.length, characterIds: [...byId.keys()] };
}

export function validateLoreCastRoster(
  roster,
  filePath = 'rocksoul-lore-roster',
  options = {}
) {
  if (!Array.isArray(roster) || roster.length === 0) {
    throw new Error(`${filePath}: lore roster must be a non-empty array`);
  }

  const byId = new Map();
  let moonwitnessXiiCount = 0;
  let extendedLoreCount = 0;

  for (const [index, entry] of roster.entries()) {
    const field = `roster[${index}]`;
    if (!isPlainObject(entry)) {
      throw new Error(`${filePath}: ${field} must be an object`);
    }

    const id = entry.id ?? entry.characterId;
    assertNonEmptyString(id, filePath, `${field}.id`);
    if (byId.has(id)) {
      throw new Error(`${filePath}: ${field}.id duplicates ${byId.get(id)}`);
    }
    byId.set(id, index);

    for (const key of [
      'name',
      'displayName',
      'callsign',
      'canonRecordId',
      'title',
      'silhouette',
      'outfit',
      'summary',
    ]) {
      assertNonEmptyString(entry[key], filePath, `${field}.${key}`);
    }

    if (!ALLOWED_LORE_GROUPS.has(entry.loreGroup)) {
      throw new Error(
        `${filePath}: ${field}.loreGroup must be moonwitness-xii or rocksoul-extended`
      );
    }
    if (entry.loreGroup === 'moonwitness-xii') {
      moonwitnessXiiCount += 1;
    } else {
      extendedLoreCount += 1;
    }

    if (!ALLOWED_DEPICTION.has(entry.depictionPolicy)) {
      throw new Error(
        `${filePath}: ${field}.depictionPolicy must be one of ${ALLOWED_DEPICTION_POLICIES.join(', ')}`
      );
    }
    if (!ALLOWED_STATUS.has(entry.status)) {
      throw new Error(
        `${filePath}: ${field}.status must be draft, review, approved, or blocked`
      );
    }

    assertStringArray(entry.aliases, filePath, `${field}.aliases`, { nonEmpty: true });
    assertStringArray(entry.paletteTokens, filePath, `${field}.paletteTokens`, { nonEmpty: true });
    assertStringArray(entry.prohibitedVariants, filePath, `${field}.prohibitedVariants`, {
      nonEmpty: true,
    });

    checkCan0011Fields(entry, filePath, field);
    validateCanonGuardMetadata(entry, filePath, field, { requireGuards: true });
    validateRocksoulCapModes(entry, filePath, field);
  }

  const requiredIds = Array.isArray(options.requiredIds)
    ? options.requiredIds
    : options.requireFullLoreCast
      ? ROCKSOUL_LORE_REQUIRED_IDS
      : [];

  for (const requiredId of requiredIds) {
    if (!byId.has(requiredId)) {
      throw new Error(`${filePath}: missing required lore character '${requiredId}'`);
    }
  }

  return {
    characterCount: roster.length,
    characterIds: [...byId.keys()],
    moonwitnessXiiCount,
    extendedLoreCount,
  };
}

export function assertCan0004NoAliasAutoMerge(alias, roster) {
  const normalized = String(alias ?? '').trim().toLowerCase();
  const matchedCharacterIds = [];
  if (Array.isArray(roster) && normalized.length > 0) {
    for (const entry of roster) {
      if (!isPlainObject(entry)) continue;
      const id = entry.id ?? entry.characterId;
      const candidates = [
        entry.name,
        entry.displayName,
        entry.callsign,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
      ];
      if (
        typeof id === 'string' &&
        candidates.some((item) => typeof item === 'string' && item.trim().toLowerCase() === normalized)
      ) {
        matchedCharacterIds.push(id);
      }
    }
  }
  return {
    alias,
    matchedCharacterIds,
    autoMergeAllowed: false,
    rule: 'CAN-0004',
  };
}
