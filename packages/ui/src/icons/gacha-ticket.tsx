import { forwardRef, useId, type SVGProps } from 'react';

export type GachaTicketIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D1 = (
  "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2"
  + " 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"
);
const PATH_D2 = "M9 5v14M13.5 9.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3 1-2Z";

const GachaTicketIcon = forwardRef<SVGSVGElement, GachaTicketIconProps>(function GachaTicketIcon(
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
      <path d={PATH_D1} />
      <path d={PATH_D2} />
    </svg>
  );
});

GachaTicketIcon.displayName = 'GachaTicketIcon';

export { GachaTicketIcon };
