'use client';

import * as React from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { Button } from './button.js';
import { cn } from '../lib/cn.js';

export function Dialog(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root data-slot="dialog" {...props} />;
}

export const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function DialogTrigger(props, ref) {
  return <Primitive.Trigger ref={ref} data-slot="dialog-trigger" {...props} />;
});
DialogTrigger.displayName = 'DialogTrigger';

export function DialogPortal(props: React.ComponentProps<typeof Primitive.Portal>) {
  return <Primitive.Portal data-slot="dialog-portal" {...props} />;
}

export const DialogClose = React.forwardRef<
  React.ElementRef<typeof Primitive.Close>,
  React.ComponentPropsWithoutRef<typeof Primitive.Close>
>(function DialogClose(props, ref) {
  return <Primitive.Close ref={ref} data-slot="dialog-close" {...props} />;
});
DialogClose.displayName = 'DialogClose';

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof Primitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof Primitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <Primitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn('mw-ui-dialog-overlay', className)}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content> & { showCloseButton?: boolean }
>(function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Primitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn('mw-ui-dialog-content', className)}
        {...props}
      >
        <div className="mw-ui-dialog-body">{children}</div>
        {showCloseButton && (
          <Primitive.Close type="button" data-slot="dialog-close" className="mw-ui-dialog-close">
            <span aria-hidden="true">×</span>
            <span className="mw-ui-visually-hidden">Close</span>
          </Primitive.Close>
        )}
      </Primitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';

export const DialogHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DialogHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-header"
        className={cn('mw-ui-dialog-header', className)}
        {...props}
      />
    );
  }
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & { showCloseButton?: boolean }
>(function DialogFooter({ className, showCloseButton = false, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="dialog-footer"
      className={cn('mw-ui-dialog-footer', className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <Primitive.Close asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </Primitive.Close>
      )}
    </div>
  );
});
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof Primitive.Title>,
  React.ComponentPropsWithoutRef<typeof Primitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <Primitive.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn('mw-ui-dialog-title', className)}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof Primitive.Description>,
  React.ComponentPropsWithoutRef<typeof Primitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <Primitive.Description
      ref={ref}
      data-slot="dialog-description"
      className={cn('mw-ui-dialog-description', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';
