import * as React from 'react';
import { cn } from '../lib/cn.js';
import { Switch as SwitchPrimitive } from 'radix-ui';

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default';
};

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(function Switch({ className, size = 'default', ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      data-size={size}
      className={cn('mw-ui-switch', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className="mw-ui-switch-thumb" />
    </SwitchPrimitive.Root>
  );
});
