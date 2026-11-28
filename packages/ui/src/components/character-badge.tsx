'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import {
  CHARACTER_FACTIONS,
  ROCKSOUL_LORE_FACTIONS,
  getCharacterById,
  type CharacterColorToken,
  type LoreCharacterProfile,
} from '../lib/character-registry.js';
import { cn } from '../lib/cn.js';

export type CharacterBadgeSize = 'sm' | 'md';

export type CharacterBadgeProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  /** Registry id of a playable, boss, or lore character. Unknown ids render nothing. */
  characterId: string;
  size?: CharacterBadgeSize;
  /** Show the faction or lore-group label after the name. */
  showGroup?: boolean;
};

const isLoreProfile = (profile: object): profile is LoreCharacterProfile => 'loreGroup' in profile;

function resolveGroup(profile: ReturnType<typeof getCharacterById>): { label: string; tone: CharacterColorToken } | null {
  if (!profile) return null;
  const meta = isLoreProfile(profile)
    ? ROCKSOUL_LORE_FACTIONS.find((faction) => faction.id === profile.loreGroup)
    : CHARACTER_FACTIONS.find((faction) => faction.id === profile.faction);
  return meta ? { label: meta.label, tone: meta.tone } : null;
}

/** Compact name tag for a registry character; lore characters also expose their canon level. */
export const CharacterBadge = forwardRef<HTMLSpanElement, CharacterBadgeProps>(function CharacterBadge(
  { characterId, size = 'md', showGroup = true, className, ...props },
  ref
) {
  const profile = getCharacterById(characterId);
  if (!profile) return null;
  const group = resolveGroup(profile);
  const lore = isLoreProfile(profile);
  const name = lore ? profile.displayName : profile.name;
  return (
    <span
      ref={ref}
      className={cn('mw-ui-character-badge', className)}
      data-character={profile.id}
      data-size={size}
      data-tone={group?.tone ?? 'ink'}
      data-rarity={profile.rarity}
      data-canon={lore ? profile.canonLevel : undefined}
      {...props}
    >
      <span className="mw-ui-character-badge-name">{name}</span>
      <span className="mw-ui-character-badge-codename">{profile.codename}</span>
      {showGroup && group ? <span className="mw-ui-character-badge-group">{group.label}</span> : null}
    </span>
  );
});
