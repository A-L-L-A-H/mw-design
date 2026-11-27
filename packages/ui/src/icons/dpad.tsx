import { forwardRef, useId, type SVGProps } from 'react';

export type DpadIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const DpadIcon = forwardRef<SVGSVGElement, DpadIconProps>(function DpadIcon(
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
      <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6v-6Z" />
      <circle cx="12" cy="12" r="1.2" />
    </svg>
  );
});

DpadIcon.displayName = 'DpadIcon';

export { DpadIcon };
