import { forwardRef, useId, type SVGProps } from 'react';

export type ShieldCrestIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ShieldCrestIcon = forwardRef<SVGSVGElement, ShieldCrestIconProps>(function ShieldCrestIcon(
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
      <path d="M12 2.5 19.5 5.5v6c0 4.6-3.1 8-7.5 10-4.4-2-7.5-5.4-7.5-10v-6L12 2.5Z" />
      <path d="M12 6.5v11M8.5 10.5h7" />
    </svg>
  );
});

ShieldCrestIcon.displayName = 'ShieldCrestIcon';

export { ShieldCrestIcon };
