import { forwardRef, useId, type SVGProps } from 'react';

export type TrophyCrownIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const TrophyCrownIcon = forwardRef<SVGSVGElement, TrophyCrownIconProps>(function TrophyCrownIcon(
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
      <path d="M3.5 18.5h17l1-10.5-5 4-4.5-6.5L7.5 12l-5-4 1 10.5Z" />
      <path d="M5 21h14" />
      <circle cx="12" cy="4.5" r="1" />
    </svg>
  );
});

TrophyCrownIcon.displayName = 'TrophyCrownIcon';

export { TrophyCrownIcon };
