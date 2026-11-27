import { forwardRef, useId, type SVGProps } from 'react';

export type CriticalStarIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const CriticalStarIcon = forwardRef<SVGSVGElement, CriticalStarIconProps>(function CriticalStarIcon(
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
      <polygon points="12 2 14.3 8.2 21 6.5 16.4 11.8 21.5 16.5 14.8 15.8 12 22 9.2 15.8 2.5 16.5 7.6 11.8 3 6.5 9.7 8.2" />
    </svg>
  );
});

CriticalStarIcon.displayName = 'CriticalStarIcon';

export { CriticalStarIcon };
