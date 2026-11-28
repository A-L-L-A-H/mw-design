'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { resolveUniverseAsset } from '../lib/asset-registry.js';
import { cn } from '../lib/cn.js';

export const RIOT_STICKER_SLUGS = [
  'arrow-bent',
  'arrow-curve-down',
  'arrow-double',
  'arrow-down-left',
  'arrow-loop',
  'arrow-right',
  'arrow-spiral-in',
  'arrow-swoosh',
  'arrow-up',
  'arrow-zigzag',
  'build-it',
  'chaos-medic',
  'clean-diff',
  'doodle-bolt',
  'doodle-cloud',
  'doodle-crown',
  'doodle-eye',
  'doodle-heart',
  'doodle-scribble-underline',
  'doodle-smiley',
  'doodle-sparkles',
  'doodle-spiral',
  'doodle-star',
  'gg-wp',
  'lesgo',
  'merged',
  'no-cap',
  'on-fire',
  'ship-it',
  'signal-locked',
  'trust-me',
  'zero-drift',
] as const;

export type RiotStickerSlug = (typeof RIOT_STICKER_SLUGS)[number];
export type RiotStickerSize = 'sm' | 'md' | 'lg';
export type RiotStickerTilt = 'left' | 'right' | 'flat';

const STICKER_DIR = 'illustrations/stickers-pack';
const STICKER_PIXELS: Record<RiotStickerSize, number> = { sm: 64, md: 112, lg: 176 };

export type RiotStickerProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt' | 'width' | 'height'> & {
  slug: RiotStickerSlug;
  size?: RiotStickerSize;
  tilt?: RiotStickerTilt;
  /** Accessible name. Omit it only with `decorative` to hide the sticker from assistive tech. */
  label?: string;
  decorative?: boolean;
  basePath?: string;
};

const humanize = (slug: string) => slug.replace(/-/gu, ' ');

/** Resolve a stickers-pack PNG for a slug (die-cut paper halo included in the asset). */
export function getRiotStickerSrc(slug: RiotStickerSlug, basePath = ''): string {
  return resolveUniverseAsset(`${STICKER_DIR}/sticker-${slug}.png`, basePath);
}

/** Street-comic die-cut sticker from the stickers-pack; tilt is decorative and never animates. */
export const RiotSticker = forwardRef<HTMLImageElement, RiotStickerProps>(function RiotSticker(
  { slug, size = 'md', tilt = 'flat', label, decorative = false, basePath, className, ...props },
  ref
) {
  const pixels = STICKER_PIXELS[size];
  return (
    <img
      ref={ref}
      className={cn('mw-ui-riot-sticker', className)}
      src={getRiotStickerSrc(slug, basePath)}
      alt={decorative ? '' : (label ?? `${humanize(slug)} sticker`)}
      aria-hidden={decorative ? true : undefined}
      width={pixels}
      height={pixels}
      decoding="async"
      loading="lazy"
      data-sticker={slug}
      data-size={size}
      data-tilt={tilt}
      {...props}
    />
  );
});
