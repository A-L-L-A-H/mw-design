import { forwardRef, useId, type SVGProps } from 'react';

export type KatanaIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const KatanaIcon = forwardRef<SVGSVGElement, KatanaIconProps>(function KatanaIcon(
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
      <path d="M20.5 3.5c-4.5 1.8-9.3 6.2-13 11.4l2.2 2.2c5.2-3.7 9.6-8.5 10.8-13.6Z" />
      <path d="m6.2 13.6 4.2 4.2M7.5 16.5 4 20l1.5 1.5 3.5-3.5" />
    </svg>
  );
});

KatanaIcon.displayName = 'KatanaIcon';

export { KatanaIcon };
