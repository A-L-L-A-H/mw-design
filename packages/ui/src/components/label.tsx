'use client';

import * as React from 'react';
import { cn } from '../lib/cn.js';
import { Label as LabelPrimitive } from 'radix-ui';

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        className={cn('mw-ui-label', className)}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label };
