'use client';

import * as React from 'react';
import { Select as Primitive } from 'radix-ui';
import { cn } from '../lib/cn.js';

const check = <span aria-hidden="true">✓</span>;
const down = <span aria-hidden="true">⌄</span>;
const up = <span aria-hidden="true">⌃</span>;

export function Select(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="select" {...props} />;
}

export function SelectGroup(props: React.ComponentProps<typeof Primitive.Group>) {
  return <Primitive.Group data-slot="select-group" {...props} />;
}

export function SelectValue(props: React.ComponentProps<typeof Primitive.Value>) {
  return <Primitive.Value data-slot="select-value" {...props} />;
}

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger> & {
    size?: 'sm' | 'default';
    fullWidth?: boolean;
  }
>(function SelectTrigger(
  { className, size = 'default', fullWidth = false, children, ...props },
  ref
) {
  return (
    <Primitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      data-size={size}
      data-full-width={fullWidth ? 'true' : undefined}
      className={cn('mw-ui-select-trigger', className)}
      {...props}
    >
      {children}
      <Primitive.Icon asChild>{down}</Primitive.Icon>
    </Primitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(function SelectContent(
  { className, children, position = 'item-aligned', align = 'center', ...props },
  ref
) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={ref}
        data-slot="select-content"
        data-position={position}
        className={cn(
          'mw-ui-select-content',
          position === 'popper' && 'mw-ui-select-popper',
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <Primitive.Viewport
          data-position={position}
          className={cn(
            'mw-ui-select-viewport',
            position === 'popper' && 'mw-ui-select-viewport-popper'
          )}
        >
          {children}
        </Primitive.Viewport>
        <SelectScrollDownButton />
      </Primitive.Content>
    </Primitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof Primitive.Label>,
  React.ComponentPropsWithoutRef<typeof Primitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <Primitive.Label
      ref={ref}
      data-slot="select-label"
      className={cn('mw-ui-select-label', className)}
      {...props}
    />
  );
});
SelectLabel.displayName = 'SelectLabel';

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      data-slot="select-item"
      className={cn('mw-ui-select-item', className)}
      {...props}
    >
      <span data-slot="select-item-indicator" className="mw-ui-select-indicator">
        <Primitive.ItemIndicator>{check}</Primitive.ItemIndicator>
      </span>
      <Primitive.ItemText>{children}</Primitive.ItemText>
    </Primitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof Primitive.Separator>,
  React.ComponentPropsWithoutRef<typeof Primitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <Primitive.Separator
      ref={ref}
      data-slot="select-separator"
      className={cn('mw-ui-select-separator', className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = 'SelectSeparator';

export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof Primitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof Primitive.ScrollUpButton>
>(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <Primitive.ScrollUpButton
      ref={ref}
      data-slot="select-scroll-up-button"
      className={cn('mw-ui-select-scroll', className)}
      {...props}
    >
      {up}
    </Primitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof Primitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof Primitive.ScrollDownButton>
>(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <Primitive.ScrollDownButton
      ref={ref}
      data-slot="select-scroll-down-button"
      className={cn('mw-ui-select-scroll', className)}
      {...props}
    >
      {down}
    </Primitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = 'SelectScrollDownButton';
