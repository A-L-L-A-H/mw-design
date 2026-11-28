'use client';

import { useId, type CSSProperties } from 'react';
import {
  getCharacterById,
  type CharacterAccessory,
  type CharacterColorToken,
  type CharacterEyeStyle,
  type CharacterHairStyle,
  type CharacterMood,
} from '../lib/character-registry.js';
import type { LipSyncPhoneme } from '../motion/index.js';

const TOKEN_VAR: Readonly<Record<CharacterColorToken, string>> = {
  yellow: 'var(--mw-yellow)',
  magenta: 'var(--mw-magenta)',
  cyan: 'var(--mw-signal-blue)',
  violet: 'var(--mw-violet)',
  error: 'var(--mw-error)',
  success: 'var(--mw-success)',
  info: 'var(--mw-info)',
  warning: 'var(--mw-warning)',
  ink: 'var(--mw-ink-black)',
  paper: 'var(--mw-paper-cream)',
};

function renderHairBack(style: CharacterHairStyle) {
  switch (style) {
    case 'twin-tails':
      return (
        <>
          <path d="M 22 44 Q 6 58 12 88 Q 24 80 28 56 Z" className="mw-ui-anime-hair" />
          <path d="M 78 44 Q 94 58 88 88 Q 76 80 72 56 Z" className="mw-ui-anime-hair" />
        </>
      );
    case 'long-wave':
      return <path d="M 18 42 Q 10 74 20 96 L 80 96 Q 90 74 82 42 Z" className="mw-ui-anime-hair" />;
    case 'hood':
      return <path d="M 14 48 C 14 14 86 14 86 48 L 88 94 L 12 94 Z" className="mw-ui-anime-suit" />;
    default:
      return null;
  }
}

function renderHairFront(style: CharacterHairStyle) {
  switch (style) {
    case 'spiky':
      return (
        <path
          d="M 18 46 L 14 26 L 28 32 L 32 10 L 46 26 L 56 8 L 64 26 L 80 14 L 76 34 L 88 30 L 82 48 L 70 36 L 58 44 L 48 34 L 36 44 L 26 36 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'bob':
      return (
        <path
          d="M 20 56 C 18 18 82 18 80 56 L 74 62 L 72 38 L 54 44 L 46 36 L 28 42 L 26 62 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'twin-tails':
      return (
        <path
          d="M 22 44 C 22 18 78 18 78 44 L 68 38 L 56 46 L 50 36 L 38 46 L 30 38 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'swept':
      return (
        <path
          d="M 20 48 C 18 16 74 12 86 36 L 74 42 C 62 32 40 34 26 48 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'mohawk':
      return (
        <path
          d="M 38 38 L 36 12 L 50 4 L 64 12 L 62 38 L 50 32 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'hood':
      return (
        <path
          d="M 20 42 C 24 22 76 22 80 42 L 72 36 L 50 32 L 28 36 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'crest':
      return (
        <path
          d="M 22 44 L 28 18 L 50 10 L 72 18 L 78 44 L 64 36 L 50 28 L 36 36 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'pompadour':
      return (
        <path
          d="M 22 42 C 16 14 48 4 82 18 C 88 26 82 40 72 40 L 54 34 L 28 42 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'long-wave':
      return (
        <path
          d="M 20 48 C 20 18 80 18 80 48 L 68 36 L 50 44 L 34 36 Z"
          className="mw-ui-anime-hair"
        />
      );
    case 'horns':
      return (
        <path
          d="M 18 46 L 26 22 L 40 30 L 50 14 L 60 30 L 74 22 L 82 46 L 68 36 L 50 42 L 32 36 Z"
          className="mw-ui-anime-hair"
        />
      );
  }
}

function renderAccessory(accessory: CharacterAccessory) {
  switch (accessory) {
    case 'goggles':
      return (
        <g className="mw-ui-anime-accessory">
          <rect x="24" y="25" width="22" height="12" rx="4" className="mw-ui-anime-accent-fill" />
          <rect x="54" y="25" width="22" height="12" rx="4" className="mw-ui-anime-accent-fill" />
          <line x1="27" y1="29" x2="35" y2="29" className="mw-ui-anime-specular" />
          <line x1="57" y1="29" x2="65" y2="29" className="mw-ui-anime-specular" />
          <line x1="46" y1="31" x2="54" y2="31" className="mw-ui-anime-stroke" />
        </g>
      );
    case 'crown':
      return (
        <polygon
          points="30,24 34,8 44,18 50,6 56,18 66,8 70,24"
          className="mw-ui-anime-accent-fill mw-ui-anime-stroke"
        />
      );
    case 'halo':
      return <ellipse cx="50" cy="11" rx="20" ry="4.5" fill="none" className="mw-ui-anime-halo" />;
    case 'horns':
      return (
        <g className="mw-ui-anime-accessory">
          <path d="M 28 28 L 14 8 L 36 22 Z" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
          <path d="M 72 28 L 86 8 L 64 22 Z" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
        </g>
      );
    case 'scarf':
      return (
        <g className="mw-ui-anime-accessory">
          <path d="M 24 76 Q 50 86 76 76 L 80 88 Q 50 96 20 88 Z" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
          <path d="M 66 82 L 84 96 L 74 98 L 60 86 Z" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
        </g>
      );
    case 'headphones':
      return (
        <g className="mw-ui-anime-accessory">
          <path d="M 18 50 C 18 14 82 14 82 50" fill="none" className="mw-ui-anime-stroke" />
          <rect x="13" y="44" width="9" height="18" rx="4" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
          <rect x="78" y="44" width="9" height="18" rx="4" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
        </g>
      );
    case 'antenna':
      return (
        <g className="mw-ui-anime-accessory">
          <line x1="50" y1="20" x2="50" y2="5" className="mw-ui-anime-stroke" />
          <circle cx="50" cy="5" r="3.5" className="mw-ui-anime-accent-fill mw-ui-anime-stroke" />
        </g>
      );
    case 'eyepatch':
      return (
        <g className="mw-ui-anime-accessory">
          <line x1="25" y1="42" x2="76" y2="54" className="mw-ui-anime-stroke" />
          <rect x="54" y="44" width="16" height="12" rx="3" className="mw-ui-anime-ink-fill mw-ui-anime-stroke" />
        </g>
      );
    case 'mask':
      return (
        <path
          d="M 28 58 L 50 64 L 72 58 L 70 74 Q 50 82 30 74 Z"
          className="mw-ui-anime-accent-fill mw-ui-anime-stroke"
        />
      );
    default:
      return null;
  }
}

function renderEyes(eyeStyle: CharacterEyeStyle, mood: CharacterMood, irisGradId: string) {
  if (mood === 'ko') {
    return (
      <g className="mw-ui-cartoon-puppet-eyes">
        <path d="M 33 46 L 43 56 M 43 46 L 33 56" className="mw-ui-cartoon-puppet-brow" />
        <path d="M 57 46 L 67 56 M 67 46 L 57 56" className="mw-ui-cartoon-puppet-brow" />
      </g>
    );
  }
  if (eyeStyle === 'visor') {
    return (
      <g className="mw-ui-cartoon-puppet-eyes">
        <path
          d="M 26 44 L 74 44 L 70 57 L 54 57 L 50 53 L 46 57 L 30 57 Z"
          className="mw-ui-anime-accent-fill mw-ui-anime-stroke"
        />
        <line x1="33" y1="49" x2="48" y2="49" className="mw-ui-anime-specular" />
      </g>
    );
  }
  if (eyeStyle === 'cyclops') {
    return (
      <g className="mw-ui-cartoon-puppet-eyes">
        <rect x="30" y="43" width="40" height="14" rx="7" className="mw-ui-anime-ink-fill mw-ui-anime-stroke" />
        <circle cx="50" cy="50" r="5" fill={`url(#${irisGradId})`} />
        <circle cx="48" cy="48" r="1.8" className="mw-ui-anime-white-fill" />
      </g>
    );
  }

  const eyeRadiusY = mood === 'surprised' ? 7 : mood === 'happy' ? 3.5 : 5.6;
  const browLeft =
    mood === 'angry' || mood === 'determined'
      ? 'M 29 40 L 44 45'
      : mood === 'surprised'
        ? 'M 30 37 Q 38 33 45 37'
        : 'M 30 41 Q 38 39 45 41';
  const browRight =
    mood === 'angry' || mood === 'determined'
      ? 'M 71 40 L 56 45'
      : mood === 'surprised'
        ? 'M 55 37 Q 62 33 70 37'
        : 'M 55 41 Q 62 39 70 41';

  return (
    <g className="mw-ui-cartoon-puppet-eyes">
      <path d={browLeft} className="mw-ui-cartoon-puppet-brow" />
      <path d={browRight} className="mw-ui-cartoon-puppet-brow" />
      {mood === 'happy' ? (
        <>
          <path d="M 32 52 Q 38 45 44 52" fill="none" className="mw-ui-cartoon-puppet-brow" />
          <path d="M 56 52 Q 62 45 68 52" fill="none" className="mw-ui-cartoon-puppet-brow" />
        </>
      ) : (
        <g className="mw-ui-anime-blink-group">
          <ellipse cx="38" cy="51" rx="5.8" ry={eyeRadiusY} className="mw-ui-anime-white-fill mw-ui-anime-stroke" />
          <ellipse cx="62" cy="51" rx="5.8" ry={eyeRadiusY} className="mw-ui-anime-white-fill mw-ui-anime-stroke" />
          <circle cx="38.5" cy="51" r="3.9" fill={`url(#${irisGradId})`} className="mw-ui-anime-stroke" />
          <circle cx="61.5" cy="51" r="3.9" fill={`url(#${irisGradId})`} className="mw-ui-anime-stroke" />
          <circle cx="38.5" cy="51.2" r="1.8" className="mw-ui-anime-ink-fill" />
          <circle cx="61.5" cy="51.2" r="1.8" className="mw-ui-anime-ink-fill" />
          {eyeStyle === 'star' ? (
            <>
              <circle cx="38.5" cy="51" r="1.2" className="mw-ui-anime-accent-fill" />
              <circle cx="61.5" cy="51" r="1.2" className="mw-ui-anime-accent-fill" />
            </>
          ) : null}
          <circle cx="36.6" cy="48.8" r="1.6" className="mw-ui-anime-white-fill" />
          <circle cx="59.6" cy="48.8" r="1.6" className="mw-ui-anime-white-fill" />
          <circle cx="40.3" cy="52.6" r="0.8" className="mw-ui-anime-white-fill" />
          <circle cx="63.3" cy="52.6" r="0.8" className="mw-ui-anime-white-fill" />
        </g>
      )}
    </g>
  );
}

export interface AnimeCharacterSvgProps {
  readonly characterId?: string;
  readonly mood: CharacterMood;
  readonly phoneme: LipSyncPhoneme;
}

export function AnimeCharacterSvg({ characterId, mood, phoneme }: AnimeCharacterSvgProps) {
  const uid = useId().replace(/:/g, '');
  const skinGradId = `mw-skin-${uid}`;
  const irisGradId = `mw-iris-${uid}`;
  const profile = getCharacterById(characterId);
  const visual = profile?.visual ?? {
    hairStyle: 'spiky' as CharacterHairStyle,
    eyeStyle: 'sharp' as CharacterEyeStyle,
    accessory: 'scarf' as CharacterAccessory,
    primaryTone: 'yellow' as CharacterColorToken,
    accentTone: 'magenta' as CharacterColorToken,
    hairTone: 'ink' as CharacterColorToken,
    badgeMark: 'MW',
  };

  const mouthPath =
    phoneme === 'wide'
      ? 'M 40 64 Q 50 75 60 64 Q 50 67 40 64 Z'
      : phoneme === 'o-shape'
        ? 'M 45 66 A 5 5 0 1 0 55 66 A 5 5 0 1 0 45 66 Z'
        : phoneme === 'small'
          ? 'M 43 66 Q 50 70 57 66'
          : mood === 'happy'
            ? 'M 40 64 Q 50 72 60 64'
            : mood === 'angry'
              ? 'M 41 69 Q 50 63 59 69'
              : mood === 'surprised'
                ? 'M 46 66 A 4 4 0 1 0 54 66 A 4 4 0 1 0 46 66 Z'
                : mood === 'ko'
                  ? 'M 42 68 Q 46 65 50 68 Q 54 71 58 68'
                  : 'M 43 66 L 57 66';

  const cssVars = {
    '--mw-char-primary': TOKEN_VAR[visual.primaryTone],
    '--mw-char-accent': TOKEN_VAR[visual.accentTone],
    '--mw-char-hair': TOKEN_VAR[visual.hairTone],
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 100 100"
      className="mw-ui-cartoon-puppet-svg"
      style={cssVars}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skinGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mw-anime-skin-highlight, var(--mw-anime-skin, var(--mw-paper)))" />
          <stop offset="68%" stopColor="var(--mw-anime-skin, var(--mw-paper))" />
          <stop offset="100%" stopColor="var(--mw-anime-skin-shade, var(--mw-muted))" />
        </linearGradient>
        <linearGradient id={irisGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mw-ink-black)" />
          <stop offset="45%" stopColor="var(--mw-char-accent, var(--mw-magenta))" />
          <stop offset="100%" stopColor="var(--mw-char-primary, var(--mw-cyan))" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="54" r="42" className="mw-ui-anime-aura" />
      {renderHairBack(visual.hairStyle)}
      <path d="M 22 96 C 24 78 36 74 50 74 C 64 74 76 78 78 96 Z" className="mw-ui-anime-suit" />
      <path d="M 43 71 V 80 C 46 83 54 83 57 80 V 71 Z" fill={`url(#${skinGradId})`} className="mw-ui-anime-stroke" />
      <path d="M 44 73 Q 50 77 56 73 L 56 76 Q 50 79 44 76 Z" className="mw-ui-anime-skin-shadow" />
      <path d="M 38 76 L 50 86 L 62 76" fill="none" className="mw-ui-anime-collar" />
      <circle cx="23" cy="52" r="4.2" fill={`url(#${skinGradId})`} className="mw-ui-anime-stroke" />
      <circle cx="77" cy="52" r="4.2" fill={`url(#${skinGradId})`} className="mw-ui-anime-stroke" />
      <path
        d="M 24 44 C 24 22 76 22 76 44 C 76 62 66 74 50 76 C 34 74 24 62 24 44 Z"
        fill={`url(#${skinGradId})`}
        className="mw-ui-cartoon-puppet-head"
        style={{ fill: `url(#${skinGradId})` }}
      />
      <path d="M 28 63 Q 50 74 72 63 C 68 71 58 75 50 75 C 42 75 32 71 28 63 Z" className="mw-ui-anime-skin-shadow" />
      <path
        d="M 30 34 C 36 27 52 25 66 30 C 56 30 40 32 30 40 Z"
        className="mw-ui-anime-cel-sheen"
      />
      <ellipse cx="30" cy="58" rx="4.2" ry="2.2" className="mw-ui-anime-blush" />
      <ellipse cx="70" cy="58" rx="4.2" ry="2.2" className="mw-ui-anime-blush" />
      <path d="M 49.5 56 L 48.2 59.5 L 50.8 60" className="mw-ui-anime-skin-line" />
      {renderEyes(visual.eyeStyle, mood, irisGradId)}
      <path d={mouthPath} className="mw-ui-cartoon-puppet-mouth" />
      {renderHairFront(visual.hairStyle)}
      <path d="M 30 30 Q 44 23 64 29" fill="none" className="mw-ui-anime-cel-sheen mw-ui-anime-hair-sheen" stroke="var(--mw-dna-cel-highlight)" strokeWidth="2.2" strokeLinecap="round" />
      {renderAccessory(visual.accessory)}
    </svg>
  );
}
