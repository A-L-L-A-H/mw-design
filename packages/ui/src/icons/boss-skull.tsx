import { forwardRef, useId, type SVGProps } from 'react';

export type BossSkullIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D = (
  "M5 10.5a7 7 0 0 1 14 0c0 2.7-1.4 4.8-3 5.8V19a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5"
  + "0 0 1 8 19v-2.7c-1.6-1-3-3.1-3-5.8Z"
);

const BossSkullIcon = forwardRef<SVGSVGElement, BossSkullIconProps>(function BossSkullIcon(
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
      <path d={PATH_D} />
      <circle cx="9.5" cy="11" r="1.4" />
      <circle cx="14.5" cy="11" r="1.4" />
      <path d="M12 14v1.5M10 17.5v3M14 17.5v3" />
    </svg>
  );
});

BossSkullIcon.displayName = 'BossSkullIcon';

export { BossSkullIcon };
