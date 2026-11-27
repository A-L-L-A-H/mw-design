import { forwardRef, useId, type SVGProps } from 'react';

export type ClapperboardIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ClapperboardIcon = forwardRef<SVGSVGElement, ClapperboardIconProps>(function ClapperboardIcon(
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
      <rect x="3" y="9" width="18" height="11.5" rx="1.5" />
      <path d="M3 9 20.5 4.5 21.5 8 3.5 12.5M8 7.8l2 3.2M13.5 6.3l2 3.2" />
    </svg>
  );
});

ClapperboardIcon.displayName = 'ClapperboardIcon';

export { ClapperboardIcon };
