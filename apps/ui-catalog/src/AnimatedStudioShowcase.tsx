import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  CopyButton,
  GENRE_DNA_PRESETS,
  applyGenreDnaAttribute,
  type GenreDnaPreset,
  type GenreDnaPresetId,
} from '@moonwitness/ui';
import {
  DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  MOTION_EASING_NAMES,
  MotionProvider,
  MotionTimeline,
  applyEasingPresetToKeyframes,
  evaluateEasing,
  playProceduralSfx,
  sampleEasingCurve,
  type MotionEasingName,
  type MotionProfile,
  type MotionTimelineKeyframe,
} from '@moonwitness/ui/motion';
import {
  AppCommandTemplate,
  CartoonStudioTemplate,
  GameBattleTemplate,
  WebLandingTemplate,
} from '@moonwitness/ui/templates';
import { DnaRosterAndIconsStudio } from './DnaRosterAndIconsStudio.js';

type StudioTemplateId = 'web' | 'app' | 'game' | 'cartoon';
type ViewportSize = 'full' | 'tablet' | 'mobile';
type TimelinePresetId = 'hero' | 'game-hit' | 'cartoon-squash';

const TIMELINE_PRESETS: ReadonlyArray<{
  id: TimelinePresetId;
  label: string;
  durationMs: number;
  subtitle: string;
  keyframes: readonly MotionTimelineKeyframe[];
}> = [
  {
    id: 'hero',
    label: 'Hero Entrance',
    durationMs: 1600,
    subtitle: 'Anticipation pull-back into overshoot peak, soft settle, and final rest.',
    keyframes: DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  },
  {
    id: 'game-hit',
    label: 'Game Hit Bounce',
    durationMs: 1200,
    subtitle: 'Rapid elastic spike on impact followed by decaying bounce recovery.',
    keyframes: [
      { id: 'hit-0', label: 'Windup', at: 0, value: 0.1, easing: 'ease-in-out' },
      { id: 'hit-1', label: 'Impact', at: 0.24, value: 1, easing: 'elastic' },
      { id: 'hit-2', label: 'Rebound', at: 0.62, value: 0.35, easing: 'bounce' },
      { id: 'hit-3', label: 'Ready', at: 1, value: 0.1, easing: 'ease-out' },
    ],
  },
  {
    id: 'cartoon-squash',
    label: 'Cartoon 12fps Jump',
    durationMs: 1800,
    subtitle: 'Cel-animated stepped easing mixed with squash anticipation and spring landing.',
    keyframes: [
      { id: 'toon-0', label: 'Squash', at: 0, value: 0.18, easing: 'anticipation' },
      { id: 'toon-1', label: 'Leap', at: 0.42, value: 0.96, easing: 'steps-12' },
      { id: 'toon-2', label: 'Hang', at: 0.68, value: 0.84, easing: 'spring' },
      { id: 'toon-3', label: 'Land', at: 1, value: 0.2, easing: 'ease-out' },
    ],
  },
];

const STUDIO_TEMPLATES: ReadonlyArray<{
  id: StudioTemplateId;
  label: string;
  badge: string;
  importSnippet: string;
}> = [
  {
    id: 'web',
    label: 'Web Landing',
    badge: 'Marketing & Kinetic',
    importSnippet: "import { WebLandingTemplate } from '@moonwitness/ui/templates';",
  },
  {
    id: 'app',
    label: 'App Shell',
    badge: 'SaaS & Command',
    importSnippet: "import { AppCommandTemplate } from '@moonwitness/ui/templates';",
  },
  {
    id: 'game',
    label: 'Game Battle HUD',
    badge: 'RPG & Arcade',
    importSnippet: "import { GameBattleTemplate } from '@moonwitness/ui/templates';",
  },
  {
    id: 'cartoon',
    label: 'Cartoon Studio',
    badge: '2D Rig & Storyboard',
    importSnippet: "import { CartoonStudioTemplate } from '@moonwitness/ui/templates';",
  },
];

const MOTION_PROFILES: readonly MotionProfile[] = ['off', 'subtle', 'expressive', 'cartoon'];

const VIEWPORT_OPTIONS: ReadonlyArray<{ id: ViewportSize; label: string }> = [
  { id: 'full', label: 'Desktop 100%' },
  { id: 'tablet', label: 'Tablet 768px' },
  { id: 'mobile', label: 'Mobile 390px' },
];

export function AnimatedStudioShowcase({
  onApplyDnaPreset,
}: {
  onApplyDnaPreset?: (preset: GenreDnaPreset) => void;
}) {
  const [template, setTemplate] = useState<StudioTemplateId>('web');
  const [viewport, setViewport] = useState<ViewportSize>('full');
  const [motionProfile, setMotionProfile] = useState<MotionProfile>('expressive');
  const [activeDnaPreset, setActiveDnaPreset] = useState<GenreDnaPresetId | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState(false);

  // Motion Timeline state
  const [timelinePresetId, setTimelinePresetId] = useState<TimelinePresetId>('hero');
  const [timelineKeyframes, setTimelineKeyframes] = useState<readonly MotionTimelineKeyframe[]>(
    TIMELINE_PRESETS[0].keyframes
  );

  // Motion & Curve Lab state
  const [curve, setCurve] = useState<MotionEasingName>('overshoot');
  const [durationMs, setDurationMs] = useState(640);
  const [playNonce, setPlayNonce] = useState(0);
  const [progress, setProgress] = useState(1);

  const activeTemplate =
    STUDIO_TEMPLATES.find((item) => item.id === template) ?? STUDIO_TEMPLATES[0];
  const activeTimelinePreset =
    TIMELINE_PRESETS.find((item) => item.id === timelinePresetId) ?? TIMELINE_PRESETS[0];

  const curveSamples = useMemo(() => sampleEasingCurve(curve, 64), [curve]);

  const svgPolyline = useMemo(() => {
    const width = 260;
    const height = 110;
    const padX = 14;
    const padY = 18;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    return curveSamples
      .map((point) => {
        const x = padX + point.t * usableW;
        const clamped = Math.max(-0.25, Math.min(1.25, point.y));
        const y = padY + (1 - clamped) * usableH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [curveSamples]);

  useEffect(() => {
    if (playNonce === 0) return;
    if (motionProfile === 'off') {
      setProgress(1);
      return;
    }
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / Math.max(120, durationMs));
      setProgress(t);
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    setProgress(0);
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [playNonce, durationMs, motionProfile]);

  const easedValue = evaluateEasing(progress, curve);
  const velocityStretch =
    progress > 0 && progress < 1 ? 1 + Math.min(0.22, Math.abs(easedValue - progress) * 0.45) : 1;

  const dotX = 14 + progress * (260 - 28);
  const dotY = 18 + (1 - Math.max(-0.25, Math.min(1.25, easedValue))) * (110 - 36);

  return (
    <div className="catalog-studio" data-testid="animated-studio-showcase">
      <div className="catalog-studio-header">
        <div>
          <div className="catalog-studio-title-row">
            <h3 className="catalog-studio-title">Universal Animated Template Studio</h3>
            <Badge variant="magenta" size="sm">
              Web · App · Game · Cartoon
            </Badge>
          </div>
          <p className="catalog-studio-subtitle">
            Switch between production starter templates, responsive viewports, and motion intensity
            profiles—all powered by modular <code>@moonwitness/ui</code> entry points.
          </p>
        </div>
        <CopyButton value={activeTemplate.importSnippet} label="Copy template import" />
      </div>

      <div className="catalog-dna-preset-bar" data-testid="dna-preset-bar">
        <span className="catalog-dna-preset-label">Genre DNA Presets:</span>
        <div className="catalog-studio-group" role="group" aria-label="Atomic genre DNA presets">
          {GENRE_DNA_PRESETS.map((preset) => {
            const active = activeDnaPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className="catalog-playground-option"
                data-active={active ? 'true' : 'false'}
                data-dna-preset={preset.id}
                aria-pressed={active}
                title={preset.description}
                onClick={() => {
                  setActiveDnaPreset(preset.id);
                  setMotionProfile(preset.motionProfile);
                  applyGenreDnaAttribute(preset.dnaAttribute);
                  onApplyDnaPreset?.(preset);
                  if (sfxEnabled) playProceduralSfx('toggle-pop', true, true);
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="catalog-studio-controls">
        <div className="catalog-studio-group" role="group" aria-label="Animated template selector">
          {STUDIO_TEMPLATES.map((item) => {
            const active = item.id === template;
            return (
              <button
                key={item.id}
                type="button"
                className="catalog-playground-tab"
                data-active={active ? 'true' : 'false'}
                aria-pressed={active}
                onClick={() => {
                  setTemplate(item.id);
                  if (sfxEnabled) playProceduralSfx('click-soft', true, true);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="catalog-studio-secondary-controls">
          <div className="catalog-studio-group" role="group" aria-label="Template viewport width">
            {VIEWPORT_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="catalog-playground-option"
                data-active={viewport === item.id ? 'true' : 'false'}
                aria-pressed={viewport === item.id}
                onClick={() => setViewport(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="catalog-studio-group" role="group" aria-label="Motion intensity profile">
            {MOTION_PROFILES.map((profile) => (
              <button
                key={profile}
                type="button"
                className="catalog-playground-option"
                data-active={motionProfile === profile ? 'true' : 'false'}
                aria-pressed={motionProfile === profile}
                onClick={() => {
                  setMotionProfile(profile);
                  if (sfxEnabled) playProceduralSfx('toggle-pop', true, true);
                }}
              >
                {profile}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="catalog-playground-option"
            data-active={sfxEnabled ? 'true' : 'false'}
            aria-pressed={sfxEnabled}
            onClick={() => {
              const next = !sfxEnabled;
              setSfxEnabled(next);
              if (next) playProceduralSfx('success-chime', true, true);
            }}
          >
            {sfxEnabled ? 'SFX: On' : 'SFX: Off'}
          </button>
        </div>
      </div>

      <MotionProvider
        profile={motionProfile}
        sfxEnabled={sfxEnabled}
        syncDocumentAttribute={false}
      >
        <div
          className="catalog-studio-stage"
          data-viewport={viewport}
          data-motion-profile={motionProfile}
          data-testid="studio-template-stage"
        >
          {template === 'web' ? <WebLandingTemplate /> : null}
          {template === 'app' ? <AppCommandTemplate /> : null}
          {template === 'game' ? <GameBattleTemplate /> : null}
          {template === 'cartoon' ? <CartoonStudioTemplate /> : null}
        </div>

        <DnaRosterAndIconsStudio sfxEnabled={sfxEnabled} />

        <div className="catalog-timeline-showcase" data-testid="motion-timeline-showcase">
          <div className="catalog-timeline-showcase-bar">
            <div className="catalog-studio-group" role="group" aria-label="Motion timeline presets">
              {TIMELINE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="catalog-playground-option"
                  data-active={timelinePresetId === preset.id ? 'true' : 'false'}
                  aria-pressed={timelinePresetId === preset.id}
                  onClick={() => {
                    setTimelinePresetId(preset.id);
                    setTimelineKeyframes(preset.keyframes);
                    if (sfxEnabled) playProceduralSfx('click-soft', true, true);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <CopyButton
              value="import { MotionTimeline } from '@moonwitness/ui/motion';"
              label="Copy MotionTimeline import"
            />
          </div>

          <MotionTimeline
            title={`Motion Timeline · ${activeTimelinePreset.label}`}
            subtitle={activeTimelinePreset.subtitle}
            keyframes={timelineKeyframes}
            durationMs={activeTimelinePreset.durationMs}
            defaultProgress={0.28}
            showPresetLibrary
            onApplyEasingPreset={(easing, scope, segmentIndex) => {
              setTimelineKeyframes((prev) =>
                applyEasingPresetToKeyframes(prev, easing, scope, segmentIndex)
              );
            }}
          />
        </div>
      </MotionProvider>

      <div className="catalog-curve-lab" data-testid="motion-curve-lab">
        <div className="catalog-curve-lab-head">
          <div>
            <h4 className="catalog-curve-lab-title">Motion &amp; Easing Curve Lab</h4>
            <p className="catalog-curve-lab-copy">
              Inspect all {MOTION_EASING_NAMES.length} deterministic curves—including cubic &amp;
              expo easing, back overshoot, elastic bounce, anticipation, and cel-animation stepped
              framerates (8 / 12 / 24 fps).
            </p>
          </div>
          <div className="catalog-curve-lab-actions">
            <label className="catalog-curve-duration">
              <span>Duration: {durationMs}ms</span>
              <input
                type="range"
                min={240}
                max={1200}
                step={40}
                value={durationMs}
                onChange={(event) => setDurationMs(Number(event.target.value))}
                aria-label="Curve duration in milliseconds"
              />
            </label>
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setPlayNonce((n) => n + 1);
                if (sfxEnabled) playProceduralSfx('boing', true, true);
              }}
            >
              Replay curve
            </Button>
          </div>
        </div>

        <div className="catalog-studio-group" role="group" aria-label="Easing curve selector">
          {MOTION_EASING_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              className="catalog-playground-option"
              data-active={curve === name ? 'true' : 'false'}
              aria-pressed={curve === name}
              onClick={() => {
                setCurve(name);
                setPlayNonce((n) => n + 1);
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="catalog-curve-visual-grid">
          <div className="catalog-curve-graph-card">
            <svg
              viewBox="0 0 260 110"
              className="catalog-curve-svg"
              role="img"
              aria-label={`Easing curve graph for ${curve}`}
            >
              <line x1="14" y1="18" x2="246" y2="18" className="catalog-curve-guide" />
              <line x1="14" y1="92" x2="246" y2="92" className="catalog-curve-guide" />
              <polyline points={svgPolyline} className="catalog-curve-path" />
              <circle cx={dotX} cy={dotY} r="5" className="catalog-curve-dot" />
            </svg>
            <div className="catalog-curve-readout">
              <span>curve: {curve}</span>
              <span>t: {progress.toFixed(2)}</span>
              <span>val: {easedValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="catalog-curve-track-card">
            <span className="catalog-curve-track-label">Live Squash &amp; Stretch Preview</span>
            <div className="catalog-curve-track">
              <div
                className="catalog-curve-ball"
                style={{
                  left: `calc(16px + (${Math.max(-0.08, Math.min(1.08, easedValue)).toFixed(4)} * (100% - 64px)))`,
                  transform: `scaleX(${velocityStretch.toFixed(2)}) scaleY(${(1 / velocityStretch).toFixed(2)})`,
                }}
              />
            </div>
            <code className="catalog-curve-code">
              {`evaluateEasing(${progress.toFixed(2)}, '${curve}') // => ${easedValue.toFixed(3)}`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

