import { forwardRef, useId, type SVGProps } from 'react';

export type RadarPingIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const RadarPingIcon = forwardRef<SVGSVGElement, RadarPingIconProps>(function RadarPingIcon(
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
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 18.2 5.8" />
      <circle cx="15.5" cy="14.5" r="1" />
    </svg>
  );
});

RadarPingIcon.displayName = 'RadarPingIcon';

export { RadarPingIcon };
