'use client';

import * as React from 'react';
import { DropdownMenu as Primitive } from 'radix-ui';
import { cn } from '../lib/cn.js';

export function DropdownMenu({
  modal = false,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="dropdown-menu" modal={modal} {...props} />;
}

export function DropdownMenuPortal(props: React.ComponentProps<typeof Primitive.Portal>) {
  return <Primitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function DropdownMenuTrigger(props, ref) {
  return <Primitive.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props} />;
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn('mw-ui-menu-content', className)}
        {...props}
      />
    </Primitive.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export function DropdownMenuGroup(props: React.ComponentProps<typeof Primitive.Group>) {
  return <Primitive.Group data-slot="dropdown-menu-group" {...props} />;
}

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
  }
>(function DropdownMenuItem({ className, inset, variant = 'default', ...props }, ref) {
  return (
    <Primitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset ? 'true' : undefined}
      data-variant={variant}
      className={cn('mw-ui-menu-item', className)}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Primitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Primitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <Primitive.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={cn('mw-ui-menu-item mw-ui-menu-indented', className)}
      {...props}
    >
      <span className="mw-ui-menu-indicator" aria-hidden="true">
        <Primitive.ItemIndicator>✓</Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export function DropdownMenuRadioGroup(props: React.ComponentProps<typeof Primitive.RadioGroup>) {
  return <Primitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Primitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Primitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <Primitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={cn('mw-ui-menu-item mw-ui-menu-indented', className)}
      {...props}
    >
      <span className="mw-ui-menu-indicator" aria-hidden="true">
        <Primitive.ItemIndicator>●</Primitive.ItemIndicator>
      </span>
      {children}
    </Primitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Primitive.Label>,
  React.ComponentPropsWithoutRef<typeof Primitive.Label> & { inset?: boolean }
>(function DropdownMenuLabel({ className, inset, ...props }, ref) {
  return (
    <Primitive.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset ? 'true' : undefined}
      className={cn('mw-ui-menu-label', className)}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Primitive.Separator>,
  React.ComponentPropsWithoutRef<typeof Primitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <Primitive.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      className={cn('mw-ui-menu-separator', className)}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(function DropdownMenuShortcut({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-slot="dropdown-menu-shortcut"
      className={cn('mw-ui-menu-shortcut', className)}
      {...props}
    />
  );
});
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export function DropdownMenuSub(props: React.ComponentProps<typeof Primitive.Sub>) {
  return <Primitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.SubTrigger> & { inset?: boolean }
>(function DropdownMenuSubTrigger({ className, inset, children, ...props }, ref) {
  return (
    <Primitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset ? 'true' : undefined}
      className={cn('mw-ui-menu-item mw-ui-menu-sub-trigger', className)}
      {...props}
    >
      {children}
      <span className="mw-ui-menu-chevron" aria-hidden="true">
        ›
      </span>
    </Primitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Primitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof Primitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <Primitive.Portal>
      <Primitive.SubContent
        ref={ref}
        data-slot="dropdown-menu-sub-content"
        className={cn('mw-ui-menu-content', className)}
        {...props}
      />
    </Primitive.Portal>
  );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';
