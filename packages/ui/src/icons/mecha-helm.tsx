import { forwardRef, useId, type SVGProps } from 'react';

export type MechaHelmIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const MechaHelmIcon = forwardRef<SVGSVGElement, MechaHelmIconProps>(function MechaHelmIcon(
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
      <path d="M4.5 11.5a7.5 7.5 0 0 1 15 0V17l-4 3.5h-7L4.5 17v-5.5Z" />
      <path d="M5.5 12h13l-1.5 3.5h-10L5.5 12ZM12 4V2m-5.5 3.5L4.5 3M17.5 5.5 19.5 3" />
    </svg>
  );
});

MechaHelmIcon.displayName = 'MechaHelmIcon';

export { MechaHelmIcon };
