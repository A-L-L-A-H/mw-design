'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type DnaIconTreatment = 'wireframe' | 'cel-ink' | 'duotone' | 'sticker';
export type DnaIconTone =
  | 'primary'
  | 'magenta'
  | 'cyan'
  | 'violet'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';
export type DnaIconSize = 'sm' | 'md' | 'lg';
export type DnaIconMotion = 'none' | 'pop' | 'tilt' | 'pulse';

export type DnaIconProps = ComponentPropsWithoutRef<'span'> & {
  treatment?: DnaIconTreatment;
  tone?: DnaIconTone;
  size?: DnaIconSize;
  motion?: DnaIconMotion;
  label?: string;
  children: ReactNode;
};

export const DnaIcon = forwardRef<HTMLSpanElement, DnaIconProps>(function DnaIcon(
  {
    treatment = 'cel-ink',
    tone = 'primary',
    size = 'md',
    motion = 'pop',
    label,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <span
      ref={ref}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-slot="dna-icon"
      data-treatment={treatment}
      data-tone={tone}
      data-size={size}
      data-motion={motion}
      className={cn('mw-ui-dna-icon', className)}
      {...props}
    >
      <span className="mw-ui-dna-icon-glyph">{children}</span>
    </span>
  );
});
DnaIcon.displayName = 'DnaIcon';
