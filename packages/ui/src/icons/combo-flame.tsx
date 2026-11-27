import { forwardRef, useId, type SVGProps } from 'react';

export type ComboFlameIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ComboFlameIcon = forwardRef<SVGSVGElement, ComboFlameIconProps>(function ComboFlameIcon(
  { size = 24, title, ...props },
  ref
) {
  const titleId = useId();
  return (
    <svg
      ref={ref}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      height={size}
      role={title ? 'img' : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path d="M13 3c2 2.8 5.5 4.8 5.5 9.5A6.5 6.5 0 0 1 12 19a6.5 6.5 0 0 1-6.5-6.5c0-2.5 1.2-4.6 3-6-.2 2 .8 3.2 2.2 3.5C10.5 7 11.4 4.8 13 3Z" />
      <path d="m9.5 15 2.5-3.5L14.5 15" />
    </svg>
  );
});

ComboFlameIcon.displayName = 'ComboFlameIcon';

export { ComboFlameIcon };
