import { useMemo, useState, type ComponentType } from 'react';
import {
  Badge,
  Button,
  CHARACTER_FACTIONS,
  CHARACTER_REGISTRY,
  CopyButton,
  DnaIcon,
  Input,
  filterCharacters,
  getCharacterById,
  rollGachaCharacter,
  type CharacterElement,
  type CharacterFactionId,
  type CharacterRarity,
  type DnaIconTone,
  type DnaIconTreatment,
} from '@moonwitness/ui';
import {
  AnimeCutIn,
  CartoonRig,
  type AnimeEmoteKind,
  type CartoonRigMood,
} from '@moonwitness/ui/cartoon';
import {
  LootRevealCard,
  SkillTreeGraph,
  type SkillTreeNode,
} from '@moonwitness/ui/game';
import {
  ActivityIcon,
  AddIcon,
  AnimeAngerIcon,
  AnimeShockIcon,
  AnimeSparkleIcon,
  AnimeSweatdropIcon,
  BoltIcon,
  BossSkullIcon,
  ClapperboardIcon,
  ComboFlameIcon,
  CriticalStarIcon,
  DpadIcon,
  ElementFireIcon,
  ElementIceIcon,
  ElementSolarIcon,
  ElementVoidIcon,
  ElementVoltIcon,
  ElementWindIcon,
  GachaTicketIcon,
  GamepadIcon,
  HeartHpIcon,
  ImpactSlashIcon,
  KatanaIcon,
  KeyframeDiamondIcon,
  LootChestIcon,
  ManaCrystalIcon,
  MechaHelmIcon,
  MoonIcon,
  NotificationIcon,
  PotionFlaskIcon,
  QuestScrollIcon,
  RadarPingIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCrestIcon,
  ShurikenIcon,
  SignalIcon,
  SkillNodeIcon,
  SparkleIcon,
  SpeechBurstIcon,
  TrophyCrownIcon,
  VolumeIcon,
} from '@moonwitness/ui/icons';
import { playProceduralSfx } from '@moonwitness/ui/motion';

type IconCategory = 'all' | 'anime' | 'game' | 'elements' | 'core';

type CatalogIconEntry = {
  readonly id: string;
  readonly exportName: string;
  readonly label: string;
  readonly category: Exclude<IconCategory, 'all'>;
  readonly Component: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
};

const STUDIO_ICONS: readonly CatalogIconEntry[] = [
  // Anime & Cartoon FX
  { id: 'anime-sweatdrop', exportName: 'AnimeSweatdropIcon', label: 'Sweatdrop', category: 'anime', Component: AnimeSweatdropIcon },
  { id: 'anime-anger', exportName: 'AnimeAngerIcon', label: 'Anger Vein', category: 'anime', Component: AnimeAngerIcon },
  { id: 'anime-shock', exportName: 'AnimeShockIcon', label: 'Shock Lines', category: 'anime', Component: AnimeShockIcon },
  { id: 'anime-sparkle', exportName: 'AnimeSparkleIcon', label: 'Anime Sparkle', category: 'anime', Component: AnimeSparkleIcon },
  { id: 'speech-burst', exportName: 'SpeechBurstIcon', label: 'Speech Burst', category: 'anime', Component: SpeechBurstIcon },
  { id: 'impact-slash', exportName: 'ImpactSlashIcon', label: 'Impact Slash', category: 'anime', Component: ImpactSlashIcon },
  { id: 'clapperboard', exportName: 'ClapperboardIcon', label: 'Clapperboard', category: 'anime', Component: ClapperboardIcon },
  { id: 'keyframe-diamond', exportName: 'KeyframeDiamondIcon', label: 'Keyframe', category: 'anime', Component: KeyframeDiamondIcon },
  { id: 'mecha-helm', exportName: 'MechaHelmIcon', label: 'Mecha Helm', category: 'anime', Component: MechaHelmIcon },
  // Game & RPG
  { id: 'katana', exportName: 'KatanaIcon', label: 'Katana', category: 'game', Component: KatanaIcon },
  { id: 'shuriken', exportName: 'ShurikenIcon', label: 'Shuriken', category: 'game', Component: ShurikenIcon },
  { id: 'shield-crest', exportName: 'ShieldCrestIcon', label: 'Shield Crest', category: 'game', Component: ShieldCrestIcon },
  { id: 'heart-hp', exportName: 'HeartHpIcon', label: 'Heart HP', category: 'game', Component: HeartHpIcon },
  { id: 'mana-crystal', exportName: 'ManaCrystalIcon', label: 'Mana Crystal', category: 'game', Component: ManaCrystalIcon },
  { id: 'boss-skull', exportName: 'BossSkullIcon', label: 'Boss Skull', category: 'game', Component: BossSkullIcon },
  { id: 'potion-flask', exportName: 'PotionFlaskIcon', label: 'Potion Flask', category: 'game', Component: PotionFlaskIcon },
  { id: 'loot-chest', exportName: 'LootChestIcon', label: 'Loot Chest', category: 'game', Component: LootChestIcon },
  { id: 'trophy-crown', exportName: 'TrophyCrownIcon', label: 'Trophy Crown', category: 'game', Component: TrophyCrownIcon },
  { id: 'quest-scroll', exportName: 'QuestScrollIcon', label: 'Quest Scroll', category: 'game', Component: QuestScrollIcon },
  { id: 'combo-flame', exportName: 'ComboFlameIcon', label: 'Combo Flame', category: 'game', Component: ComboFlameIcon },
  { id: 'critical-star', exportName: 'CriticalStarIcon', label: 'Critical Star', category: 'game', Component: CriticalStarIcon },
  { id: 'gamepad', exportName: 'GamepadIcon', label: 'Gamepad', category: 'game', Component: GamepadIcon },
  { id: 'dpad', exportName: 'DpadIcon', label: 'D-Pad', category: 'game', Component: DpadIcon },
  { id: 'radar-ping', exportName: 'RadarPingIcon', label: 'Radar Ping', category: 'game', Component: RadarPingIcon },
  { id: 'gacha-ticket', exportName: 'GachaTicketIcon', label: 'Gacha Ticket', category: 'game', Component: GachaTicketIcon },
  { id: 'skill-node', exportName: 'SkillNodeIcon', label: 'Skill Node', category: 'game', Component: SkillNodeIcon },
  // Elements
  { id: 'element-fire', exportName: 'ElementFireIcon', label: 'Fire', category: 'elements', Component: ElementFireIcon },
  { id: 'element-ice', exportName: 'ElementIceIcon', label: 'Ice', category: 'elements', Component: ElementIceIcon },
  { id: 'element-volt', exportName: 'ElementVoltIcon', label: 'Volt', category: 'elements', Component: ElementVoltIcon },
  { id: 'element-void', exportName: 'ElementVoidIcon', label: 'Void', category: 'elements', Component: ElementVoidIcon },
  { id: 'element-wind', exportName: 'ElementWindIcon', label: 'Wind', category: 'elements', Component: ElementWindIcon },
  { id: 'element-solar', exportName: 'ElementSolarIcon', label: 'Solar', category: 'elements', Component: ElementSolarIcon },
  // Core UI sample (part of full 120-icon pack)
  { id: 'signal', exportName: 'SignalIcon', label: 'Signal', category: 'core', Component: SignalIcon },
  { id: 'moon', exportName: 'MoonIcon', label: 'Moon', category: 'core', Component: MoonIcon },
  { id: 'bolt', exportName: 'BoltIcon', label: 'Bolt', category: 'core', Component: BoltIcon },
  { id: 'sparkle', exportName: 'SparkleIcon', label: 'Sparkle', category: 'core', Component: SparkleIcon },
  { id: 'activity', exportName: 'ActivityIcon', label: 'Activity', category: 'core', Component: ActivityIcon },
  { id: 'add', exportName: 'AddIcon', label: 'Add', category: 'core', Component: AddIcon },
  { id: 'search', exportName: 'SearchIcon', label: 'Search', category: 'core', Component: SearchIcon },
  { id: 'settings', exportName: 'SettingsIcon', label: 'Settings', category: 'core', Component: SettingsIcon },
  { id: 'notification', exportName: 'NotificationIcon', label: 'Notification', category: 'core', Component: NotificationIcon },
  { id: 'volume', exportName: 'VolumeIcon', label: 'Volume', category: 'core', Component: VolumeIcon },
];

const DNA_TREATMENTS: readonly DnaIconTreatment[] = ['wireframe', 'cel-ink', 'duotone', 'sticker'];
const DNA_TONES: readonly DnaIconTone[] = ['primary', 'magenta', 'cyan', 'violet', 'success', 'warning', 'error', 'neutral'];
const MOODS: readonly CartoonRigMood[] = ['neutral', 'happy', 'surprised', 'determined', 'angry', 'ko'];
const EMOTES: readonly (AnimeEmoteKind | 'none')[] = [
  'none',
  'sparkle',
  'sweatdrop',
  'anger',
  'shock',
  'question',
  'exclaim',
];
const ELEMENTS: readonly ('all' | CharacterElement)[] = [
  'all',
  'solar',
  'volt',
  'cryo',
  'pyro',
  'void',
  'ink',
  'wind',
];
const RARITIES: readonly ('all' | CharacterRarity)[] = [
  'all',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

const INITIAL_SKILL_NODES: readonly SkillTreeNode[] = [
  {
    id: 'core-sync',
    label: 'Signal Core',
    summary: 'Unlocks cel-shaded overdrive aura and +15% combo meter gain.',
    cost: 1,
    x: 50,
    y: 16,
    state: 'unlocked',
  },
  {
    id: 'slash-chain',
    label: 'Blade Chain',
    summary: 'Extends melee hotkeys into 3-hit smear frames with hitstop.',
    cost: 1,
    x: 24,
    y: 48,
    requires: ['core-sync'],
    state: 'available',
  },
  {
    id: 'volt-dash',
    label: 'Volt Step',
    summary: 'Grants dodge cancel and chromatic speedline burst on dash.',
    cost: 1,
    x: 76,
    y: 48,
    requires: ['core-sync'],
    state: 'available',
  },
  {
    id: 'eclipse-cutin',
    label: 'Anime Cut-In',
    summary: 'Unlocks full-bleed JP/EN Ultimate Finisher with 3x stagger break.',
    cost: 2,
    x: 50,
    y: 82,
    requires: ['slash-chain', 'volt-dash'],
    state: 'locked',
  },
];

export function DnaRosterAndIconsStudio({ sfxEnabled }: { sfxEnabled: boolean }) {
  // 30-Character Roster Studio state
  const [factionFilter, setFactionFilter] = useState<'all' | CharacterFactionId>('all');
  const [elementFilter, setElementFilter] = useState<'all' | CharacterElement>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | CharacterRarity>('all');
  const [rosterQuery, setRosterQuery] = useState('');
  const [selectedCharId, setSelectedCharId] = useState(CHARACTER_REGISTRY[0]!.id);
  const [rigMood, setRigMood] = useState<CartoonRigMood>('determined');
  const [rigEmote, setRigEmote] = useState<AnimeEmoteKind | 'none'>('sparkle');
  const [cutInOpen, setCutInOpen] = useState(false);
  const [gachaCharId, setGachaCharId] = useState<string>(CHARACTER_REGISTRY[4]!.id);
  const [gachaRevealed, setGachaRevealed] = useState(true);
  const [gachaSeed, setGachaSeed] = useState(1);

  // 120-Icon Browser state
  const [iconCategory, setIconCategory] = useState<IconCategory>('all');
  const [iconTreatment, setIconTreatment] = useState<DnaIconTreatment>('cel-ink');
  const [iconTone, setIconTone] = useState<DnaIconTone>('magenta');
  const [selectedIcon, setSelectedIcon] = useState<CatalogIconEntry>(STUDIO_ICONS[0]!);

  // Interactive Skill Tree state
  const [skillPoints, setSkillPoints] = useState(4);
  const [unlockedIds, setUnlockedIds] = useState<readonly string[]>(['core-sync']);

  const filteredCharacters = useMemo(
    () =>
      filterCharacters({
        faction: factionFilter === 'all' ? undefined : factionFilter,
        element: elementFilter === 'all' ? undefined : elementFilter,
        rarity: rarityFilter === 'all' ? undefined : rarityFilter,
        query: rosterQuery,
      }),
    [factionFilter, elementFilter, rarityFilter, rosterQuery]
  );

  const activeCharacter =
    getCharacterById(selectedCharId) ?? filteredCharacters[0] ?? CHARACTER_REGISTRY[0]!;

  const visibleIcons = useMemo(
    () =>
      iconCategory === 'all'
        ? STUDIO_ICONS
        : STUDIO_ICONS.filter((entry) => entry.category === iconCategory),
    [iconCategory]
  );

  const computedSkillNodes: readonly SkillTreeNode[] = useMemo(
    () =>
      INITIAL_SKILL_NODES.map((node) => {
        if (unlockedIds.includes(node.id)) return { ...node, state: 'unlocked' as const };
        const prereqsMet = (node.requires ?? []).every((req) => unlockedIds.includes(req));
        return {
          ...node,
          state: prereqsMet ? ('available' as const) : ('locked' as const),
        };
      }),
    [unlockedIds]
  );

  const handleUnlockSkill = (node: SkillTreeNode) => {
    if (node.state !== 'available' || skillPoints < node.cost) return;
    setSkillPoints((sp) => sp - node.cost);
    setUnlockedIds((prev) => [...prev, node.id]);
    if (sfxEnabled) playProceduralSfx('level-up', true, true);
  };

  const handleSummonGacha = () => {
    const nextSeed = gachaSeed + 7;
    setGachaSeed(nextSeed);
    const rolled = rollGachaCharacter(nextSeed * 1337 + Date.now());
    setGachaCharId(rolled.id);
    setGachaRevealed(false);
    if (sfxEnabled) playProceduralSfx('gacha-fanfare', true, true);
  };

  return (
    <div className="catalog-dna-suite-stack">
      {/* 1. 30-Character Centralized Roster Studio */}
      <section className="catalog-roster-studio" data-testid="character-roster-studio">
        <div className="catalog-curve-lab-head">
          <div>
            <div className="catalog-studio-title-row">
              <h4 className="catalog-curve-lab-title">30-Character Anime &amp; Game Roster Registry</h4>
              <Badge variant="primary" size="sm">
                {filteredCharacters.length} / {CHARACTER_REGISTRY.length} Characters · 6 Factions
              </Badge>
            </div>
            <p className="catalog-curve-lab-copy">
              Every hero and raid boss shares one centralized registry with procedural cel-shaded
              SVG DNA, RPG stats, JP/EN ultimate cut-ins, and signature WebAudio voice pitch.
            </p>
          </div>
          <CopyButton
            value={`<CartoonRig characterId="${activeCharacter.id}" mood="${rigMood}"${rigEmote !== 'none' ? ` emote="${rigEmote}"` : ''} />`}
            label="Copy Rig JSX"
          />
        </div>

        <div className="catalog-roster-filters">
          <div className="catalog-studio-group" role="group" aria-label="Filter characters by faction">
            <button
              type="button"
              className="catalog-playground-option"
              data-active={factionFilter === 'all' ? 'true' : 'false'}
              aria-pressed={factionFilter === 'all'}
              onClick={() => setFactionFilter('all')}
            >
              All Factions (30)
            </button>
            {CHARACTER_FACTIONS.map((faction) => (
              <button
                key={faction.id}
                type="button"
                className="catalog-playground-option"
                data-active={factionFilter === faction.id ? 'true' : 'false'}
                aria-pressed={factionFilter === faction.id}
                onClick={() => setFactionFilter(faction.id)}
              >
                {faction.label}
              </button>
            ))}
          </div>

          <div className="catalog-roster-subfilters">
            <div className="catalog-studio-group" role="group" aria-label="Filter characters by element">
              {ELEMENTS.map((el) => (
                <button
                  key={el}
                  type="button"
                  className="catalog-playground-option"
                  data-active={elementFilter === el ? 'true' : 'false'}
                  aria-pressed={elementFilter === el}
                  onClick={() => setElementFilter(el)}
                >
                  {el}
                </button>
              ))}
            </div>
            <div className="catalog-studio-group" role="group" aria-label="Filter characters by rarity">
              {RARITIES.map((rarity) => (
                <button
                  key={rarity}
                  type="button"
                  className="catalog-playground-option"
                  data-active={rarityFilter === rarity ? 'true' : 'false'}
                  aria-pressed={rarityFilter === rarity}
                  onClick={() => setRarityFilter(rarity)}
                >
                  {rarity}
                </button>
              ))}
            </div>
            <div className="catalog-roster-search">
              <Input
                type="search"
                value={rosterQuery}
                onChange={(e) => setRosterQuery(e.target.value)}
                placeholder="Search name, codename, or skill..."
                aria-label="Search 30-character roster"
              />
            </div>
          </div>
        </div>

        <div className="catalog-roster-layout">
          <div className="catalog-roster-grid" role="list" aria-label="Character roster cards">
            {filteredCharacters.map((char) => {
              const isSelected = char.id === activeCharacter.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  role="listitem"
                  className="catalog-roster-card"
                  data-selected={isSelected ? 'true' : 'false'}
                  data-rarity={char.rarity}
                  onClick={() => {
                    setSelectedCharId(char.id);
                    if (sfxEnabled) playProceduralSfx('click-soft', true, true, char.voicePitch);
                  }}
                >
                  <CartoonRig
                    characterId={char.id}
                    mood={isSelected ? rigMood : 'neutral'}
                    breathing={false}
                    size="sm"
                  />
                  <div className="catalog-roster-card-meta">
                    <span className="catalog-roster-card-code">{char.codename}</span>
                    <strong>{char.name}</strong>
                    <small>
                      {char.archetype} · {char.element}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="catalog-roster-inspector" data-testid="character-roster-inspector">
            <div className="catalog-roster-inspector-stage">
              <CartoonRig
                characterId={activeCharacter.id}
                mood={rigMood}
                emote={rigEmote === 'none' ? undefined : rigEmote}
                size="lg"
              />
              <div className="catalog-roster-inspector-title">
                <Badge size="sm" variant={activeCharacter.isBoss ? 'destructive' : 'magenta'}>
                  {activeCharacter.codename} · {activeCharacter.rarity.toUpperCase()}
                </Badge>
                <h5>{activeCharacter.name}</h5>
                <p>
                  {activeCharacter.title} · {activeCharacter.archetype} ({activeCharacter.element})
                </p>
              </div>
            </div>

            <div className="catalog-roster-stats">
              <span>HP {activeCharacter.stats.hp}</span>
              <span>ATK {activeCharacter.stats.atk}</span>
              <span>DEF {activeCharacter.stats.def}</span>
              <span>SPD {activeCharacter.stats.spd}</span>
            </div>

            <div className="catalog-roster-ultimate">
              <small>{activeCharacter.ultimate.jpCallout}</small>
              <strong>{activeCharacter.ultimate.name}</strong>
              <p>&ldquo;{activeCharacter.ultimate.quote}&rdquo;</p>
            </div>

            <div className="catalog-studio-group" role="group" aria-label="Character mood selector">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="catalog-playground-option"
                  data-active={rigMood === m ? 'true' : 'false'}
                  aria-pressed={rigMood === m}
                  onClick={() => setRigMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="catalog-studio-group" role="group" aria-label="Anime emote overlay selector">
              {EMOTES.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="catalog-playground-option"
                  data-active={rigEmote === em ? 'true' : 'false'}
                  aria-pressed={rigEmote === em}
                  onClick={() => setRigEmote(em)}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="catalog-roster-actions">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setCutInOpen(true);
                  if (sfxEnabled) {
                    playProceduralSfx('cut-in-slash', true, true, activeCharacter.voicePitch);
                  }
                }}
              >
                Trigger Cut-In
              </Button>
              <Button size="sm" variant="outline" onClick={handleSummonGacha}>
                Summon Gacha Pull
              </Button>
            </div>

            <AnimeCutIn
              active={cutInOpen}
              characterId={activeCharacter.id}
              onDismiss={() => setCutInOpen(false)}
            />

            <LootRevealCard
              characterId={gachaCharId}
              revealed={gachaRevealed}
              onRevealChange={setGachaRevealed}
            />
          </div>
        </div>
      </section>

      {/* 2. 120-Icon Anime, Game & UI DnaIcon Studio */}
      <section className="catalog-roster-studio" data-testid="dna-icon-studio">
        <div className="catalog-curve-lab-head">
          <div>
            <div className="catalog-studio-title-row">
              <h4 className="catalog-curve-lab-title">120-Icon DNA Pack (Anime · RPG · Elements)</h4>
              <Badge variant="cyan" size="sm">
                32 New Custom Icons · 4 DNA Treatments
              </Badge>
            </div>
            <p className="catalog-curve-lab-copy">
              Wrap any of the 120 typed SVG icons in <code>DnaIcon</code> for instant Cel-Ink
              halftone badges, Manga Stickers, or Duotone Game crests.
            </p>
          </div>
          <CopyButton
            value={`import { DnaIcon } from '@moonwitness/ui';\nimport { ${selectedIcon.exportName} } from '@moonwitness/ui/icons';\n\n<DnaIcon treatment="${iconTreatment}" tone="${iconTone}">\n  <${selectedIcon.exportName} size={22} />\n</DnaIcon>`}
            label={`Copy ${selectedIcon.exportName}`}
          />
        </div>

        <div className="catalog-studio-secondary-controls">
          <div className="catalog-studio-group" role="group" aria-label="Icon pack category">
            {(['anime', 'game', 'elements', 'core', 'all'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className="catalog-playground-option"
                data-active={iconCategory === cat ? 'true' : 'false'}
                aria-pressed={iconCategory === cat}
                onClick={() => setIconCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="catalog-studio-group" role="group" aria-label="DnaIcon visual treatment">
            {DNA_TREATMENTS.map((treatment) => (
              <button
                key={treatment}
                type="button"
                className="catalog-playground-option"
                data-active={iconTreatment === treatment ? 'true' : 'false'}
                aria-pressed={iconTreatment === treatment}
                onClick={() => setIconTreatment(treatment)}
              >
                {treatment}
              </button>
            ))}
          </div>

          <div className="catalog-studio-group" role="group" aria-label="DnaIcon accent tone">
            {DNA_TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                className="catalog-playground-option"
                data-active={iconTone === tone ? 'true' : 'false'}
                aria-pressed={iconTone === tone}
                onClick={() => setIconTone(tone)}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-dna-icon-grid" role="list" aria-label="DNA styled icons">
          {visibleIcons.map((entry) => {
            const active = selectedIcon.id === entry.id;
            const IconGlyph = entry.Component;
            return (
              <button
                key={entry.id}
                type="button"
                role="listitem"
                className="catalog-dna-icon-tile"
                data-selected={active ? 'true' : 'false'}
                onClick={() => setSelectedIcon(entry)}
              >
                <DnaIcon treatment={iconTreatment} tone={iconTone} size="lg">
                  <IconGlyph size={22} aria-hidden="true" />
                </DnaIcon>
                <span>{entry.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Interactive RPG Skill Tree Graph */}
      <section className="catalog-roster-studio" data-testid="skill-tree-showcase">
        <div className="catalog-curve-lab-head">
          <div>
            <h4 className="catalog-curve-lab-title">Interactive RPG Skill Tree Graph</h4>
            <p className="catalog-curve-lab-copy">
              Click available skill nodes to spend SP and unlock downstream SVG connector paths.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSkillPoints(4);
              setUnlockedIds(['core-sync']);
            }}
          >
            Reset Skill Tree (4 SP)
          </Button>
        </div>
        <SkillTreeGraph
          title="SIGNAL OVERDRIVE TALENT TREE"
          availablePoints={skillPoints}
          nodes={computedSkillNodes}
          onUnlockNode={handleUnlockSkill}
        />
      </section>
    </div>
  );
}
