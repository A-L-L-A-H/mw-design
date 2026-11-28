import { useMemo, useState } from 'react';
import {
  CHARACTER_REGISTRY,
  CharacterBadge,
  getExtendedLoreCast,
  getMoonWitnessXiiCast,
  RiotSticker,
  SketchAnnotation,
  SpritePlayer,
  type CharacterProfile,
  type SpriteClipMetadata,
  type SpriteSheetAtlas,
} from '@moonwitness/ui';

type PlaybackMode = 'blink' | 'wave' | 'overdrive';

const MODE_LABELS: Record<PlaybackMode, string> = {
  blink: 'Blink',
  wave: 'Wave',
  overdrive: 'Overdrive',
};

const MODE_ASSETS: Record<PlaybackMode, { path: string; fps: number; columns: number; rows: number }> = {
  blink: { path: 'animation/kuro-signal-blink/kuro-signal-blink-sheet.png', fps: 8, columns: 4, rows: 4 },
  wave: { path: 'animation/kuro-signal-wave/kuro-signal-wave-sheet.png', fps: 8, columns: 4, rows: 4 },
  overdrive: {
    path: 'animation/rocksoul-resonance-overdrive/rocksoul-resonance-overdrive-sheet.png',
    fps: 10,
    columns: 4,
    rows: 4,
  },
};

const CLIP_FRAMES = Array.from({ length: 16 }, (_, index) => String(index));
const FEATURED_IDS = ['kuro-signal', 'vesper-ink', 'rocksoul-witness', 'the-shadow'];

function findProfile(id: string): CharacterProfile | undefined {
  return CHARACTER_REGISTRY.find((entry) => entry.id === id)
    ?? getMoonWitnessXiiCast().find((entry) => entry.id === id)
    ?? getExtendedLoreCast().find((entry) => entry.id === id);
}

function assetHref(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\/+/u, '')}`;
}

function createClip(mode: PlaybackMode): SpriteClipMetadata {
  const asset = MODE_ASSETS[mode];
  return {
    id: `character-universe-${mode}`,
    frames: CLIP_FRAMES,
    fps: asset.fps,
    loop: true,
    pingPong: true,
    fallbackAsset: assetHref(asset.path),
    width: 256,
    height: 256,
  };
}

function createAtlas(mode: PlaybackMode): SpriteSheetAtlas {
  const asset = MODE_ASSETS[mode];
  return {
    src: assetHref(asset.path),
    columns: asset.columns,
    rows: asset.rows,
    frameWidth: 256,
    frameHeight: 256,
    frameCount: 16,
  };
}

function CharacterRoster({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em' }}>REGISTRY ROSTER</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Character registry">
        {FEATURED_IDS.map((id) => {
          const profile = findProfile(id);
          if (!profile) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={selectedId === id}
              style={{ minHeight: '2.75rem', padding: '0.35rem 0.5rem', border: '1px solid var(--mw-border)', background: selectedId === id ? 'var(--mw-primary)' : 'var(--mw-surface)', color: selectedId === id ? 'var(--mw-primary-foreground)' : 'var(--mw-foreground)', cursor: 'pointer' }}
            >
              <CharacterBadge characterId={id} size="sm" showGroup={false} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlaybackControls({ mode, onMode }: { mode: PlaybackMode; onMode: (next: PlaybackMode) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Sprite playback mode">
      {(Object.keys(MODE_LABELS) as PlaybackMode[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onMode(option)}
          aria-pressed={mode === option}
          style={{ minHeight: '2.75rem', padding: '0.5rem 0.8rem', border: '1px solid var(--mw-border)', background: mode === option ? 'var(--mw-primary)' : 'var(--mw-surface)', color: mode === option ? 'var(--mw-primary-foreground)' : 'var(--mw-foreground)', cursor: 'pointer' }}
        >
          {MODE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

function SpriteStage({ mode }: { mode: PlaybackMode }) {
  const clip = useMemo(() => createClip(mode), [mode]);
  const atlas = useMemo(() => createAtlas(mode), [mode]);
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: '0.7rem', padding: '1rem', border: '1px solid var(--mw-border)', background: 'var(--mw-background)' }}>
      <div style={{ width: 'min(100%, 17rem)', aspectRatio: '1', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        <SpritePlayer clip={clip} spriteSheet={atlas} label={`Kuro ${MODE_LABELS[mode]} sprite`} scale={0.72} />
      </div>
      <SketchAnnotation mark="underline" tone="yellow" note="atlas playback">
        <strong>{MODE_LABELS[mode].toUpperCase()}</strong>
      </SketchAnnotation>
    </div>
  );
}

export function VisualUniverseStudio() {
  const [mode, setMode] = useState<PlaybackMode>('blink');
  const [selectedId, setSelectedId] = useState('kuro-signal');
  const selected = findProfile(selectedId);
  const loreCount = getMoonWitnessXiiCast().length + getExtendedLoreCast().length;

  return (
    <div data-testid="character-universe-studio" style={{ display: 'grid', gap: '1.25rem', minWidth: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(15rem, 0.75fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '1rem', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <p className="catalog-kicker" style={{ margin: 0 }}>LIVE CHARACTER DIRECTION</p>
            <h3 style={{ margin: 0 }}>A roster you can hear in the frames</h3>
            <p style={{ margin: 0, maxWidth: '48rem' }}>
              Pick a registry character, then switch the atlas state to inspect the exact motion language used by the universe.
            </p>
          </div>
          <SpriteStage mode={mode} />
          <PlaybackControls mode={mode} onMode={setMode} />
        </div>
        <aside style={{ display: 'grid', gap: '1rem', padding: '1rem', border: '1px solid var(--mw-border)', background: 'var(--mw-surface)' }} aria-label="Character profile inspector">
          <CharacterRoster selectedId={selectedId} onSelect={setSelectedId} />
          {selected ? (
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <CharacterBadge characterId={selected.id} showGroup />
              <SketchAnnotation mark="bracket" tone="cyan" note={selected.codename}>
                <strong>{selected.title}</strong>
              </SketchAnnotation>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{selected.ultimate.quote}</p>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem', margin: 0, fontSize: '0.78rem' }}>
                <dt>Element</dt><dd style={{ margin: 0 }}>{selected.element}</dd>
                <dt>Rarity</dt><dd style={{ margin: 0 }}>{selected.rarity}</dd>
                <dt>Ultimate</dt><dd style={{ margin: 0 }}>{selected.ultimate.name}</dd>
              </dl>
            </div>
          ) : <p role="status">Character profile is unavailable.</p>}
        </aside>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <SketchAnnotation mark="circle" tone="magenta" note="canon registry">
            <strong>{loreCount} lore profiles</strong>
          </SketchAnnotation>
          <span style={{ fontSize: '0.8rem' }}>MoonWitness XII plus the Extended Lore Cast.</span>
        </div>
        <RiotSticker slug="signal-locked" size="md" tilt="left" label="Signal locked sticker" basePath={import.meta.env.BASE_URL} />
        <RiotSticker slug="ship-it" size="md" tilt="right" label="Ship it sticker" basePath={import.meta.env.BASE_URL} />
        <p style={{ margin: 0, fontSize: '0.82rem' }}>Stickers mark editorial intent, while badges keep identity and canon status readable.</p>
      </div>
    </div>
  );
}
