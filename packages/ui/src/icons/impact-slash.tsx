import { forwardRef, useId, type SVGProps } from 'react';

export type ImpactSlashIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ImpactSlashIcon = forwardRef<SVGSVGElement, ImpactSlashIconProps>(function ImpactSlashIcon(
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
      <path d="M4 20 20 4M8.5 19.5 19.5 8.5M4.5 15.5 15.5 4.5" />
      <path d="M3 10h4M17 14h4" />
    </svg>
  );
});

ImpactSlashIcon.displayName = 'ImpactSlashIcon';

export { ImpactSlashIcon };
