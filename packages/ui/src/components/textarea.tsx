import * as React from 'react';
import { cn } from '../lib/cn.js';

export type TextareaProps = React.ComponentProps<'textarea'>;

/** Ink-bordered textarea; styled consistently with Input via .mw-ui-textarea. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn('mw-ui-textarea', className)}
      {...props}
    />
  );
});
