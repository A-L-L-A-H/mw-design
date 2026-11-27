import { forwardRef, type ComponentProps } from 'react';

export type InputProps = ComponentProps<'input'> & {
  controlSize?: 'sm' | 'md' | 'lg';
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, controlSize = 'md', ...props },
  ref
) {
  const classes = ['mw-ui-input', className].filter(Boolean).join(' ');
  return (
    <input ref={ref} data-slot="input" data-size={controlSize} className={classes} {...props} />
  );
});
