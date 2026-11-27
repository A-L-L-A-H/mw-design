'use client';

import * as React from 'react';
import { Tooltip as Primitive } from 'radix-ui';
import { cn } from '../lib/cn.js';

export function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof Primitive.Provider>) {
  return (
    <Primitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
  );
}

export function Tooltip(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="tooltip" {...props} />;
}

export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function TooltipTrigger(props, ref) {
  return <Primitive.Trigger ref={ref} data-slot="tooltip-trigger" {...props} />;
});
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(function TooltipContent({ className, sideOffset = 4, children, ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={ref}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn('mw-ui-tooltip-content', className)}
        {...props}
      >
        {children}
        <Primitive.Arrow className="mw-ui-tooltip-arrow" />
      </Primitive.Content>
    </Primitive.Portal>
  );
});
TooltipContent.displayName = 'TooltipContent';
