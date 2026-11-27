import { useMemo, useState } from 'react';
import { Badge, CopyButton, Input } from '@moonwitness/ui';

export type ApiPropSpec = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentApiSpec = {
  id: string;
  name: string;
  category: 'Core' | 'Form' | 'Overlay' | 'Feedback' | 'Theme' | 'Motion' | 'Game' | 'Cartoon' | 'Templates';
  importSnippet: string;
  summary: string;
  props: readonly ApiPropSpec[];
  tokens: readonly string[];
};

export const COMPONENT_API_SPECS: readonly ComponentApiSpec[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Core',
    importSnippet: "import { Button } from '@moonwitness/ui';",
    summary: 'Polymorphic action trigger with brush/solid treatments, loading guard, and ref forwarding.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'magenta' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
        defaultValue: "'default'",
        description: 'Semantic visual emphasis and surface contrast.',
      },
      {
        name: 'size',
        type: "'xs' | 'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'",
        defaultValue: "'default'",
        description: 'Control height, horizontal rhythm, or square icon dimensions.',
      },
      {
        name: 'treatment',
        type: "'solid' | 'brush'",
        defaultValue: "'solid'",
        description: 'Switches between crisp ink-bordered frames and brush-clipped zine shapes.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Shows an inline spinner, sets aria-busy, and blocks duplicate clicks.',
      },
      {
        name: 'asChild',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Renders props onto the single child element via Radix Slot.',
      },
    ],
    tokens: ['--mw-primary', '--mw-magenta', '--mw-frame-width', '--mw-shadow-ink'],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Core',
    importSnippet: "import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@moonwitness/ui';",
    summary: 'Structured container surface with header, body, and footer slots across elevation variants.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'elevated' | 'muted' | 'interactive'",
        defaultValue: "'default'",
        description: 'Controls border contrast, shadow depth, and hover lift.',
      },
      {
        name: 'padding',
        type: "'none' | 'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        description: 'Internal padding scale applied across card sections.',
      },
    ],
    tokens: ['--mw-card', '--mw-card-foreground', '--mw-border', '--mw-shadow-ink'],
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback',
    importSnippet: "import { Alert, AlertTitle, AlertDescription } from '@moonwitness/ui';",
    summary: 'Inline status callout supporting accessible live semantics and optional dismissal.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'info' | 'success' | 'warning' | 'destructive'",
        defaultValue: "'default'",
        description: 'Semantic border accent and icon tone.',
      },
      {
        name: 'onDismiss',
        type: '() => void',
        defaultValue: 'undefined',
        description: 'Renders an accessible close button when supplied.',
      },
    ],
    tokens: ['--mw-info', '--mw-success', '--mw-warning', '--mw-destructive'],
  },
  {
    id: 'field',
    name: 'Field & Input',
    category: 'Form',
    importSnippet: "import { Field, Input } from '@moonwitness/ui';",
    summary: 'Accessible form field wrapper wiring label, description, error message, and aria-describedby automatically.',
    props: [
      {
        name: 'label',
        type: 'ReactNode',
        defaultValue: 'required',
        description: 'Visible label bound to the child input via htmlFor.',
      },
      {
        name: 'description',
        type: 'ReactNode',
        defaultValue: 'undefined',
        description: 'Helper text linked via aria-describedby.',
      },
      {
        name: 'error',
        type: 'ReactNode',
        defaultValue: 'undefined',
        description: 'Validation message; automatically sets aria-invalid on the child control.',
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Displays a required indicator and marks the input required.',
      },
    ],
    tokens: ['--mw-input', '--mw-ring', '--mw-destructive', '--mw-muted-foreground'],
  },
  {
    id: 'switch-checkbox',
    name: 'Switch & Checkbox',
    category: 'Form',
    importSnippet: "import { Switch, Checkbox } from '@moonwitness/ui';",
    summary: 'Cross-browser binary toggles with pure CSS skins and indeterminate Checkbox ref support.',
    props: [
      {
        name: 'checked',
        type: 'boolean',
        defaultValue: 'undefined',
        description: 'Controlled toggle state.',
      },
      {
        name: 'size (Switch)',
        type: "'sm' | 'default'",
        defaultValue: "'default'",
        description: 'Compact or standard track and thumb dimensions.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents pointer/keyboard interaction and dims surface contrast.',
      },
    ],
    tokens: ['--mw-primary', '--mw-border-strong', '--mw-ring', '--mw-surface-elevated'],
  },
  {
    id: 'dialog-sheet',
    name: 'Dialog & Sheet',
    category: 'Overlay',
    importSnippet: "import { Dialog, DialogTrigger, DialogContent, Sheet, SheetContent } from '@moonwitness/ui';",
    summary: 'Accessible modal and slide-over overlays powered by Radix primitives with zero Tailwind runtime dependency.',
    props: [
      {
        name: 'open / onOpenChange',
        type: 'boolean / (open: boolean) => void',
        defaultValue: 'uncontrolled',
        description: 'Controlled visibility state for modal or drawer.',
      },
      {
        name: 'showCloseButton',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Toggles the top-right accessible close trigger.',
      },
      {
        name: 'side (SheetContent)',
        type: "'top' | 'right' | 'bottom' | 'left'",
        defaultValue: "'right'",
        description: 'Viewport edge from which the slide-over drawer enters.',
      },
    ],
    tokens: ['--mw-popover', '--mw-border-strong', '--mw-shadow-ink-lg', '--mw-motion-normal'],
  },
  {
    id: 'breadcrumbs-banner',
    name: 'Breadcrumbs & UpdateBanner',
    category: 'Feedback',
    importSnippet: "import { Breadcrumbs, UpdateBanner, sanitizeUrl } from '@moonwitness/ui';",
    summary: 'Navigation trails and release update banners with built-in safe URL validation on dynamic links.',
    props: [
      {
        name: 'items (Breadcrumbs)',
        type: 'readonly { label: string; href?: string; onClick?: () => void }[]',
        defaultValue: 'required',
        description: 'Trail segments; unsafe URL schemes are filtered automatically.',
      },
      {
        name: 'status (UpdateBanner)',
        type: "'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'",
        defaultValue: "'idle'",
        description: 'Controls live status messaging and primary action button.',
      },
      {
        name: 'releaseUrl (UpdateBanner)',
        type: 'string',
        defaultValue: 'undefined',
        description: 'Optional release-notes link validated via sanitizeUrl().',
      },
    ],
    tokens: ['--mw-border', '--mw-primary', '--mw-muted-foreground', '--mw-destructive'],
  },
  {
    id: 'theme-provider',
    name: 'ThemeProvider',
    category: 'Theme',
    importSnippet: "import { ThemeProvider, useTheme, createSkinInitScript } from '@moonwitness/ui';",
    summary: 'Root context synchronizing light, dark, and high-contrast modes, skins, density, and SSR no-flash script.',
    props: [
      {
        name: 'defaultMode',
        type: "'light' | 'dark' | 'high-contrast'",
        defaultValue: "'light'",
        description: 'Initial color mode before persisted storage overrides.',
      },
      {
        name: 'defaultSkin',
        type: 'SkinId',
        defaultValue: "'signal-riot'",
        description: 'Active visual skin applied to data-skin.',
      },
      {
        name: 'defaultDensity',
        type: "'comfortable' | 'compact'",
        defaultValue: "'comfortable'",
        description: 'Global layout rhythm applied to data-density.',
      },
      {
        name: 'storageKey',
        type: 'string',
        defaultValue: "'mw-ui-theme'",
        description: 'Local storage key shared with createSkinInitScript({ storageKey }).',
      },
    ],
    tokens: ['--mw-background', '--mw-foreground', '--mw-surface-elevated', '--mw-font-display'],
  },
  {
    id: 'motion-engine',
    name: 'MotionProvider & MotionStage',
    category: 'Motion',
    importSnippet:
      "import { MotionProvider, MotionStage, ScrollReveal, KineticText, AnimatedNumber, evaluateEasing } from '@moonwitness/ui/motion';",
    summary:
      'Universal animation context controlling motion intensity profiles (off/subtle/expressive/cartoon), deterministic spring & 18-curve easing physics, and hitstop/camera shake.',
    props: [
      {
        name: 'defaultProfile (MotionProvider)',
        type: "'off' | 'subtle' | 'expressive' | 'cartoon'",
        defaultValue: "'expressive'",
        description: 'Scales motion amplitude and honors prefers-reduced-motion automatically.',
      },
      {
        name: 'defaultSfxEnabled (MotionProvider)',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Enables procedural WebAudio synth sound feedback for interactive triggers.',
      },
      {
        name: 'shakeIntensity / hitstopMs (MotionStage)',
        type: 'number',
        defaultValue: '0',
        description: 'Triggers deterministic damped camera shake or impact freeze frames.',
      },
      {
        name: 'splitBy (KineticText)',
        type: "'word' | 'char'",
        defaultValue: "'word'",
        description: 'Controls staggered word or character headline entrance.',
      },
    ],
    tokens: ['--mw-motion-scale', '--mw-motion-fast', '--mw-motion-normal', '--mw-motion-ease-emphasis'],
  },
  {
    id: 'motion-timeline',
    name: 'MotionTimeline',
    category: 'Motion',
    importSnippet:
      "import { MotionTimeline, MOTION_EASING_PRESETS, applyEasingPresetToKeyframes, type MotionTimelineKeyframe } from '@moonwitness/ui/motion';",
    summary:
      'Interactive SVG keyframe progress visualizer with per-segment easing curve paths, a built-in 18-curve easing preset library (ease-in-out-back, elastic, spring, bounce, stepped), live scrubbing, and play/pause transport.',
    props: [
      {
        name: 'keyframes',
        type: 'readonly MotionTimelineKeyframe[]',
        defaultValue: 'DEFAULT_MOTION_TIMELINE_KEYFRAMES',
        description: 'Ordered keyframe stops with normalized time (at: 0..1), value (0..1), and segment easing curve.',
      },
      {
        name: 'durationMs',
        type: 'number',
        defaultValue: '1600',
        description: 'Total animation timeline duration in milliseconds.',
      },
      {
        name: 'playing / defaultPlaying',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controls playback state for the play/pause transport button and requestAnimationFrame loop.',
      },
      {
        name: 'progress / onProgressChange',
        type: 'number / (progress: number) => void',
        defaultValue: '0',
        description: 'Normalized timeline progress (0..1) synced across SVG easing paths, playhead, and scrubber.',
      },
      {
        name: 'showPresetLibrary / defaultApplyScope',
        type: "boolean / 'all' | 'segment'",
        defaultValue: "false / 'all'",
        description: 'Displays the categorized SVG easing preset library (Standard, Back & Overshoot, Physics, Stepped) to update all segments or the active segment instantly.',
      },
      {
        name: 'onApplyEasingPreset',
        type: '(easing, scope, segmentIndex) => void',
        defaultValue: 'uncontrolled',
        description: 'Optional controlled callback invoked when a preset curve is selected; omit for built-in uncontrolled timeline updates.',
      },
    ],
    tokens: ['--mw-magenta-readable', '--mw-primary', '--mw-border-strong', '--mw-shadow-ink'],
  },
  {
    id: 'game-hud-kit',
    name: 'StatGauge & DialogueBox',
    category: 'Game',
    importSnippet:
      "import { StatGauge, DialogueBox, InventoryGrid, ActionHotbar, ComboCounter, RadialMenu, useGamepadNavigation } from '@moonwitness/ui/game';",
    summary:
      'Game HUD suite with delayed-trail HP/MP gauges, typewriter dialogue trees, keyboard/gamepad roving focus, cooldown hotbars, and radial command wheels.',
    props: [
      {
        name: 'tone (StatGauge)',
        type: "'hp' | 'mp' | 'xp' | 'shield' | 'stamina'",
        defaultValue: "'hp'",
        description: 'Semantic resource bar styling with animated delayed damage trail.',
      },
      {
        name: 'choices (DialogueBox)',
        type: 'readonly { id: string; label: string; hint?: string }[]',
        defaultValue: 'undefined',
        description: 'Branching dialogue choices selectable via click or numeric/keyboard focus.',
      },
      {
        name: 'cooldownProgress (ActionHotbar)',
        type: 'number',
        defaultValue: '0',
        description: 'Displays cooldown overlay (0..1) and hotkey badge on skill slots.',
      },
      {
        name: 'count (ComboCounter)',
        type: 'number',
        defaultValue: 'required',
        description: 'Auto-resolves style rank tiers (C → B → A → S → SS → SSS) with decay bar.',
      },
    ],
    tokens: ['--mw-error', '--mw-info', '--mw-success', '--mw-warning', '--mw-magenta'],
  },
  {
    id: 'cartoon-studio-kit',
    name: 'CartoonRig & StoryboardPlayer',
    category: 'Cartoon',
    importSnippet:
      "import { CartoonRig, OnomatopoeiaSFX, SmearFrame, ImpactFlash, StoryboardPlayer, useLipSync } from '@moonwitness/ui/cartoon';",
    summary:
      '2D cartoon puppet rig with mood/phoneme lip sync, squash-stretch triggers, comic SFX callouts, smear frames, and beat-by-beat storyboard playback.',
    props: [
      {
        name: 'mood (CartoonRig)',
        type: "'neutral' | 'happy' | 'surprised' | 'determined'",
        defaultValue: "'neutral'",
        description: 'Updates expressive brow and eye geometry.',
      },
      {
        name: 'phoneme (CartoonRig)',
        type: "'closed' | 'small' | 'wide' | 'o-shape'",
        defaultValue: "'closed'",
        description: 'Pairs with useLipSync() to animate speech mouth shapes.',
      },
      {
        name: 'breathing / bounceWalk (CartoonRig)',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Drives idle squash-stretch breathing or bounce walk loop.',
      },
      {
        name: 'beats (StoryboardPlayer)',
        type: 'readonly StoryboardBeat[]',
        defaultValue: 'required',
        description: 'Scene timeline with camera zoom/pan, SFX callouts, and 0.5x–2x scrubbing.',
      },
    ],
    tokens: ['--mw-yellow', '--mw-cyan', '--mw-shadow-comic', '--mw-font-display'],
  },
  {
    id: 'starter-templates',
    name: 'Starter Templates',
    category: 'Templates',
    importSnippet:
      "import { WebLandingTemplate, AppCommandTemplate, GameBattleTemplate, CartoonStudioTemplate } from '@moonwitness/ui/templates';",
    summary:
      'Drop-in animated starter compositions for marketing landing pages, SaaS command shells, RPG battle HUDs, and 2D cartoon cutscene studios.',
    props: [
      {
        name: 'WebLandingTemplate',
        type: '() => JSX.Element',
        defaultValue: 'zero-config',
        description: 'Kinetic hero, animated KPI counters, marquee ribbon, scroll-reveal bento, and morph CTA.',
      },
      {
        name: 'AppCommandTemplate',
        type: '() => JSX.Element',
        defaultValue: 'zero-config',
        description: 'Master-detail interactive workspace with animated inspector presence and screen transitions.',
      },
      {
        name: 'GameBattleTemplate',
        type: '() => JSX.Element',
        defaultValue: 'zero-config',
        description: 'Full interactive battle arena with floating damage numbers, combo rank, radial wheel, and pause overlay.',
      },
      {
        name: 'CartoonStudioTemplate',
        type: '() => JSX.Element',
        defaultValue: 'zero-config',
        description: 'Interactive 4-beat animated cartoon short with live scrubber, lip-sync puppet, and impact flashes.',
      },
    ],
    tokens: ['--mw-background', '--mw-surface', '--mw-primary', '--mw-border-strong'],
  },
  {
    id: 'character-registry',
    name: 'CHARACTER_REGISTRY (30)',
    category: 'Cartoon',
    importSnippet:
      "import { CHARACTER_REGISTRY, CHARACTER_FACTIONS, getCharacterById, filterCharacters, rollGachaCharacter } from '@moonwitness/ui';",
    summary:
      'Centralized 30-character roster across 6 factions (25 playable heroes + 5 Eclipse raid bosses) with procedural cel-shaded visual DNA, RPG stats, JP/EN ultimate skills, and signature voicePitch.',
    props: [
      {
        name: 'CHARACTER_REGISTRY',
        type: 'readonly CharacterProfile[]',
        defaultValue: '30 characters',
        description: 'Frozen master list across Signal Riot, Neon Arcade, Arcana Blade, Mecha Orbit, Toon Squad, and Eclipse Bosses.',
      },
      {
        name: 'filterCharacters(options)',
        type: '(filter: { faction?, element?, role?, rarity?, isBoss?, query? }) => CharacterProfile[]',
        defaultValue: 'helper',
        description: 'Filters the 30-character roster by faction, element, role, rarity, boss flag, or free-text query.',
      },
      {
        name: 'rollGachaCharacter(seed?)',
        type: '(seed?: number) => CharacterProfile',
        defaultValue: 'weighted roll',
        description: 'Deterministic rarity-weighted summon roll for LootRevealCard and boss victory drops.',
      },
    ],
    tokens: ['--mw-magenta', '--mw-cyan', '--mw-yellow', '--mw-primary'],
  },
  {
    id: 'dna-icon-presets',
    name: 'DnaIcon & GENRE_DNA_PRESETS',
    category: 'Theme',
    importSnippet:
      "import { DnaIcon, GENRE_DNA_PRESETS, applyGenreDnaAttribute } from '@moonwitness/ui';\nimport { KatanaIcon } from '@moonwitness/ui/icons';",
    summary:
      'Stylizes any of the 120 typed SVG icons in wireframe, cel-ink halftone, duotone, or manga sticker treatments, paired with 5 atomic Genre DNA Presets.',
    props: [
      {
        name: 'treatment (DnaIcon)',
        type: "'wireframe' | 'cel-ink' | 'duotone' | 'sticker'",
        defaultValue: "'cel-ink'",
        description: 'Applies MoonWitness cel-shaded outline, halftone backing, duotone tint, or die-cut sticker styling.',
      },
      {
        name: 'tone (DnaIcon)',
        type: "'primary' | 'magenta' | 'cyan' | 'violet' | 'success' | 'warning' | 'error' | 'neutral'",
        defaultValue: "'primary'",
        description: 'Selects semantic accent palette mapped strictly to CSS variables.',
      },
      {
        name: 'GENRE_DNA_PRESETS',
        type: 'readonly GenreDnaPreset[]',
        defaultValue: '5 presets',
        description: 'Atomic theme bundles (Signal Riot Zine, Shonen Anime, Arcade Fighter, Cozy JRPG, Saturday Cartoon).',
      },
    ],
    tokens: ['--mw-dna-ink-width', '--mw-dna-shadow-offset', '--mw-dna-skew', '--mw-dna-halftone-opacity'],
  },
  {
    id: 'anime-stage-suite',
    name: 'AnimeCutIn & VisualNovelStage',
    category: 'Cartoon',
    importSnippet:
      "import { AnimeCutIn, AnimeEmoteBubble, VisualNovelStage, EpisodeTitleCard } from '@moonwitness/ui/cartoon';",
    summary:
      'Full anime cutscene kit: diagonal slash Ultimate Cut-In banners with JP/EN callouts, floating manga emote bubbles, 3-slot Visual Novel dialogue stage, and episodic title cards.',
    props: [
      {
        name: 'characterId (AnimeCutIn)',
        type: 'string',
        defaultValue: "'kuro-signal'",
        description: 'Auto-hydrates cel-shaded portrait, JP callout, ultimate skill title, and voicePitch SFX.',
      },
      {
        name: 'kind (AnimeEmoteBubble)',
        type: "'sweatdrop' | 'anger' | 'shock' | 'sparkle' | 'question' | 'exclaim'",
        defaultValue: 'required',
        description: 'Renders classic manga/anime reaction glyphs anchored above rigs or portraits.',
      },
      {
        name: 'castIds / lines (VisualNovelStage)',
        type: 'readonly string[] / readonly VisualNovelLine[]',
        defaultValue: 'required',
        description: '3-position left/center/right character stage with active-speaker focus and branching choices.',
      },
    ],
    tokens: ['--mw-dna-speedline-opacity', '--mw-magenta', '--mw-yellow', '--mw-shadow-comic'],
  },
  {
    id: 'game-hud-expansion',
    name: 'BossHealthBar, TurnOrder & SkillTree',
    category: 'Game',
    importSnippet:
      "import { BossHealthBar, TurnOrderStrip, LootRevealCard, AchievementToast, TacticalRadar, SkillTreeGraph } from '@moonwitness/ui/game';",
    summary:
      'RPG & Arcade HUD expansion: multi-phase boss health bars with stagger break, ATB turn order timeline, gacha loot reveal cards, trophy toasts, tactical radar minimap, and SVG skill trees.',
    props: [
      {
        name: 'phases / stagger (BossHealthBar)',
        type: 'number / number (0..100)',
        defaultValue: '3 / 0',
        description: 'Renders segmented phase pips, delayed damage trail, and BREAK state banner at 100% stagger.',
      },
      {
        name: 'entries (TurnOrderStrip)',
        type: 'readonly TurnOrderEntry[]',
        defaultValue: 'required',
        description: 'Displays upcoming ally/enemy turn cards with miniature cel-shaded portraits and AV countdown.',
      },
      {
        name: 'nodes / onUnlockNode (SkillTreeGraph)',
        type: 'readonly SkillTreeNode[] / (node) => void',
        defaultValue: 'required',
        description: 'Interactive SVG-connected talent graph with locked, available, and unlocked states.',
      },
    ],
    tokens: ['--mw-error', '--mw-warning', '--mw-cyan', '--mw-success'],
  },
];

export function ComponentApiTable() {
  const [selectedId, setSelectedId] = useState<string>(COMPONENT_API_SPECS[0].id);
  const [query, setQuery] = useState('');

  const filteredSpecs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPONENT_API_SPECS;
    return COMPONENT_API_SPECS.filter(
      (spec) =>
        spec.name.toLowerCase().includes(q) ||
        spec.category.toLowerCase().includes(q) ||
        spec.props.some(
          (prop) =>
            prop.name.toLowerCase().includes(q) || prop.description.toLowerCase().includes(q)
        ) ||
        spec.tokens.some((token) => token.toLowerCase().includes(q))
    );
  }, [query]);

  const activeSpec =
    filteredSpecs.find((spec) => spec.id === selectedId) ?? filteredSpecs[0] ?? null;

  return (
    <div className="catalog-api-ref" data-testid="component-api-reference">
      <div className="catalog-api-toolbar">
        <div className="catalog-api-tabs" role="group" aria-label="Component API selector">
          {filteredSpecs.map((spec) => {
            const active = activeSpec?.id === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                className="catalog-playground-tab"
                data-active={active ? 'true' : 'false'}
                aria-pressed={active}
                onClick={() => setSelectedId(spec.id)}
              >
                {spec.name}
              </button>
            );
          })}
        </div>
        <div className="catalog-api-search">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter component, prop, or CSS token..."
            aria-label="Filter component API reference"
          />
        </div>
      </div>

      {activeSpec ? (
        <div className="catalog-api-card">
          <div className="catalog-api-header">
            <div>
              <div className="catalog-api-title-row">
                <h4 className="catalog-api-name">{activeSpec.name}</h4>
                <Badge size="sm" variant="primary">
                  {activeSpec.category}
                </Badge>
              </div>
              <p className="catalog-api-summary">{activeSpec.summary}</p>
            </div>
            <CopyButton value={activeSpec.importSnippet} label="Copy API import" />
          </div>

          <pre className="catalog-api-import">
            <code>{activeSpec.importSnippet}</code>
          </pre>

          <div className="catalog-api-table-wrap">
            <table className="catalog-api-table">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {activeSpec.props.map((prop) => (
                  <tr key={prop.name}>
                    <td>
                      <code>{prop.name}</code>
                    </td>
                    <td>
                      <code>{prop.type}</code>
                    </td>
                    <td>
                      <code>{prop.defaultValue}</code>
                    </td>
                    <td>{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="catalog-api-tokens" aria-label="Related CSS design tokens">
            <span className="catalog-api-tokens-label">CSS tokens:</span>
            {activeSpec.tokens.map((token) => (
              <code key={token} className="catalog-api-token-chip">
                {token}
              </code>
            ))}
          </div>
        </div>
      ) : (
        <p className="catalog-api-empty">No matching component API entries for &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
