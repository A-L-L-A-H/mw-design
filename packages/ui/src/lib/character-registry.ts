export type CharacterFactionId =
  | 'signal-riot'
  | 'neon-arcade'
  | 'arcana-blade'
  | 'mecha-orbit'
  | 'toon-squad'
  | 'eclipse-boss';

export type CharacterArchetype =
  | 'striker'
  | 'vanguard'
  | 'mage'
  | 'support'
  | 'trickster'
  | 'boss';

export type CharacterElement = 'solar' | 'volt' | 'cryo' | 'pyro' | 'void' | 'ink' | 'wind';

export type CharacterRarity = 'rare' | 'epic' | 'legendary' | 'mythic';

export type CharacterMood = 'neutral' | 'happy' | 'surprised' | 'determined' | 'angry' | 'ko';

export type CharacterHairStyle =
  | 'spiky'
  | 'bob'
  | 'twin-tails'
  | 'swept'
  | 'mohawk'
  | 'hood'
  | 'crest'
  | 'pompadour'
  | 'long-wave'
  | 'horns';

export type CharacterEyeStyle = 'sharp' | 'bright' | 'visor' | 'cyclops' | 'star' | 'cat';

export type CharacterAccessory =
  | 'none'
  | 'goggles'
  | 'crown'
  | 'halo'
  | 'horns'
  | 'scarf'
  | 'headphones'
  | 'antenna'
  | 'eyepatch'
  | 'mask';

export type CharacterColorToken =
  | 'yellow'
  | 'magenta'
  | 'cyan'
  | 'violet'
  | 'error'
  | 'success'
  | 'info'
  | 'warning'
  | 'ink'
  | 'paper';

export interface CharacterStats {
  readonly hp: number;
  readonly mp: number;
  readonly atk: number;
  readonly def: number;
  readonly spd: number;
}

export interface CharacterUltimateSkill {
  readonly name: string;
  readonly jpCallout: string;
  readonly quote: string;
  readonly power: number;
}

export interface CharacterVisualTraits {
  readonly hairStyle: CharacterHairStyle;
  readonly eyeStyle: CharacterEyeStyle;
  readonly accessory: CharacterAccessory;
  readonly primaryTone: CharacterColorToken;
  readonly accentTone: CharacterColorToken;
  readonly hairTone: CharacterColorToken;
  readonly badgeMark: string;
}

export interface CharacterProfile {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly title: string;
  readonly faction: CharacterFactionId;
  readonly archetype: CharacterArchetype;
  readonly element: CharacterElement;
  readonly rarity: CharacterRarity;
  readonly isBoss: boolean;
  readonly voicePitch: number;
  readonly defaultMood: CharacterMood;
  readonly stats: CharacterStats;
  readonly ultimate: CharacterUltimateSkill;
  readonly dialogueLines: readonly string[];
  readonly visual: CharacterVisualTraits;
}

export interface CharacterFactionMeta {
  readonly id: CharacterFactionId;
  readonly label: string;
  readonly tagline: string;
  readonly tone: CharacterColorToken;
}

export const CHARACTER_FACTIONS: readonly CharacterFactionMeta[] = Object.freeze([
  Object.freeze({
    id: 'signal-riot',
    label: 'Signal Riot',
    tagline: 'Manga zine rebels fighting with halftone ink and kinetic slogans.',
    tone: 'yellow',
  }),
  Object.freeze({
    id: 'neon-arcade',
    label: 'Neon Arcade',
    tagline: 'Frame-perfect combo fighters wired into high-voltage coin-op grids.',
    tone: 'cyan',
  }),
  Object.freeze({
    id: 'arcana-blade',
    label: 'Arcana Blade',
    tagline: 'JRPG knights and spellweavers forging radiant elemental combos.',
    tone: 'violet',
  }),
  Object.freeze({
    id: 'mecha-orbit',
    label: 'Mecha Orbit',
    tagline: 'Orbital ace pilots deploying visor telemetry and plasma thrusters.',
    tone: 'info',
  }),
  Object.freeze({
    id: 'toon-squad',
    label: 'Toon Squad',
    tagline: 'Saturday-morning squash-and-stretch pranksters bending physics.',
    tone: 'warning',
  }),
  Object.freeze({
    id: 'eclipse-boss',
    label: 'Eclipse Bosses',
    tagline: 'Multi-phase raid overlords engineered for dramatic phase breaks.',
    tone: 'error',
  }),
]);

export const CHARACTER_REGISTRY: readonly CharacterProfile[] = Object.freeze([
  // ── 1. SIGNAL RIOT (5) ─────────────────────────────────────────────────────
  Object.freeze({
    id: 'kuro-signal',
    name: 'Kuro',
    codename: 'MW-01',
    title: 'Ink Striker',
    faction: 'signal-riot',
    archetype: 'striker',
    element: 'ink',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 1.0,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 120, mp: 80, atk: 94, def: 66, spd: 92 }),
    ultimate: Object.freeze({
      name: 'OVERDRIVE INK SLASH',
      jpCallout: '墨閃・オーバードライブ！',
      quote: 'Read the frames—this panel ends now!',
      power: 46,
    }),
    dialogueLines: Object.freeze([
      'All channels locked. Watch the lineweight snap on impact!',
      'Hold your stance—phase two drops faster than 60fps.',
    ]),
    visual: Object.freeze({
      hairStyle: 'spiky',
      eyeStyle: 'sharp',
      accessory: 'scarf',
      primaryTone: 'yellow',
      accentTone: 'magenta',
      hairTone: 'ink',
      badgeMark: '01',
    }),
  }),
  Object.freeze({
    id: 'vesper-ink',
    name: 'Vesper',
    codename: 'MW-02',
    title: 'Halftone Tactician',
    faction: 'signal-riot',
    archetype: 'mage',
    element: 'void',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.18,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 104, mp: 112, atk: 88, def: 62, spd: 86 }),
    ultimate: Object.freeze({
      name: 'SCREENTONE ECLIPSE',
      jpCallout: '網点蝕・ヴェスパー！',
      quote: 'Every shadow on this page belongs to me.',
      power: 44,
    }),
    dialogueLines: Object.freeze([
      'I mapped the boss stagger window down to three frames.',
      'Stack two combo ranks before unleashing the cut-in.',
    ]),
    visual: Object.freeze({
      hairStyle: 'bob',
      eyeStyle: 'cat',
      accessory: 'eyepatch',
      primaryTone: 'violet',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: '02',
    }),
  }),
  Object.freeze({
    id: 'akira-pulse',
    name: 'Akira',
    codename: 'MW-03',
    title: 'Zine Broadcast Ace',
    faction: 'signal-riot',
    archetype: 'support',
    element: 'volt',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.24,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 110, mp: 105, atk: 74, def: 72, spd: 90 }),
    ultimate: Object.freeze({
      name: 'PIRATE SIGNAL BOOST',
      jpCallout: '電波解放・フルボリューム！',
      quote: 'Turn the contrast up—party buffs online!',
      power: 38,
    }),
    dialogueLines: Object.freeze([
      'Audio bus synced! Every button press hits with real punch.',
      'Need a shield or a speed boost? Pick your beat!',
    ]),
    visual: Object.freeze({
      hairStyle: 'twin-tails',
      eyeStyle: 'bright',
      accessory: 'headphones',
      primaryTone: 'magenta',
      accentTone: 'cyan',
      hairTone: 'magenta',
      badgeMark: '03',
    }),
  }),
  Object.freeze({
    id: 'sora-drift',
    name: 'Sora',
    codename: 'MW-04',
    title: 'Speedline Courier',
    faction: 'signal-riot',
    archetype: 'trickster',
    element: 'wind',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.08,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 106, mp: 84, atk: 84, def: 60, spd: 98 }),
    ultimate: Object.freeze({
      name: 'MACH GUTTER DASH',
      jpCallout: '音速コマ割りダッシュ！',
      quote: 'Blink once and I am already in the next chapter!',
      power: 40,
    }),
    dialogueLines: Object.freeze([
      'First turn is always mine—check the ATB strip!',
      'Speedlines look way sharper when you break the speed cap.',
    ]),
    visual: Object.freeze({
      hairStyle: 'swept',
      eyeStyle: 'sharp',
      accessory: 'goggles',
      primaryTone: 'cyan',
      accentTone: 'yellow',
      hairTone: 'info',
      badgeMark: '04',
    }),
  }),
  Object.freeze({
    id: 'ren-halftone',
    name: 'Ren',
    codename: 'MW-05',
    title: 'Pressroom Breaker',
    faction: 'signal-riot',
    archetype: 'vanguard',
    element: 'pyro',
    rarity: 'rare',
    isBoss: false,
    voicePitch: 0.84,
    defaultMood: 'angry',
    stats: Object.freeze({ hp: 144, mp: 64, atk: 86, def: 94, spd: 68 }),
    ultimate: Object.freeze({
      name: 'IRON LITHO SLAM',
      jpCallout: '鉄版粉砕スラム！',
      quote: 'Hit me harder—my guard gauge barely flinched!',
      power: 42,
    }),
    dialogueLines: Object.freeze([
      'Step behind my guard when the boss charges its sweep.',
      'Heavy ink borders were built to absorb impact.',
    ]),
    visual: Object.freeze({
      hairStyle: 'pompadour',
      eyeStyle: 'sharp',
      accessory: 'none',
      primaryTone: 'error',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: '05',
    }),
  }),

  // ── 2. NEON ARCADE (5) ─────────────────────────────────────────────────────
  Object.freeze({
    id: 'volt-09',
    name: 'Volt-09',
    codename: 'ARC-09',
    title: 'Combo Cyber-Monk',
    faction: 'neon-arcade',
    archetype: 'striker',
    element: 'volt',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 0.96,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 118, mp: 86, atk: 96, def: 68, spd: 95 }),
    ultimate: Object.freeze({
      name: 'SSS ARCADE VOLTAGE',
      jpCallout: '雷撃連舞・トリプルエス！',
      quote: 'Insert coin? No—watch a 99-hit zero-drop run!',
      power: 48,
    }),
    dialogueLines: Object.freeze([
      'Chain basic strikes into Heavy to force an instant Break.',
      'Chromatic pulse engaged. Keep the counter climbing!',
    ]),
    visual: Object.freeze({
      hairStyle: 'mohawk',
      eyeStyle: 'visor',
      accessory: 'antenna',
      primaryTone: 'cyan',
      accentTone: 'magenta',
      hairTone: 'cyan',
      badgeMark: '09',
    }),
  }),
  Object.freeze({
    id: 'blaze-kaito',
    name: 'Kaito',
    codename: 'ARC-12',
    title: 'Shoryu Brawler',
    faction: 'neon-arcade',
    archetype: 'striker',
    element: 'pyro',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.92,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 128, mp: 74, atk: 95, def: 74, spd: 88 }),
    ultimate: Object.freeze({
      name: 'CRIMSON RISING DRAGON',
      jpCallout: '紅蓮昇龍拳！',
      quote: 'Hitstop locked—feel the heat of the final frame!',
      power: 47,
    }),
    dialogueLines: Object.freeze([
      'A real fighter never wastes an invincibility window.',
      'Press 2 for Heavy Strike when the stagger bar hits 80%!',
    ]),
    visual: Object.freeze({
      hairStyle: 'spiky',
      eyeStyle: 'sharp',
      accessory: 'scarf',
      primaryTone: 'error',
      accentTone: 'warning',
      hairTone: 'error',
      badgeMark: '12',
    }),
  }),
  Object.freeze({
    id: 'nyx-glitch',
    name: 'Nyx',
    codename: 'ARC-44',
    title: 'Scanline Phantom',
    faction: 'neon-arcade',
    archetype: 'trickster',
    element: 'void',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.15,
    defaultMood: 'surprised',
    stats: Object.freeze({ hp: 102, mp: 98, atk: 90, def: 58, spd: 97 }),
    ultimate: Object.freeze({
      name: 'CRT PHASE FRACTURE',
      jpCallout: '走査線崩壊・グリッチ！',
      quote: 'Wait—did you really think I was standing there?',
      power: 44,
    }),
    dialogueLines: Object.freeze([
      'Desyncing boss hitboxes... now strike while it flickers.',
      'Scanlines make every counterattack look twice as lethal.',
    ]),
    visual: Object.freeze({
      hairStyle: 'hood',
      eyeStyle: 'star',
      accessory: 'mask',
      primaryTone: 'magenta',
      accentTone: 'cyan',
      hairTone: 'violet',
      badgeMark: '44',
    }),
  }),
  Object.freeze({
    id: 'rex-breaker',
    name: 'Rex',
    codename: 'ARC-77',
    title: 'Shield Grappler',
    faction: 'neon-arcade',
    archetype: 'vanguard',
    element: 'solar',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 0.78,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 152, mp: 60, atk: 84, def: 96, spd: 64 }),
    ultimate: Object.freeze({
      name: 'MEGA CABINET SUPLEX',
      jpCallout: '超筐体ブレーカー！',
      quote: 'Camera shake maximum! Hold onto your viewport!',
      power: 43,
    }),
    dialogueLines: Object.freeze([
      'Guard up! Nothing breaks through a full-frame parry.',
      'Let me soak the AoE so the strikers keep their combo.',
    ]),
    visual: Object.freeze({
      hairStyle: 'crest',
      eyeStyle: 'visor',
      accessory: 'headphones',
      primaryTone: 'warning',
      accentTone: 'cyan',
      hairTone: 'ink',
      badgeMark: '77',
    }),
  }),
  Object.freeze({
    id: 'pixel-mei',
    name: 'Mei',
    codename: 'ARC-88',
    title: '1-Up Synthesizer',
    faction: 'neon-arcade',
    archetype: 'support',
    element: 'cryo',
    rarity: 'rare',
    isBoss: false,
    voicePitch: 1.32,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 108, mp: 114, atk: 68, def: 70, spd: 89 }),
    ultimate: Object.freeze({
      name: 'EXTRA CREDIT OVERHEAL',
      jpCallout: 'ワンアップ・フルチャージ！',
      quote: 'HP restored, shields glowing—keep pushing!',
      power: 36,
    }),
    dialogueLines: Object.freeze([
      'Low HP vignette triggered? Hit Heal before the next turn!',
      'I tuned the chiptune synth to match every rarity drop.',
    ]),
    visual: Object.freeze({
      hairStyle: 'twin-tails',
      eyeStyle: 'star',
      accessory: 'goggles',
      primaryTone: 'cyan',
      accentTone: 'yellow',
      hairTone: 'cyan',
      badgeMark: '88',
    }),
  }),

  // ── 3. ARCANA BLADE (5) ────────────────────────────────────────────────────
  Object.freeze({
    id: 'aria-lumina',
    name: 'Aria',
    codename: 'BLD-01',
    title: 'Solar Valkyrie',
    faction: 'arcana-blade',
    archetype: 'striker',
    element: 'solar',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 1.16,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 124, mp: 96, atk: 94, def: 76, spd: 91 }),
    ultimate: Object.freeze({
      name: 'DAWNBREAKER RADIANCE',
      jpCallout: '暁光聖剣・ルミナ！',
      quote: 'By golden ink and oath—shatter the eclipse!',
      power: 49,
    }),
    dialogueLines: Object.freeze([
      'Raise your crests. We break the boss barrier in one volley!',
      'Our guild banners shine brightest when the odds turn critical.',
    ]),
    visual: Object.freeze({
      hairStyle: 'long-wave',
      eyeStyle: 'bright',
      accessory: 'crown',
      primaryTone: 'yellow',
      accentTone: 'info',
      hairTone: 'yellow',
      badgeMark: 'A1',
    }),
  }),
  Object.freeze({
    id: 'kael-aegis',
    name: 'Kael',
    codename: 'BLD-02',
    title: 'Bastion Paladin',
    faction: 'arcana-blade',
    archetype: 'vanguard',
    element: 'solar',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 0.86,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 150, mp: 76, atk: 78, def: 98, spd: 66 }),
    ultimate: Object.freeze({
      name: 'AEGIS SANCTUARY DOME',
      jpCallout: '聖盾領域・イージス！',
      quote: 'Not a single ally falls while my crest holds!',
      power: 39,
    }),
    dialogueLines: Object.freeze([
      'Defensive stance cuts incoming raid damage by half.',
      'Check the skill tree—unlock Iron Wall before floor 10.',
    ]),
    visual: Object.freeze({
      hairStyle: 'swept',
      eyeStyle: 'sharp',
      accessory: 'halo',
      primaryTone: 'success',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: 'K2',
    }),
  }),
  Object.freeze({
    id: 'lyra-frost',
    name: 'Lyra',
    codename: 'BLD-03',
    title: 'Cryo Archmage',
    faction: 'arcana-blade',
    archetype: 'mage',
    element: 'cryo',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.22,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 98, mp: 124, atk: 93, def: 60, spd: 85 }),
    ultimate: Object.freeze({
      name: 'ABSOLUTE ZERO PRISM',
      jpCallout: '絶対零度・氷晶結界！',
      quote: 'Time freezes—every crystal locks onto your core.',
      power: 46,
    }),
    dialogueLines: Object.freeze([
      'Cryo stacks double stagger gain on armored bosses.',
      'Keep mana above 30 so you never miss a burst window.',
    ]),
    visual: Object.freeze({
      hairStyle: 'long-wave',
      eyeStyle: 'bright',
      accessory: 'halo',
      primaryTone: 'info',
      accentTone: 'cyan',
      hairTone: 'cyan',
      badgeMark: 'L3',
    }),
  }),
  Object.freeze({
    id: 'zephyr-gale',
    name: 'Zephyr',
    codename: 'BLD-04',
    title: 'Tempest Ranger',
    faction: 'arcana-blade',
    archetype: 'trickster',
    element: 'wind',
    rarity: 'rare',
    isBoss: false,
    voicePitch: 1.04,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 112, mp: 88, atk: 85, def: 66, spd: 96 }),
    ultimate: Object.freeze({
      name: 'CYCLONE ARROW BARRAGE',
      jpCallout: '疾風連射・ゼファー！',
      quote: 'Ride the tailwind—seven crits before you land!',
      power: 41,
    }),
    dialogueLines: Object.freeze([
      'Tactical radar spots hidden ambushes two turns early.',
      'High speed means extra turns on the ATB order strip.',
    ]),
    visual: Object.freeze({
      hairStyle: 'hood',
      eyeStyle: 'cat',
      accessory: 'scarf',
      primaryTone: 'success',
      accentTone: 'cyan',
      hairTone: 'success',
      badgeMark: 'Z4',
    }),
  }),
  Object.freeze({
    id: 'thorne-rune',
    name: 'Thorne',
    codename: 'BLD-05',
    title: 'Runesmith Cleric',
    faction: 'arcana-blade',
    archetype: 'support',
    element: 'void',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 0.9,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 116, mp: 118, atk: 76, def: 78, spd: 79 }),
    ultimate: Object.freeze({
      name: 'STARLIGHT GRIMOIRE',
      jpCallout: '星刻魔導書・解放！',
      quote: 'Ancient runes rewritten—your wounds vanish!',
      power: 38,
    }),
    dialogueLines: Object.freeze([
      'Every quest scroll holds a hidden mythic relic.',
      'Balance offense with healing or the final phase will punish you.',
    ]),
    visual: Object.freeze({
      hairStyle: 'bob',
      eyeStyle: 'sharp',
      accessory: 'eyepatch',
      primaryTone: 'violet',
      accentTone: 'magenta',
      hairTone: 'violet',
      badgeMark: 'T5',
    }),
  }),

  // ── 4. MECHA ORBIT (5) ─────────────────────────────────────────────────────
  Object.freeze({
    id: 'cmdr-vance',
    name: 'Vance',
    codename: 'ORB-01',
    title: 'Orbital Wing Leader',
    faction: 'mecha-orbit',
    archetype: 'vanguard',
    element: 'volt',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.82,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 142, mp: 84, atk: 88, def: 92, spd: 80 }),
    ultimate: Object.freeze({
      name: 'ORBITAL RAILCANNON',
      jpCallout: '軌道荷電粒子砲・発射！',
      quote: 'Target painted on radar. Fire all batteries!',
      power: 45,
    }),
    dialogueLines: Object.freeze([
      'Tactical sweep confirmed: hostile boss signature dead ahead.',
      'Hold formation and sync your burst timers.',
    ]),
    visual: Object.freeze({
      hairStyle: 'swept',
      eyeStyle: 'visor',
      accessory: 'antenna',
      primaryTone: 'info',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: 'O1',
    }),
  }),
  Object.freeze({
    id: 'nova-x',
    name: 'Nova-X',
    codename: 'ORB-X',
    title: 'Valkyrie Frame Pilot',
    faction: 'mecha-orbit',
    archetype: 'striker',
    element: 'pyro',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 1.12,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 122, mp: 92, atk: 97, def: 72, spd: 94 }),
    ultimate: Object.freeze({
      name: 'SUPERNOVA THRUSTER',
      jpCallout: '超新星ブースター・ノヴァ！',
      quote: 'Limiters off—igniting full cel-shaded afterburners!',
      power: 50,
    }),
    dialogueLines: Object.freeze([
      'Core reactor at 120%. Ready for an anime cut-in finish!',
      'Speedlines intensify the moment thruster overdrive engages.',
    ]),
    visual: Object.freeze({
      hairStyle: 'crest',
      eyeStyle: 'visor',
      accessory: 'goggles',
      primaryTone: 'error',
      accentTone: 'cyan',
      hairTone: 'error',
      badgeMark: 'NX',
    }),
  }),
  Object.freeze({
    id: 'echo-07',
    name: 'Echo-07',
    codename: 'ORB-07',
    title: 'Recon Drone AI',
    faction: 'mecha-orbit',
    archetype: 'support',
    element: 'cryo',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.28,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 106, mp: 116, atk: 72, def: 74, spd: 93 }),
    ultimate: Object.freeze({
      name: 'TELEMETRY OVERCLOCK',
      jpCallout: '戦術予測・オーバークロック！',
      quote: 'Weakness exposed—critical rate elevated to 100%!',
      power: 37,
    }),
    dialogueLines: Object.freeze([
      'Scanning boss phase count... three armor bars detected.',
      'Turn order re-sorted in your favor, Commander.',
    ]),
    visual: Object.freeze({
      hairStyle: 'bob',
      eyeStyle: 'cyclops',
      accessory: 'antenna',
      primaryTone: 'cyan',
      accentTone: 'info',
      hairTone: 'cyan',
      badgeMark: 'E7',
    }),
  }),
  Object.freeze({
    id: 'titan-forge',
    name: 'Titan',
    codename: 'ORB-99',
    title: 'Heavy Siege Mech',
    faction: 'mecha-orbit',
    archetype: 'vanguard',
    element: 'pyro',
    rarity: 'rare',
    isBoss: false,
    voicePitch: 0.72,
    defaultMood: 'angry',
    stats: Object.freeze({ hp: 162, mp: 56, atk: 87, def: 99, spd: 58 }),
    ultimate: Object.freeze({
      name: 'SEISMIC BUNKER PILE',
      jpCallout: '重装パイルバンカー！',
      quote: 'Brace for impact—shockwave inbound!',
      power: 44,
    }),
    dialogueLines: Object.freeze([
      'Armor integrity holding steady at 98 percent.',
      'Heavy hydraulic slam adds +35 stagger on direct hit.',
    ]),
    visual: Object.freeze({
      hairStyle: 'crest',
      eyeStyle: 'cyclops',
      accessory: 'mask',
      primaryTone: 'warning',
      accentTone: 'error',
      hairTone: 'ink',
      badgeMark: '99',
    }),
  }),
  Object.freeze({
    id: 'orbit-yuki',
    name: 'Yuki',
    codename: 'ORB-14',
    title: 'Zero-G Sniper',
    faction: 'mecha-orbit',
    archetype: 'mage',
    element: 'wind',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.19,
    defaultMood: 'neutral',
    stats: Object.freeze({ hp: 100, mp: 108, atk: 92, def: 62, spd: 90 }),
    ultimate: Object.freeze({
      name: 'STARFALL RAILSHOT',
      jpCallout: '流星狙撃・ユキ！',
      quote: 'One breath, one crosshair—bullseye from orbit.',
      power: 45,
    }),
    dialogueLines: Object.freeze([
      'Zero drift. The easing curve snaps right onto the mark.',
      'Triggering long-range support fire on your signal.',
    ]),
    visual: Object.freeze({
      hairStyle: 'twin-tails',
      eyeStyle: 'sharp',
      accessory: 'headphones',
      primaryTone: 'info',
      accentTone: 'magenta',
      hairTone: 'paper',
      badgeMark: '14',
    }),
  }),

  // ── 5. TOON SQUAD (5) ──────────────────────────────────────────────────────
  Object.freeze({
    id: 'pip-bounce',
    name: 'Pip',
    codename: 'TN-01',
    title: 'Squash-Stretch Ace',
    faction: 'toon-squad',
    archetype: 'trickster',
    element: 'solar',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.38,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 114, mp: 90, atk: 86, def: 68, spd: 97 }),
    ultimate: Object.freeze({
      name: 'ACME ANVIL DROP',
      jpCallout: 'ドッカン鉄床ドロップ！',
      quote: 'Boing! Gravity only works if you look down!',
      power: 43,
    }),
    dialogueLines: Object.freeze([
      'Squash on launch, stretch on impact—pure cartoon physics!',
      'Watch me turn this boss fight into a Saturday morning special!',
    ]),
    visual: Object.freeze({
      hairStyle: 'spiky',
      eyeStyle: 'star',
      accessory: 'goggles',
      primaryTone: 'yellow',
      accentTone: 'error',
      hairTone: 'warning',
      badgeMark: 'P1',
    }),
  }),
  Object.freeze({
    id: 'bongo-zap',
    name: 'Bongo',
    codename: 'TN-02',
    title: 'Slapstick Percussionist',
    faction: 'toon-squad',
    archetype: 'vanguard',
    element: 'volt',
    rarity: 'rare',
    isBoss: false,
    voicePitch: 0.94,
    defaultMood: 'surprised',
    stats: Object.freeze({ hp: 140, mp: 70, atk: 82, def: 88, spd: 76 }),
    ultimate: Object.freeze({
      name: 'KABOOM CYMBAL CRASH',
      jpCallout: 'ドタバタ雷鳴クラッシュ！',
      quote: 'Ba-dum-tss! Did someone order a comic starburst?',
      power: 40,
    }),
    dialogueLines: Object.freeze([
      'Every punchline triggers a spiky POW! onomatopoeia!',
      'Rimshot SFX ready whenever the boss whiffs an attack.',
    ]),
    visual: Object.freeze({
      hairStyle: 'pompadour',
      eyeStyle: 'bright',
      accessory: 'headphones',
      primaryTone: 'warning',
      accentTone: 'magenta',
      hairTone: 'magenta',
      badgeMark: 'B2',
    }),
  }),
  Object.freeze({
    id: 'mochi-pop',
    name: 'Mochi',
    codename: 'TN-03',
    title: 'Sparkle Mascot',
    faction: 'toon-squad',
    archetype: 'support',
    element: 'cryo',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.45,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 112, mp: 115, atk: 70, def: 74, spd: 88 }),
    ultimate: Object.freeze({
      name: 'SUGAR SPARKLE PARADE',
      jpCallout: 'キラキラもちパレード！',
      quote: 'Sparkles everywhere! Nobody stays KO on my watch!',
      power: 37,
    }),
    dialogueLines: Object.freeze([
      'Pop-in easing at 12fps gives every sticker extra charm!',
      'Here is a sparkle emote and a full party heal!',
    ]),
    visual: Object.freeze({
      hairStyle: 'twin-tails',
      eyeStyle: 'star',
      accessory: 'halo',
      primaryTone: 'magenta',
      accentTone: 'yellow',
      hairTone: 'magenta',
      badgeMark: 'M3',
    }),
  }),
  Object.freeze({
    id: 'ziggy-smear',
    name: 'Ziggy',
    codename: 'TN-04',
    title: 'Smear-Frame Sprinter',
    faction: 'toon-squad',
    archetype: 'striker',
    element: 'wind',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.25,
    defaultMood: 'surprised',
    stats: Object.freeze({ hp: 108, mp: 82, atk: 90, def: 60, spd: 99 }),
    ultimate: Object.freeze({
      name: 'WHIRLWIND SMEAR BLITZ',
      jpCallout: '残像トルネード連撃！',
      quote: 'ZOOOM! Five smear frames in a single blink!',
      power: 43,
    }),
    dialogueLines: Object.freeze([
      'Elastic curves bounce right past enemy defenses!',
      'Catch me if you can—my speed stat is maxed at 99.',
    ]),
    visual: Object.freeze({
      hairStyle: 'mohawk',
      eyeStyle: 'cat',
      accessory: 'scarf',
      primaryTone: 'success',
      accentTone: 'yellow',
      hairTone: 'success',
      badgeMark: 'Z9',
    }),
  }),
  Object.freeze({
    id: 'capt-inkblot',
    name: 'Capt. Inkblot',
    codename: 'TN-05',
    title: 'Rubberhose Director',
    faction: 'toon-squad',
    archetype: 'mage',
    element: 'ink',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.88,
    defaultMood: 'happy',
    stats: Object.freeze({ hp: 118, mp: 110, atk: 89, def: 72, spd: 82 }),
    ultimate: Object.freeze({
      name: 'IRIS-OUT FINALE',
      jpCallout: '黒塗りアイリスフィナーレ！',
      quote: 'That is a wrap, folks—cue the iris curtain!',
      power: 45,
    }),
    dialogueLines: Object.freeze([
      'Classic cel ink never goes out of style.',
      'Roll camera—Episode 01 title card starts on three!',
    ]),
    visual: Object.freeze({
      hairStyle: 'crest',
      eyeStyle: 'bright',
      accessory: 'crown',
      primaryTone: 'ink',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: 'CI',
    }),
  }),

  // ── 6. ECLIPSE BOSSES (5) ──────────────────────────────────────────────────
  Object.freeze({
    id: 'lord-null',
    name: 'Lord Null',
    codename: 'BOSS-01',
    title: 'Architect of Whiteout',
    faction: 'eclipse-boss',
    archetype: 'boss',
    element: 'void',
    rarity: 'mythic',
    isBoss: true,
    voicePitch: 0.65,
    defaultMood: 'angry',
    stats: Object.freeze({ hp: 360, mp: 180, atk: 102, def: 90, spd: 78 }),
    ultimate: Object.freeze({
      name: 'BLANK PAGE OBLITERATION',
      jpCallout: '白紙抹消・ロードヌル！',
      quote: 'Your frames will be erased back to default white!',
      power: 54,
    }),
    dialogueLines: Object.freeze([
      'Phase Two begins. Let us see if your combo survives!',
      'Stagger me if you dare—my ink armor regenerates!',
    ]),
    visual: Object.freeze({
      hairStyle: 'horns',
      eyeStyle: 'sharp',
      accessory: 'horns',
      primaryTone: 'violet',
      accentTone: 'error',
      hairTone: 'ink',
      badgeMark: 'B1',
    }),
  }),
  Object.freeze({
    id: 'crimson-oni',
    name: 'Crimson Oni',
    codename: 'BOSS-02',
    title: 'Shogun of Impact',
    faction: 'eclipse-boss',
    archetype: 'boss',
    element: 'pyro',
    rarity: 'mythic',
    isBoss: true,
    voicePitch: 0.62,
    defaultMood: 'angry',
    stats: Object.freeze({ hp: 390, mp: 140, atk: 108, def: 94, spd: 74 }),
    ultimate: Object.freeze({
      name: 'CATACLYSM KANABO',
      jpCallout: '紅蓮鬼神・天地砕き！',
      quote: 'Every swing splits the manga gutter in half!',
      power: 56,
    }),
    dialogueLines: Object.freeze([
      'Ha! That scratch barely dented my first health bar!',
      'Guard now—my rage gauge is overflowing!',
    ]),
    visual: Object.freeze({
      hairStyle: 'horns',
      eyeStyle: 'sharp',
      accessory: 'mask',
      primaryTone: 'error',
      accentTone: 'yellow',
      hairTone: 'error',
      badgeMark: 'B2',
    }),
  }),
  Object.freeze({
    id: 'queen-halftone',
    name: 'Queen Halftone',
    codename: 'BOSS-03',
    title: 'Empress of Ben-Day',
    faction: 'eclipse-boss',
    archetype: 'boss',
    element: 'ink',
    rarity: 'legendary',
    isBoss: true,
    voicePitch: 1.05,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 340, mp: 200, atk: 98, def: 86, spd: 86 }),
    ultimate: Object.freeze({
      name: 'ROYAL DOT MATRIX',
      jpCallout: '女王網点・ドット監獄！',
      quote: 'Kneel beneath a thousand screaming Ben-Day dots!',
      power: 52,
    }),
    dialogueLines: Object.freeze([
      'Such vivid linework... I shall add your crew to my gallery.',
      'Break my crown shield and claim a mythic summon!',
    ]),
    visual: Object.freeze({
      hairStyle: 'long-wave',
      eyeStyle: 'cat',
      accessory: 'crown',
      primaryTone: 'magenta',
      accentTone: 'yellow',
      hairTone: 'ink',
      badgeMark: 'B3',
    }),
  }),
  Object.freeze({
    id: 'chronos-fang',
    name: 'Chronos Fang',
    codename: 'BOSS-04',
    title: 'Keyframe Devourer',
    faction: 'eclipse-boss',
    archetype: 'boss',
    element: 'cryo',
    rarity: 'legendary',
    isBoss: true,
    voicePitch: 0.7,
    defaultMood: 'determined',
    stats: Object.freeze({ hp: 350, mp: 190, atk: 100, def: 88, spd: 92 }),
    ultimate: Object.freeze({
      name: 'TIMELINE STASIS LOCK',
      jpCallout: '時間凍結・クロノス牙！',
      quote: 'I devour your easing curves and freeze the clock!',
      power: 53,
    }),
    dialogueLines: Object.freeze([
      'Your speed stat means nothing inside my timeline.',
      'Rewind, stagger, repeat—how long can you endure?',
    ]),
    visual: Object.freeze({
      hairStyle: 'spiky',
      eyeStyle: 'visor',
      accessory: 'horns',
      primaryTone: 'cyan',
      accentTone: 'violet',
      hairTone: 'info',
      badgeMark: 'B4',
    }),
  }),
  Object.freeze({
    id: 'omega-static',
    name: 'Omega Static',
    codename: 'BOSS-05',
    title: 'Final Broadcast Tyrant',
    faction: 'eclipse-boss',
    archetype: 'boss',
    element: 'volt',
    rarity: 'mythic',
    isBoss: true,
    voicePitch: 0.68,
    defaultMood: 'angry',
    stats: Object.freeze({ hp: 420, mp: 210, atk: 110, def: 96, spd: 84 }),
    ultimate: Object.freeze({
      name: 'DEAD CHANNEL SUPERNOVA',
      jpCallout: '終焉雑音・オメガノイズ！',
      quote: 'ALL SIGNALS TERMINATED—WELCOME TO STATIC!',
      power: 58,
    }),
    dialogueLines: Object.freeze([
      'Three phases stand between you and the final trophy.',
      'Unleash your Ultimate Cut-In—show me full MoonWitness DNA!',
    ]),
    visual: Object.freeze({
      hairStyle: 'horns',
      eyeStyle: 'cyclops',
      accessory: 'antenna',
      primaryTone: 'yellow',
      accentTone: 'error',
      hairTone: 'ink',
      badgeMark: 'B5',
    }),
  }),
]);

export type CharacterId = (typeof CHARACTER_REGISTRY)[number]['id'];

export type LoreGroupId = 'moonwitness-xii' | 'rocksoul-extended';

export type LoreDepictionPolicy =
  | 'anonymous-back-facing'
  | 'identified-approved'
  | 'silhouette-only'
  | 'stylized-faceless';

export type LoreVisualRenderingMode =
  | 'faceless'
  | 'stylized'
  | 'faceless-stylized'
  | 'silhouette';

export type LoreCanonStatus = 'draft' | 'review' | 'approved' | 'blocked';

export type RocksoulCapModeId = 'green-mercy' | 'black-resolve';

export interface RocksoulCapModeSpec {
  readonly id: RocksoulCapModeId;
  readonly label: string;
  readonly capColor: 'green' | 'black';
  readonly semanticTheme: string;
  readonly primaryTone: CharacterColorToken;
  readonly accentTone: CharacterColorToken;
  readonly paletteTokens: readonly string[];
  readonly visualCue: string;
}

export interface CanonGuardMetadata {
  readonly canonLevel: 'lore';
  readonly autoMergeForbidden: true;
  readonly rules: readonly ('CAN-0004' | 'CAN-0005' | 'CAN-0011')[];
  readonly visualRenderingMode: LoreVisualRenderingMode;
  readonly facelessOrStylizedOnly: true;
  readonly photorealismForbidden: true;
  readonly realPersonLikenessForbidden: true;
  readonly sacredDepictionForbidden: true;
  readonly prohibitedVariants: readonly string[];
  readonly rationale: string;
}

export interface LoreFactionMeta {
  readonly id: LoreGroupId;
  readonly label: string;
  readonly tagline: string;
  readonly tone: CharacterColorToken;
  readonly canonLevel: 'lore';
}

export interface LoreCharacterProfile extends CharacterProfile {
  readonly canonRecordId: string;
  readonly loreGroup: LoreGroupId;
  readonly displayName: string;
  readonly callsign: string;
  readonly aliases: readonly string[];
  readonly status: LoreCanonStatus;
  readonly canonLevel: 'lore';
  readonly autoMergeForbidden: true;
  readonly depictionPolicy: LoreDepictionPolicy;
  readonly silhouette: string;
  readonly outfit: string;
  readonly paletteTokens: readonly string[];
  readonly prohibitedVariants: readonly string[];
  readonly summary: string;
  readonly canonGuard: CanonGuardMetadata;
  readonly capModes?: readonly RocksoulCapModeSpec[];
}

export const ROCKSOUL_CAP_MODES: readonly RocksoulCapModeSpec[] = Object.freeze([
  Object.freeze({
    id: 'green-mercy',
    label: 'Green Mercy Cap',
    capColor: 'green',
    semanticTheme: 'mercy-witness',
    primaryTone: 'success',
    accentTone: 'yellow',
    paletteTokens: Object.freeze(['ink-black', 'paper-cream', 'mercy-green', 'signal-yellow']),
    visualCue:
      'Oversized green canvas baseball cap pulled low over shadowed faceless brow with signal-yellow crest pin',
  }),
  Object.freeze({
    id: 'black-resolve',
    label: 'Black Resolve Cap',
    capColor: 'black',
    semanticTheme: 'resolve-witness',
    primaryTone: 'ink',
    accentTone: 'error',
    paletteTokens: Object.freeze(['ink-black', 'paper-cream', 'rocksoul-crimson', 'signal-yellow']),
    visualCue:
      'Matte ink-black resolve cap pulled low with crimson chalk under-brim and rough graphite sketch edge',
  }),
]);

export const ROCKSOUL_LORE_FACTIONS: readonly LoreFactionMeta[] = Object.freeze([
  Object.freeze({
    id: 'moonwitness-xii',
    label: 'MoonWitness XII',
    tagline: 'Core quartet anchoring the RockSoul frequency lattice under CAN-0004/CAN-0011 lore isolation.',
    tone: 'error',
    canonLevel: 'lore',
  }),
  Object.freeze({
    id: 'rocksoul-extended',
    label: 'RockSoul Extended Cast',
    tagline: 'Clandestine observers, relay biomes, and cosmic scouts across the MoonWitness II/XII cycle.',
    tone: 'cyan',
    canonLevel: 'lore',
  }),
]);

const BASE_PROHIBITED_VARIANTS: readonly string[] = Object.freeze([
  'sacred-figure',
  'real-person-likeness',
  'photorealistic-face',
]);

const CANON_GUARD_RULES: readonly ('CAN-0004' | 'CAN-0005' | 'CAN-0011')[] = Object.freeze([
  'CAN-0004',
  'CAN-0005',
  'CAN-0011',
]);

function createCanonGuard(
  visualRenderingMode: LoreVisualRenderingMode,
  rationale: string,
  extraProhibitedVariants: readonly string[] = []
): CanonGuardMetadata {
  const prohibitedVariants = Object.freeze(
    Array.from(new Set([...BASE_PROHIBITED_VARIANTS, ...extraProhibitedVariants]))
  );
  return Object.freeze({
    canonLevel: 'lore',
    autoMergeForbidden: true,
    rules: CANON_GUARD_RULES,
    visualRenderingMode,
    facelessOrStylizedOnly: true,
    photorealismForbidden: true,
    realPersonLikenessForbidden: true,
    sacredDepictionForbidden: true,
    prohibitedVariants,
    rationale,
  });
}

interface LoreProfileInput {
  readonly id: string;
  readonly canonRecordId: string;
  readonly loreGroup: LoreGroupId;
  readonly name: string;
  readonly displayName: string;
  readonly callsign: string;
  readonly codename: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly faction: CharacterFactionId;
  readonly archetype: CharacterArchetype;
  readonly element: CharacterElement;
  readonly rarity: CharacterRarity;
  readonly isBoss: boolean;
  readonly voicePitch: number;
  readonly defaultMood: CharacterMood;
  readonly stats: CharacterStats;
  readonly ultimate: CharacterUltimateSkill;
  readonly dialogueLines: readonly string[];
  readonly visual: CharacterVisualTraits;
  readonly depictionPolicy: LoreDepictionPolicy;
  readonly visualRenderingMode: LoreVisualRenderingMode;
  readonly silhouette: string;
  readonly outfit: string;
  readonly paletteTokens: readonly string[];
  readonly summary: string;
  readonly guardRationale: string;
  readonly extraProhibitedVariants?: readonly string[];
  readonly capModes?: readonly RocksoulCapModeSpec[];
}

function buildLoreProfile(input: LoreProfileInput): LoreCharacterProfile {
  const canonGuard = createCanonGuard(
    input.visualRenderingMode,
    input.guardRationale,
    input.extraProhibitedVariants
  );
  const profile: LoreCharacterProfile = {
    id: input.id,
    canonRecordId: input.canonRecordId,
    loreGroup: input.loreGroup,
    name: input.name,
    displayName: input.displayName,
    callsign: input.callsign,
    codename: input.codename,
    title: input.title,
    aliases: Object.freeze([...input.aliases]),
    faction: input.faction,
    archetype: input.archetype,
    element: input.element,
    rarity: input.rarity,
    isBoss: input.isBoss,
    voicePitch: input.voicePitch,
    defaultMood: input.defaultMood,
    status: 'review',
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: input.depictionPolicy,
    silhouette: input.silhouette,
    outfit: input.outfit,
    paletteTokens: Object.freeze([...input.paletteTokens]),
    prohibitedVariants: canonGuard.prohibitedVariants,
    summary: input.summary,
    canonGuard,
    stats: Object.freeze({ ...input.stats }),
    ultimate: Object.freeze({ ...input.ultimate }),
    dialogueLines: Object.freeze([...input.dialogueLines]),
    visual: Object.freeze({ ...input.visual }),
    ...(input.capModes ? { capModes: input.capModes } : {}),
  };
  return Object.freeze(profile);
}

export const MOONWITNESS_XII_CAST_PROFILES: readonly LoreCharacterProfile[] = Object.freeze([
  buildLoreProfile({
    id: 'rocksoul-witness',
    canonRecordId: 'xii_rocksoul',
    loreGroup: 'moonwitness-xii',
    name: 'ROCKSOUL',
    displayName: 'ROCKSOUL',
    callsign: 'ROCKSOUL',
    codename: 'XII-01',
    title: 'Primary Resonance Witness',
    aliases: ['ROCKSOUL', 'Green Cap Witness', 'Black Cap Witness', 'Witness-XII'],
    faction: 'signal-riot',
    archetype: 'striker',
    element: 'volt',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 0.96,
    defaultMood: 'determined',
    stats: { hp: 132, mp: 96, atk: 95, def: 78, spd: 93 },
    ultimate: {
      name: 'DUAL-CAP RESONANCE',
      jpCallout: '緑黒帽共鳴・ロックスウル！',
      quote: 'Mercy in green, resolve in black—witness every broken signal.',
      power: 49,
    },
    dialogueLines: [
      'Green cap listens first; black cap draws the boundary line.',
      'Hold the chalk contour—nobody edits this witness ledger.',
    ],
    visual: {
      hairStyle: 'hood',
      eyeStyle: 'visor',
      accessory: 'scarf',
      primaryTone: 'success',
      accentTone: 'error',
      hairTone: 'ink',
      badgeMark: 'RS',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'faceless-stylized',
    silhouette:
      'Faceless hooded street witness with low-pulled mercy green or resolve black baseball cap, high utility collar, and rough charcoal outline',
    outfit:
      'Dual-mode zine parka with interchangeable green mercy cap or black resolve cap, crimson chalk armband, and heavy ink boots',
    paletteTokens: ['ink-black', 'paper-cream', 'mercy-green', 'rocksoul-crimson', 'signal-yellow'],
    summary:
      'Primary resonance catalyst of MoonWitness XII switching between green mercy cap and black resolve cap modes.',
    guardRationale:
      'Faceless low-brim witness depiction under CAN-0011; strictly fictional CAN-0004 lore catalyst with zero photorealistic face.',
    extraProhibitedVariants: ['recognizable-face', 'third-party-logo'],
    capModes: ROCKSOUL_CAP_MODES,
  }),
  buildLoreProfile({
    id: 'isrockfeel-punk',
    canonRecordId: 'xii_isrockfeel',
    loreGroup: 'moonwitness-xii',
    name: 'ISROCKFEEL',
    displayName: 'ISROCKFEEL',
    callsign: 'ISROCKFEEL',
    codename: 'XII-02',
    title: 'Empathic Frequency Mentor',
    aliases: ['ISROCKFEEL', 'Punk Mentor', 'Empathic Frequency Mirror'],
    faction: 'signal-riot',
    archetype: 'support',
    element: 'pyro',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.08,
    defaultMood: 'determined',
    stats: { hp: 122, mp: 106, atk: 86, def: 74, spd: 91 },
    ultimate: {
      name: 'CRIMSON AMP FEEDBACK',
      jpCallout: '激情共鳴パンクアンプ！',
      quote: 'Crank the halftone distortion until static turns to pulse!',
      power: 45,
    },
    dialogueLines: [
      'Your rhythm slips when you hide behind clean lines—lean into the scratch.',
      'Cyan distortion on the left channel, crimson riff on the right.',
    ],
    visual: {
      hairStyle: 'mohawk',
      eyeStyle: 'sharp',
      accessory: 'headphones',
      primaryTone: 'error',
      accentTone: 'cyan',
      hairTone: 'error',
      badgeMark: 'IR',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'stylized',
    silhouette:
      'Spiked punk-rock street mentor wearing jagged studio headphones, cropped safety-pin leather vest, and red-cyan halftone burst cape',
    outfit:
      'Distressed xerox punk jacket with crimson screenprint patches, cyan tape wraps, and studded acoustic strap',
    paletteTokens: ['ink-black', 'paper-cream', 'rocksoul-crimson', 'signal-cyan', 'signal-yellow'],
    summary:
      'Punk-rock empathic frequency mirror mentoring the MoonWitness XII crew through red and cyan halftone distortion.',
    guardRationale:
      'Stylized punk-zine cartoon mentor locked to canonLevel lore; CAN-0004 blocks real-musician likeness matching.',
    extraProhibitedVariants: ['celebrity-likeness', 'third-party-logo'],
  }),
  buildLoreProfile({
    id: 'walterwhite-engineer',
    canonRecordId: 'char_walter_white',
    loreGroup: 'moonwitness-xii',
    name: 'WALTERWHITE',
    displayName: 'WALTERWHITE',
    callsign: 'WALTERWHITE',
    codename: 'XII-03',
    title: 'Volatility & Synthesis Strategist',
    aliases: ['WALTERWHITE', 'Walter White', 'Alchemist-99', 'Chaos Engineer'],
    faction: 'neon-arcade',
    archetype: 'mage',
    element: 'cryo',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.82,
    defaultMood: 'neutral',
    stats: { hp: 118, mp: 120, atk: 91, def: 72, spd: 82 },
    ultimate: {
      name: 'ZERO-RESIDUE SWEEP',
      jpCallout: '完全合成・静粛掃討！',
      quote: 'Every volatile compound stabilizes the instant I sweep the floor.',
      power: 46,
    },
    dialogueLines: [
      'Measure twice, sweep once—volatility hates sloppy containment.',
      'External franchises do not exist inside this grid; check the canon lock.',
    ],
    visual: {
      hairStyle: 'swept',
      eyeStyle: 'visor',
      accessory: 'goggles',
      primaryTone: 'cyan',
      accentTone: 'yellow',
      hairTone: 'paper',
      badgeMark: 'WW',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'stylized',
    silhouette:
      'Stylized ink-cartoon synthesis engineer with round protective goggles, charcoal jumpsuit, yellow crown pin, and wooden floor broom',
    outfit:
      'Charcoal workshop coveralls with magenta containment armband, brass pressure gauges, and rough graphite apron pockets',
    paletteTokens: ['ink-black', 'paper-cream', 'signal-cyan', 'signal-yellow', 'riot-magenta'],
    summary:
      'Fictional MoonWitness lore chaos-synthesis engineer isolated from external franchises under CAN-0004.',
    guardRationale:
      'Stylized cel/graphite lore engineer isolated from external TV/real-world identities under CAN-0004 and CAN-0011.',
    extraProhibitedVariants: ['celebrity-likeness', 'third-party-logo'],
  }),
  buildLoreProfile({
    id: 'fourlah-batteries',
    canonRecordId: 'char_a_lah',
    loreGroup: 'moonwitness-xii',
    name: '4-LAH / THE BATTERIES',
    displayName: '4-LAH / THE BATTERIES',
    callsign: '4-LAH/THE BATTERIES',
    codename: 'XII-04',
    title: 'Distributed Power Conduit Ensemble',
    aliases: ['4-LAH', 'A-LAH', 'THE BATTERIES', 'Circuit-Four'],
    faction: 'mecha-orbit',
    archetype: 'vanguard',
    element: 'volt',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 0.76,
    defaultMood: 'determined',
    stats: { hp: 154, mp: 108, atk: 87, def: 96, spd: 74 },
    ultimate: {
      name: 'QUAD-CELL OVERCHARGE',
      jpCallout: '四連電池・過負荷連結！',
      quote: 'Four cells in series—zero loss, pure kinetic current!',
      power: 48,
    },
    dialogueLines: [
      'Conduit cells synchronized: reserve voltage ready for district relay.',
      'Callsign Circuit-Four online—fictional battery telemetry verified.',
    ],
    visual: {
      hairStyle: 'crest',
      eyeStyle: 'cyclops',
      accessory: 'antenna',
      primaryTone: 'yellow',
      accentTone: 'cyan',
      hairTone: 'ink',
      badgeMark: '4B',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'faceless-stylized',
    silhouette:
      'Faceless modular four-cell battery conduit construct with copper busbars, glowing capacitor visor slit, and braided voltage cables',
    outfit:
      'Insulated industrial capacitor shell plates marked with 01-04 charge gauges and hazard-yellow tape',
    paletteTokens: ['ink-black', 'paper-cream', 'signal-yellow', 'signal-cyan', 'rocksoul-crimson'],
    summary:
      'Strictly fictional distributed power conduit ensemble within MoonWitness lore; CAN-0004 and CAN-0011 forbid any auto-merge or sacred association.',
    guardRationale:
      'Non-humanoid faceless battery construct; CAN-0004 strictly forbids alias auto-merge and CAN-0011 forbids any religious figure association.',
    extraProhibitedVariants: ['recognizable-face', 'religious-figure-merge'],
  }),
]);

export const EXTENDED_LORE_CAST_PROFILES: readonly LoreCharacterProfile[] = Object.freeze([
  buildLoreProfile({
    id: 'the-shadow',
    canonRecordId: 'char_the_shadow',
    loreGroup: 'rocksoul-extended',
    name: 'The Shadow',
    displayName: 'The Shadow',
    callsign: 'THE SHADOW',
    codename: 'EXT-01',
    title: 'Clandestine Signal Observer',
    aliases: ['The Shadow', 'Shadow Signal', 'Zero-Phase'],
    faction: 'signal-riot',
    archetype: 'trickster',
    element: 'void',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.78,
    defaultMood: 'neutral',
    stats: { hp: 108, mp: 112, atk: 89, def: 64, spd: 96 },
    ultimate: {
      name: 'BLIND-SPOT ARCHIVE',
      jpCallout: '死角記録・ゼロフェイズ！',
      quote: 'Even erased broadcasts leave ink smudges in the dark.',
      power: 44,
    },
    dialogueLines: [
      'Every dead relay still echoes if you read the negative space.',
      'Step out of the spotlight—I only log unedited frequencies.',
    ],
    visual: {
      hairStyle: 'hood',
      eyeStyle: 'cyclops',
      accessory: 'mask',
      primaryTone: 'ink',
      accentTone: 'violet',
      hairTone: 'ink',
      badgeMark: 'SH',
    },
    depictionPolicy: 'silhouette-only',
    visualRenderingMode: 'silhouette',
    silhouette:
      'Sharp ink-void cloaked silhouette with torn trench-coat hem, zero facial features, and glowing violet frequency slit',
    outfit:
      'Layered blackout cloak etched with white pencil crosshatching and cassette-tape bandolier',
    paletteTokens: ['ink-black', 'electric-violet', 'paper-cream'],
    summary:
      'Operates in the blind spots of the RockSoul relay grid, cataloguing erased transmissions.',
    guardRationale:
      'Pure silhouette-only faceless observer; zero photorealistic features per CAN-0004 and CAN-0011.',
    extraProhibitedVariants: ['recognizable-face'],
  }),
  buildLoreProfile({
    id: 'baby-doll',
    canonRecordId: 'lore_baby_doll',
    loreGroup: 'rocksoul-extended',
    name: 'Baby Doll',
    displayName: 'Baby Doll',
    callsign: 'BABY DOLL',
    codename: 'EXT-02',
    title: 'Porcelain Zine Sentinel',
    aliases: ['Baby Doll', 'Porcelain Static', 'Doll-Mask'],
    faction: 'toon-squad',
    archetype: 'trickster',
    element: 'ink',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.34,
    defaultMood: 'surprised',
    stats: { hp: 104, mp: 102, atk: 86, def: 66, spd: 94 },
    ultimate: {
      name: 'CRACKED BISQUE CHIME',
      jpCallout: '白磁共鳴・ドールマスク！',
      quote: 'Wind the key once—every false signal freezes in place.',
      power: 42,
    },
    dialogueLines: [
      'Painted cracks hide the sharpest graphite edges.',
      'Do not mistake a blank mask for an empty stage.',
    ],
    visual: {
      hairStyle: 'twin-tails',
      eyeStyle: 'star',
      accessory: 'mask',
      primaryTone: 'magenta',
      accentTone: 'paper',
      hairTone: 'ink',
      badgeMark: 'BD',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'faceless-stylized',
    silhouette:
      'Stylized marionette sentinel wearing a blank cracked porcelain mask, oversized ribbon collar, and inked wind-up key on back',
    outfit:
      'Ruffled monochrome zine pinafore pinned with magenta safety tags and stitched fingerless sleeves',
    paletteTokens: ['ink-black', 'paper-cream', 'riot-magenta', 'signal-yellow'],
    summary:
      'Stylized blank-mask sentinel patrolling underground stage alleys with kinetic wind-up chimes.',
    guardRationale:
      'Blank porcelain-mask stylized puppet design; prohibits human likeness and sacred iconography.',
    extraProhibitedVariants: ['recognizable-face'],
  }),
  buildLoreProfile({
    id: 'blue-witch',
    canonRecordId: 'char_blue_witch',
    loreGroup: 'rocksoul-extended',
    name: 'Blue Witch',
    displayName: 'Blue Witch',
    callsign: 'BLUE WITCH',
    codename: 'EXT-03',
    title: 'Harmonic Inversion Specialist',
    aliases: ['Blue Witch', 'Cobalt Weaver', 'Frequency Hex'],
    faction: 'arcana-blade',
    archetype: 'mage',
    element: 'cryo',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 1.14,
    defaultMood: 'neutral',
    stats: { hp: 102, mp: 126, atk: 93, def: 64, spd: 87 },
    ultimate: {
      name: 'COBALT PHASE INVERSION',
      jpCallout: '蒼穹位相反転・ヘックス！',
      quote: 'Invert the carrier wave—hidden enclaves vanish from radar.',
      power: 47,
    },
    dialogueLines: [
      'Blue inversion flips surveillance beams back onto their source.',
      'Keep your ink glyphs steady while the cobalt shield settles.',
    ],
    visual: {
      hairStyle: 'long-wave',
      eyeStyle: 'visor',
      accessory: 'halo',
      primaryTone: 'info',
      accentTone: 'cyan',
      hairTone: 'info',
      badgeMark: 'BW',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'stylized',
    silhouette:
      'Tall angular mage silhouette under a sweeping cobalt crescent hood and hovering waveform sigil ring',
    outfit:
      'Ink-dipped cobalt cloak lined with cyan oscilloscope trim and sketched chalk talismans',
    paletteTokens: ['ink-black', 'paper-cream', 'signal-cyan', 'cobalt-blue'],
    summary:
      'Manipulates cobalt-band interference to shield hidden enclaves across the Blue Inversion era.',
    guardRationale:
      'Stylized shadowed-hood spellcaster; CAN-0004 and CAN-0011 enforce pure fictional isolation.',
  }),
  buildLoreProfile({
    id: 'dogs-from-universe',
    canonRecordId: 'char_dogs_from_universe',
    loreGroup: 'rocksoul-extended',
    name: 'Dogs From Universe',
    displayName: 'Dogs From Universe',
    callsign: 'DOGS FROM UNIVERSE',
    codename: 'EXT-04',
    title: 'Nomadic Void Trackers',
    aliases: ['Dogs From Universe', 'Cosmic Pack', 'Orbital Hounds'],
    faction: 'mecha-orbit',
    archetype: 'striker',
    element: 'wind',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 1.02,
    defaultMood: 'determined',
    stats: { hp: 126, mp: 84, atk: 92, def: 70, spd: 97 },
    ultimate: {
      name: 'TRIPLE-PULSE PACK RUN',
      jpCallout: '星犬三重波動疾走！',
      quote: 'Three cosmic pulses—the pack tracks every resonance anomaly.',
      power: 45,
    },
    dialogueLines: [
      'Triple-pulse telemetry locked onto the northern relay spire.',
      'Orbital hounds run fastest along static fault lines.',
    ],
    visual: {
      hairStyle: 'crest',
      eyeStyle: 'star',
      accessory: 'antenna',
      primaryTone: 'cyan',
      accentTone: 'yellow',
      hairTone: 'violet',
      badgeMark: 'DF',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'stylized',
    silhouette:
      'Angular cosmic hound pack silhouettes sketched in starlight cyan chalk with glowing triple-pulse collars',
    outfit:
      'Zero-gravity orbital harnesses bearing phosphor-yellow telemetry tags and graphite speedlines',
    paletteTokens: ['ink-black', 'paper-cream', 'signal-cyan', 'electric-violet', 'signal-yellow'],
    summary:
      'Interstellar scouts drawn to high-amplitude resonance anomalies across the RockSoul frontier.',
    guardRationale:
      'Non-humanoid stylized cosmic hound pack; strictly fictional CAN-0004/CAN-0011 compliant.',
  }),
  buildLoreProfile({
    id: 'dj-david',
    canonRecordId: 'char_dj_david',
    loreGroup: 'rocksoul-extended',
    name: 'DJ David',
    displayName: 'DJ David',
    callsign: 'DJ DAVID',
    codename: 'EXT-05',
    title: 'Broadcast Curatorial Operator',
    aliases: ['DJ David', 'Selector-D', 'Turntable Architect'],
    faction: 'neon-arcade',
    archetype: 'support',
    element: 'volt',
    rarity: 'epic',
    isBoss: false,
    voicePitch: 0.94,
    defaultMood: 'happy',
    stats: { hp: 116, mp: 114, atk: 78, def: 74, spd: 90 },
    ultimate: {
      name: 'PIRATE TEMPO SHIFT',
      jpCallout: '海賊放送・テンポ転調！',
      quote: 'Drop the needle at 140 BPM—the whole district moves on beat!',
      power: 40,
    },
    dialogueLines: [
      'Crossfader primed. Watch every faction tempo snap to my cue.',
      'Pirate radio stays fictional, loud, and strictly off the corporate dial.',
    ],
    visual: {
      hairStyle: 'pompadour',
      eyeStyle: 'visor',
      accessory: 'headphones',
      primaryTone: 'yellow',
      accentTone: 'magenta',
      hairTone: 'ink',
      badgeMark: 'DD',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'stylized',
    silhouette:
      'Stylized visor-shaded pirate DJ with boxy turntable flight-case, oversized cue headphones, and ink halftone equalizer aura',
    outfit:
      'Sleeveless boombox utility jacket covered in yellow cassette stickers and magenta crossfader patches',
    paletteTokens: ['ink-black', 'paper-cream', 'signal-yellow', 'riot-magenta', 'signal-cyan'],
    summary:
      'Fictional pirate-radio strategist orchestrating citywide tempo shifts; never auto-merged with historical or religious figures.',
    guardRationale:
      'Stylized visor-shaded cartoon DJ; CAN-0004 forbids auto-merging with historical or religious figures and CAN-0011 forbids sacred imagery.',
    extraProhibitedVariants: ['historical-figure-merge'],
  }),
  buildLoreProfile({
    id: 'electric-forest',
    canonRecordId: 'char_electric_forest',
    loreGroup: 'rocksoul-extended',
    name: 'Electric Forest',
    displayName: 'Electric Forest',
    callsign: 'ELECTRIC FOREST',
    codename: 'EXT-06',
    title: 'Living Electromagnetic Biome',
    aliases: ['Electric Forest', 'Volt Canopy', 'Static Woods'],
    faction: 'arcana-blade',
    archetype: 'support',
    element: 'volt',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.7,
    defaultMood: 'neutral',
    stats: { hp: 158, mp: 130, atk: 82, def: 90, spd: 68 },
    ultimate: {
      name: 'RESIDUAL CANOPY SURGE',
      jpCallout: '帯電樹海・残留放電！',
      quote: 'Every root remembers the voltage of past transmissions.',
      power: 43,
    },
    dialogueLines: [
      'Bark fibers hum with archived frequencies from earlier eras.',
      'Step carefully—wet moss conducts sixty kilovolts of lore memory.',
    ],
    visual: {
      hairStyle: 'horns',
      eyeStyle: 'cyclops',
      accessory: 'antenna',
      primaryTone: 'success',
      accentTone: 'cyan',
      hairTone: 'success',
      badgeMark: 'EF',
    },
    depictionPolicy: 'silhouette-only',
    visualRenderingMode: 'silhouette',
    silhouette:
      'Living canopy guardian formed of knotted graphite tree-trunks, glowing copper-leaf boughs, and arcing cyan static filaments',
    outfit:
      'Natural conductive bark armor braided with phosphor moss and porcelain insulator rings',
    paletteTokens: ['ink-black', 'mercy-green', 'signal-cyan', 'paper-cream'],
    summary:
      'Sentient conductive woodland acting as both sanctuary and natural amplifier across RockSoul districts.',
    guardRationale:
      'Botanical electromagnetic biome silhouette; zero human or sacred figure depiction per CAN-0011.',
  }),
  buildLoreProfile({
    id: 'indestructible',
    canonRecordId: 'char_indestructible',
    loreGroup: 'rocksoul-extended',
    name: 'Indestructible',
    displayName: 'Indestructible',
    callsign: 'INDESTRUCTIBLE',
    codename: 'EXT-07',
    title: 'Endurance Vanguard',
    aliases: ['Indestructible', 'Iron-Hull', 'Unbroken'],
    faction: 'eclipse-boss',
    archetype: 'vanguard',
    element: 'pyro',
    rarity: 'mythic',
    isBoss: false,
    voicePitch: 0.66,
    defaultMood: 'angry',
    stats: { hp: 170, mp: 68, atk: 90, def: 100, spd: 60 },
    ultimate: {
      name: 'CONVERGENCE BULWARK',
      jpCallout: '不壊鉄壁・収束防壁！',
      quote: 'Every storm leaves a crack—and still the hull holds.',
      power: 48,
    },
    dialogueLines: [
      'Armor holds through the storm, though every impact collects a temporal toll.',
      'Stand behind Iron-Hull until the static surge dissipates.',
    ],
    visual: {
      hairStyle: 'crest',
      eyeStyle: 'visor',
      accessory: 'mask',
      primaryTone: 'error',
      accentTone: 'warning',
      hairTone: 'ink',
      badgeMark: 'IN',
    },
    depictionPolicy: 'stylized-faceless',
    visualRenderingMode: 'faceless-stylized',
    silhouette:
      'Broad armored vanguard monolith with welded visor slit, notched graphite pauldrons, and crimson fracture tally marks',
    outfit:
      'Riveted storm-plate overcoat scarred by lightning welds and cautionary stencil bands',
    paletteTokens: ['ink-black', 'rocksoul-crimson', 'signal-yellow', 'paper-cream'],
    summary:
      'Frontline sentinel engineered to survive high-voltage convergence storms while bearing structural endurance costs (wr_06).',
    guardRationale:
      'Faceless helmeted vanguard construct; obeys CAN-0004, CAN-0011, and world rule wr_06.',
    extraProhibitedVariants: ['recognizable-face'],
  }),
  buildLoreProfile({
    id: 'the-listener',
    canonRecordId: 'lore_the_listener',
    loreGroup: 'rocksoul-extended',
    name: 'The Listener',
    displayName: 'The Listener',
    callsign: 'THE LISTENER',
    codename: 'EXT-08',
    title: 'Sub-Static Acoustic Archivist',
    aliases: ['The Listener', 'Carrier Ear', 'Sub-Static Witness'],
    faction: 'arcana-blade',
    archetype: 'support',
    element: 'void',
    rarity: 'legendary',
    isBoss: false,
    voicePitch: 0.88,
    defaultMood: 'neutral',
    stats: { hp: 112, mp: 122, atk: 76, def: 78, spd: 85 },
    ultimate: {
      name: 'CARRIER WAVE RECALL',
      jpCallout: '基底搬送波・静聴再現！',
      quote: 'Before light, only the hum spoke—I kept every syllable.',
      power: 41,
    },
    dialogueLines: [
      'Silence is never empty; listen one layer beneath the carrier noise.',
      'Every forgotten broadcast settles into my parabolic slate.',
    ],
    visual: {
      hairStyle: 'hood',
      eyeStyle: 'visor',
      accessory: 'headphones',
      primaryTone: 'violet',
      accentTone: 'cyan',
      hairTone: 'ink',
      badgeMark: 'TL',
    },
    depictionPolicy: 'silhouette-only',
    visualRenderingMode: 'faceless-stylized',
    silhouette:
      'Hooded faceless acoustic archivist framed by twin parabolic ear-dishes and floating rough-pencil waveform ribbons',
    outfit:
      'Charcoal field-recording poncho draped over copper coil spools and chalk-numbered reel cases',
    paletteTokens: ['ink-black', 'paper-cream', 'electric-violet', 'signal-cyan'],
    summary:
      'Silent acoustic archivist monitoring the unattributed carrier wave humming beneath the RockSoul horizon.',
    guardRationale:
      'Faceless hooded archivist figure; CAN-0004 and CAN-0011 prohibit identifiable or sacred depiction.',
    extraProhibitedVariants: ['recognizable-face'],
  }),
]);

export const ROCKSOUL_LORE_ROSTER: readonly LoreCharacterProfile[] = Object.freeze([
  ...MOONWITNESS_XII_CAST_PROFILES,
  ...EXTENDED_LORE_CAST_PROFILES,
]);

export type LoreCharacterId = (typeof ROCKSOUL_LORE_ROSTER)[number]['id'];

export const MOONWITNESS_XII_CAST_IDS: readonly string[] = Object.freeze(
  MOONWITNESS_XII_CAST_PROFILES.map((character) => character.id)
);

export const EXTENDED_LORE_CAST_IDS: readonly string[] = Object.freeze(
  EXTENDED_LORE_CAST_PROFILES.map((character) => character.id)
);

export const ROCKSOUL_LORE_CAST_IDS: readonly string[] = Object.freeze(
  ROCKSOUL_LORE_ROSTER.map((character) => character.id)
);

const CHARACTER_BY_ID = new Map<string, CharacterProfile>(
  CHARACTER_REGISTRY.map((character) => [character.id, character])
);

const LORE_CHARACTER_BY_ID = new Map<string, LoreCharacterProfile>(
  ROCKSOUL_LORE_ROSTER.map((character) => [character.id, character])
);

export function getCharacterById(id?: string | null): CharacterProfile | undefined {
  if (!id) return undefined;
  return CHARACTER_BY_ID.get(id) ?? LORE_CHARACTER_BY_ID.get(id);
}

export function getLoreCharacterById(id?: string | null): LoreCharacterProfile | undefined {
  if (!id) return undefined;
  return LORE_CHARACTER_BY_ID.get(id);
}

export function getMoonWitnessXiiCast(): readonly LoreCharacterProfile[] {
  return MOONWITNESS_XII_CAST_PROFILES;
}

export function getExtendedLoreCast(): readonly LoreCharacterProfile[] {
  return EXTENDED_LORE_CAST_PROFILES;
}

export function getRocksoulCapMode(modeId: RocksoulCapModeId): RocksoulCapModeSpec | undefined {
  return ROCKSOUL_CAP_MODES.find((mode) => mode.id === modeId);
}

export interface LoreCharacterFilterQuery {
  readonly loreGroup?: LoreGroupId | 'all';
  readonly archetype?: CharacterArchetype | 'all';
  readonly element?: CharacterElement | 'all';
  readonly rarity?: CharacterRarity | 'all';
  readonly depictionPolicy?: LoreDepictionPolicy | 'all';
  readonly query?: string;
}

export function filterLoreCharacters(
  filters: LoreCharacterFilterQuery = {}
): readonly LoreCharacterProfile[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';
  return ROCKSOUL_LORE_ROSTER.filter((character) => {
    if (filters.loreGroup && filters.loreGroup !== 'all' && character.loreGroup !== filters.loreGroup) {
      return false;
    }
    if (filters.archetype && filters.archetype !== 'all' && character.archetype !== filters.archetype) {
      return false;
    }
    if (filters.element && filters.element !== 'all' && character.element !== filters.element) {
      return false;
    }
    if (filters.rarity && filters.rarity !== 'all' && character.rarity !== filters.rarity) {
      return false;
    }
    if (
      filters.depictionPolicy &&
      filters.depictionPolicy !== 'all' &&
      character.depictionPolicy !== filters.depictionPolicy
    ) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${character.id} ${character.name} ${character.callsign} ${character.title} ${character.aliases.join(' ')} ${character.summary}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

export interface AliasAutoMergeAudit {
  readonly alias: string;
  readonly matchedCharacterIds: readonly string[];
  readonly autoMergeAllowed: false;
  readonly rule: 'CAN-0004';
}

export function assertNoLoreAliasAutoMerge(alias: string): AliasAutoMergeAudit {
  const normalized = alias.trim().toLowerCase();
  const matchedCharacterIds = ROCKSOUL_LORE_ROSTER.filter(
    (record) =>
      record.aliases.some((candidate) => candidate.toLowerCase() === normalized) ||
      record.displayName.toLowerCase() === normalized ||
      record.callsign.toLowerCase() === normalized
  ).map((record) => record.id);

  return Object.freeze({
    alias,
    matchedCharacterIds: Object.freeze(matchedCharacterIds),
    autoMergeAllowed: false,
    rule: 'CAN-0004',
  });
}

const CAN_0011_SACRED_FIGURES_RE =
  /\b(allah|prophet\s+muhammad|nabi\s+muhammad|muhammad|mohammad|mohammed|rasulullah|nabi\s+isa|isa\s+al[-\s]?masih|isa|yesus|jesus)\b/iu;

export interface LoreCanonValidationResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}

export function validateLoreCharacterCanonGuards(
  character: LoreCharacterProfile
): LoreCanonValidationResult {
  const violations: string[] = [];
  if (character.canonLevel !== 'lore') {
    violations.push(`${character.id}: canonLevel must be 'lore' (CAN-0005)`);
  }
  if (character.autoMergeForbidden !== true) {
    violations.push(`${character.id}: autoMergeForbidden must be true (CAN-0004)`);
  }
  if (!character.canonGuard.rules.includes('CAN-0004')) {
    violations.push(`${character.id}: canonGuard.rules must include CAN-0004`);
  }
  if (!character.canonGuard.rules.includes('CAN-0011')) {
    violations.push(`${character.id}: canonGuard.rules must include CAN-0011`);
  }
  if (!character.canonGuard.facelessOrStylizedOnly || !character.canonGuard.photorealismForbidden) {
    violations.push(`${character.id}: faceless/stylized guard flags must remain enabled`);
  }
  if (
    !character.prohibitedVariants.includes('sacred-figure') ||
    !character.prohibitedVariants.includes('real-person-likeness')
  ) {
    violations.push(`${character.id}: prohibitedVariants must include sacred-figure and real-person-likeness`);
  }
  if (character.id === 'rocksoul-witness') {
    const modeIds = new Set((character.capModes ?? []).map((mode) => mode.id));
    if (!modeIds.has('green-mercy') || !modeIds.has('black-resolve')) {
      violations.push('rocksoul-witness: must define both green-mercy and black-resolve cap modes');
    }
  }
  for (const fieldValue of [
    character.id,
    character.name,
    character.displayName,
    character.callsign,
    character.title,
    character.silhouette,
    character.outfit,
    character.summary,
    ...character.aliases,
  ]) {
    if (CAN_0011_SACRED_FIGURES_RE.test(fieldValue)) {
      violations.push(`${character.id}: CAN-0011 sacred visual boundary violation in text field`);
    }
  }
  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

export function validateRocksoulLoreRoster(
  roster: readonly LoreCharacterProfile[] = ROCKSOUL_LORE_ROSTER
): LoreCanonValidationResult {
  const violations: string[] = [];
  const seen = new Set<string>();
  for (const entry of roster) {
    if (seen.has(entry.id)) {
      violations.push(`Duplicate lore character id: ${entry.id}`);
    }
    seen.add(entry.id);
    const check = validateLoreCharacterCanonGuards(entry);
    violations.push(...check.violations);
  }
  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

export function getFactionById(id: CharacterFactionId): CharacterFactionMeta | undefined {
  return CHARACTER_FACTIONS.find((faction) => faction.id === id);
}

export interface CharacterFilterQuery {
  readonly faction?: CharacterFactionId | 'all';
  readonly archetype?: CharacterArchetype | 'all';
  readonly element?: CharacterElement | 'all';
  readonly rarity?: CharacterRarity | 'all';
  readonly bossOnly?: boolean;
  readonly playableOnly?: boolean;
  readonly query?: string;
}

export function filterCharacters(filters: CharacterFilterQuery = {}): readonly CharacterProfile[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';
  return CHARACTER_REGISTRY.filter((character) => {
    if (filters.faction && filters.faction !== 'all' && character.faction !== filters.faction) {
      return false;
    }
    if (
      filters.archetype &&
      filters.archetype !== 'all' &&
      character.archetype !== filters.archetype
    ) {
      return false;
    }
    if (filters.element && filters.element !== 'all' && character.element !== filters.element) {
      return false;
    }
    if (filters.rarity && filters.rarity !== 'all' && character.rarity !== filters.rarity) {
      return false;
    }
    if (filters.bossOnly && !character.isBoss) return false;
    if (filters.playableOnly && character.isBoss) return false;
    if (normalizedQuery) {
      const haystack =
        `${character.name} ${character.codename} ${character.title} ${character.faction} ${character.element} ${character.archetype} ${character.ultimate.name}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

export function getPlayableCharacters(): readonly CharacterProfile[] {
  return CHARACTER_REGISTRY.filter((character) => !character.isBoss);
}

export function getBossCharacters(): readonly CharacterProfile[] {
  return CHARACTER_REGISTRY.filter((character) => character.isBoss);
}

export function rollGachaCharacter(seed?: number): CharacterProfile {
  const pool = getPlayableCharacters();
  const raw =
    typeof seed === 'number' && Number.isFinite(seed)
      ? Math.abs(Math.floor(seed))
      : Math.floor(Math.random() * 10_000);
  const index = raw % pool.length;
  return pool[index] ?? CHARACTER_REGISTRY[0]!;
}
