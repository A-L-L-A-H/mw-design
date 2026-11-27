'use client';

import * as React from 'react';
import { cn } from '../lib/cn.js';
import { Popover as PopoverPrimitive } from 'radix-ui';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(function PopoverTrigger(props, ref) {
  return <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" {...props} />;
});
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = 'center', sideOffset = 4, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn('mw-ui-popover-content', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>(function PopoverAnchor(props, ref) {
  return <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />;
});
PopoverAnchor.displayName = 'PopoverAnchor';

const PopoverHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="popover-header"
        className={cn('mw-ui-popover-header', className)}
        {...props}
      />
    );
  }
);
PopoverHeader.displayName = 'PopoverHeader';

const PopoverTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h2'>>(
  function PopoverTitle({ className, ...props }, ref) {
    return (
      <h2
        ref={ref}
        data-slot="popover-title"
        className={cn('mw-ui-popover-title', className)}
        {...props}
      />
    );
  }
);
PopoverTitle.displayName = 'PopoverTitle';

const PopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(function PopoverDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="popover-description"
      className={cn('mw-ui-popover-description', className)}
      {...props}
    />
  );
});
PopoverDescription.displayName = 'PopoverDescription';

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
};
