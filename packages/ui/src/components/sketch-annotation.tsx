'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';
import { useReducedMotion } from '../lib/use-reduced-motion.js';

export type SketchAnnotationMark = 'underline' | 'circle' | 'bracket';
export type SketchAnnotationTone = 'yellow' | 'magenta' | 'cyan' | 'violet';

export type SketchAnnotationProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  mark?: SketchAnnotationMark;
  tone?: SketchAnnotationTone;
  /** Handwritten margin note. Rendered as real text, so it stays readable and translatable. */
  note?: ReactNode;
  reducedMotion?: boolean;
  children: ReactNode;
};

const MARK_PATHS: Record<SketchAnnotationMark, string> = {
  underline: 'M2 14 C22 8 40 18 62 11 S88 9 98 13',
  circle: 'M50 3 C80 3 97 14 96 26 C94 40 62 47 38 45 C12 42 3 30 8 17 C14 6 36 2 58 5',
  bracket: 'M10 4 L3 4 L3 46 L10 46 M90 4 L97 4 L97 46 L90 46',
};

/** Hand-drawn pencil mark around inline content; the drawing is decorative and hidden from assistive tech. */
export const SketchAnnotation = forwardRef<HTMLSpanElement, SketchAnnotationProps>(function SketchAnnotation(
  { mark = 'underline', tone = 'yellow', note, reducedMotion, children, className, ...props },
  ref
) {
  const isReducedMotion = useReducedMotion(reducedMotion);
  return (
    <span
      ref={ref}
      className={cn('mw-ui-sketch-annotation', className)}
      data-mark={mark}
      data-tone={tone}
      data-reduced-motion={isReducedMotion ? 'true' : undefined}
      {...props}
    >
      <span className="mw-ui-sketch-annotation-content">{children}</span>
      <svg
        className="mw-ui-sketch-annotation-mark"
        viewBox="0 0 100 50"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={MARK_PATHS[mark]} pathLength={1} />
      </svg>
      {note ? <span className="mw-ui-sketch-annotation-note">{note}</span> : null}
    </span>
  );
});
