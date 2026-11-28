import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  assertCan0004NoAliasAutoMerge,
  EXTENDED_LORE_REQUIRED_IDS,
  MOONWITNESS_XII_REQUIRED_IDS,
  ROCKSOUL_LORE_REQUIRED_IDS,
  validateCharacterRegistry,
  validateLoreCastRoster,
} from '../scripts/character-registry-schema.mjs';

const validRegistry = {
  schemaVersion: 1,
  pack: 'moon-city',
  domain: 'visual-universe',
  description: 'Canonical recurring character registry.',
  characters: [
    {
      characterId: 'crew-01',
      role: 'crew-member',
      depictionPolicy: 'anonymous-back-facing',
      silhouette: 'hooded crew figure, adult proportions, standard build',
      outfit: 'industrial workwear shirt and trousers',
      paletteTokens: ['ink-900', 'paper-white'],
      proportions: 'standard adult',
      signatureProps: ['tool-satchel', 'crew-badge'],
      allowedVariants: ['idle-standing', 'waving'],
      prohibitedVariants: ['recognizable-face', 'sacred-figure', 'real-person-likeness'],
      masterAssetIds: [],
      variantAssetIds: [],
      license: 'ISC',
      status: 'review',
    },
  ],
};

function makeGuardedLoreAssetEntry(overrides = {}) {
  return {
    characterId: 'rocksoul-witness',
    role: 'primary-resonance-witness',
    depictionPolicy: 'stylized-faceless',
    silhouette: 'faceless hooded witness with low-pulled green or black baseball cap',
    outfit: 'dual-mode street zine parka with crimson chalk armband',
    paletteTokens: ['ink-black', 'paper-cream', 'mercy-green', 'rocksoul-crimson'],
    proportions: 'stylized anime-cartoon 5.5 heads',
    allowedVariants: ['green-mercy-idle', 'black-resolve-idle'],
    prohibitedVariants: ['recognizable-face', 'photorealistic-face', 'sacred-figure', 'real-person-likeness'],
    masterAssetIds: [],
    variantAssetIds: [],
    license: 'ISC',
    status: 'review',
    canonLevel: 'lore',
    autoMergeForbidden: true,
    capModes: [
      {
        id: 'green-mercy',
        label: 'Green Mercy Cap',
        capColor: 'green',
        paletteTokens: ['ink-black', 'mercy-green', 'signal-yellow'],
        visualCue: 'Low-brim green mercy cap over faceless shadow',
      },
      {
        id: 'black-resolve',
        label: 'Black Resolve Cap',
        capColor: 'black',
        paletteTokens: ['ink-black', 'rocksoul-crimson', 'signal-yellow'],
        visualCue: 'Matte black resolve cap with crimson chalk under-brim',
      },
    ],
    canonGuard: {
      canonLevel: 'lore',
      autoMergeForbidden: true,
      rules: ['CAN-0004', 'CAN-0005', 'CAN-0011'],
      visualRenderingMode: 'faceless-stylized',
      facelessOrStylizedOnly: true,
      photorealismForbidden: true,
      realPersonLikenessForbidden: true,
      sacredDepictionForbidden: true,
      prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'photorealistic-face'],
      rationale: 'Faceless stylized lore witness obeying CAN-0004 alias isolation and CAN-0011 boundary.',
    },
    ...overrides,
  };
}

test('validates a canonical character registry', () => {
  assert.deepEqual(validateCharacterRegistry(validRegistry), {
    characterCount: 1,
    characterIds: ['crew-01'],
  });
});

test('rejects missing required fields', () => {
  const broken = JSON.parse(JSON.stringify(validRegistry));
  delete broken.characters[0].silhouette;
  assert.throws(
    () => validateCharacterRegistry(broken),
    /characters\[0\].silhouette must be a non-empty string/u
  );
});

test('rejects unknown depiction policy and status', () => {
  const bad = JSON.parse(JSON.stringify(validRegistry));
  bad.characters[0].depictionPolicy = 'recognizable-face';
  assert.throws(() => validateCharacterRegistry(bad), /depictionPolicy must be one of/u);
  bad.characters[0].depictionPolicy = 'anonymous-back-facing';
  bad.characters[0].status = 'published';
  assert.throws(
    () => validateCharacterRegistry(bad),
    /status must be draft, review, approved, or blocked/u
  );
});

test('rejects duplicate character IDs', () => {
  const duplicate = JSON.parse(JSON.stringify(validRegistry));
  duplicate.characters.push({ ...duplicate.characters[0] });
  assert.throws(() => validateCharacterRegistry(duplicate), /characterId duplicates 0/u);
});

test('validates the checked-in registry', () => {
  const registry = JSON.parse(
    readFileSync(
      new URL('../source/world/characters/character-registry.json', import.meta.url),
      'utf8'
    )
  );
  assert.deepEqual(validateCharacterRegistry(registry), {
    characterCount: 4,
    characterIds: ['crew-01', 'kuro-signal', 'vesper-ink', 'walter-white'],
  });
});

test('validates MoonWitness XII entry with cap modes and CAN-0004/CAN-0011 guard metadata', () => {
  const loreRegistry = {
    schemaVersion: 1,
    requireCanonGuards: true,
    characters: [makeGuardedLoreAssetEntry()],
  };
  assert.deepEqual(validateCharacterRegistry(loreRegistry, 'lore-registry.json', { requireCanonGuards: true }), {
    characterCount: 1,
    characterIds: ['rocksoul-witness'],
  });
});

test('enforces canonLevel=lore, autoMergeForbidden=true, cap modes, and CAN-0011 sacred boundary', () => {
  const nonLore = {
    schemaVersion: 1,
    characters: [makeGuardedLoreAssetEntry({ canonLevel: 'published' })],
  };
  assert.throws(() => validateCharacterRegistry(nonLore), /canonLevel must be 'lore'/u);

  const allowMerge = {
    schemaVersion: 1,
    characters: [makeGuardedLoreAssetEntry({ autoMergeForbidden: false })],
  };
  assert.throws(() => validateCharacterRegistry(allowMerge), /autoMergeForbidden must be true/u);

  const missingProhibited = {
    schemaVersion: 1,
    characters: [makeGuardedLoreAssetEntry({ prohibitedVariants: ['real-person-likeness'] })],
  };
  assert.throws(
    () => validateCharacterRegistry(missingProhibited),
    /prohibitedVariants must include 'sacred-figure'/u
  );

  const photoreal = {
    schemaVersion: 1,
    characters: [
      makeGuardedLoreAssetEntry({
        canonGuard: {
          ...makeGuardedLoreAssetEntry().canonGuard,
          photorealismForbidden: false,
        },
      }),
    ],
  };
  assert.throws(() => validateCharacterRegistry(photoreal), /photorealismForbidden must be true/u);

  const missingCap = {
    schemaVersion: 1,
    characters: [
      makeGuardedLoreAssetEntry({
        capModes: [makeGuardedLoreAssetEntry().capModes[0]],
      }),
    ],
  };
  assert.throws(
    () => validateCharacterRegistry(missingCap),
    /capModes must include black-resolve for rocksoul-witness/u
  );

  const sacredViolation = {
    schemaVersion: 1,
    characters: [
      makeGuardedLoreAssetEntry({
        characterId: 'fourlah-batteries',
        capModes: undefined,
        silhouette: 'illustration of Prophet Muhammad in light',
      }),
    ],
  };
  assert.throws(() => validateCharacterRegistry(sacredViolation), /CAN-0011/u);
});

test('UI character-registry preserves 30 Riot squad characters and exports validated MoonWitness XII + Extended Lore rosters', async () => {
  const srcUrl = new URL('../../ui/src/lib/character-registry.ts', import.meta.url);
  const distUrl = new URL('../../ui/dist/lib/character-registry.js', import.meta.url);
  let registryModule;
  try {
    registryModule = await import(srcUrl.href);
  } catch {
    assert.ok(existsSync(distUrl), 'Expected built ui/dist/lib/character-registry.js fallback');
    registryModule = await import(distUrl.href);
  }

  assert.equal(registryModule.CHARACTER_REGISTRY.length, 30);
  assert.equal(registryModule.CHARACTER_FACTIONS.length, 6);
  assert.equal(registryModule.MOONWITNESS_XII_CAST_PROFILES.length, 4);
  assert.equal(registryModule.EXTENDED_LORE_CAST_PROFILES.length, 8);
  assert.equal(registryModule.ROCKSOUL_LORE_ROSTER.length, 12);

  const xiiIds = registryModule.MOONWITNESS_XII_CAST_PROFILES.map((entry) => entry.id);
  assert.deepEqual(xiiIds, [...MOONWITNESS_XII_REQUIRED_IDS]);

  const extendedIds = registryModule.EXTENDED_LORE_CAST_PROFILES.map((entry) => entry.id);
  assert.deepEqual(extendedIds, [...EXTENDED_LORE_REQUIRED_IDS]);

  const validation = validateLoreCastRoster(
    registryModule.ROCKSOUL_LORE_ROSTER,
    'packages/ui/src/lib/character-registry.ts',
    { requireFullLoreCast: true }
  );
  assert.deepEqual(validation, {
    characterCount: 12,
    characterIds: [...ROCKSOUL_LORE_REQUIRED_IDS],
    moonwitnessXiiCount: 4,
    extendedLoreCount: 8,
  });

  assert.equal(registryModule.validateRocksoulLoreRoster().valid, true);

  const rocksoul = registryModule.getLoreCharacterById('rocksoul-witness');
  assert.ok(rocksoul);
  assert.deepEqual(
    rocksoul.capModes.map((mode) => mode.id),
    ['green-mercy', 'black-resolve']
  );
  assert.equal(registryModule.getCharacterById('rocksoul-witness')?.name, 'ROCKSOUL');
  assert.equal(registryModule.getCharacterById('kuro-signal')?.name, 'Kuro');

  for (const entry of registryModule.ROCKSOUL_LORE_ROSTER) {
    assert.equal(entry.canonLevel, 'lore');
    assert.equal(entry.autoMergeForbidden, true);
    assert.equal(entry.canonGuard.facelessOrStylizedOnly, true);
    assert.equal(entry.canonGuard.photorealismForbidden, true);
    assert.equal(entry.canonGuard.sacredDepictionForbidden, true);
    assert.ok(entry.canonGuard.rules.includes('CAN-0004'));
    assert.ok(entry.canonGuard.rules.includes('CAN-0011'));
  }

  const aliasAudit = assertCan0004NoAliasAutoMerge('4-LAH', registryModule.ROCKSOUL_LORE_ROSTER);
  assert.deepEqual(aliasAudit, {
    alias: '4-LAH',
    matchedCharacterIds: ['fourlah-batteries'],
    autoMergeAllowed: false,
    rule: 'CAN-0004',
  });
  assert.deepEqual(registryModule.assertNoLoreAliasAutoMerge('Selector-D'), {
    alias: 'Selector-D',
    matchedCharacterIds: ['dj-david'],
    autoMergeAllowed: false,
    rule: 'CAN-0004',
  });

  const incomplete = registryModule.ROCKSOUL_LORE_ROSTER.slice(0, 11);
  assert.throws(
    () => validateLoreCastRoster(incomplete, 'incomplete-roster', { requireFullLoreCast: true }),
    /missing required lore character 'the-listener'/u
  );
});
