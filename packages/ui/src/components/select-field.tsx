import { forwardRef, type ComponentProps } from 'react';

export type SelectFieldProps = ComponentProps<'select'> & {
  controlSize?: 'sm' | 'md' | 'lg';
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { className, controlSize = 'md', ...props },
  ref
) {
  const classes = ['mw-ui-select', className].filter(Boolean).join(' ');
  return (
    <select
      ref={ref}
      data-slot="select"
      data-size={controlSize}
      className={classes}
      {...props}
    />
  );
});
