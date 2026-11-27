import { forwardRef, type ComponentProps } from 'react';

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref
) {
  const classes = ['mw-ui-checkbox', className].filter(Boolean).join(' ');
  return <input ref={ref} type="checkbox" data-slot="checkbox" className={classes} {...props} />;
});
