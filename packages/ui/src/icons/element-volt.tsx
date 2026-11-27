import { forwardRef, useId, type SVGProps } from 'react';

export type ElementVoltIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ElementVoltIcon = forwardRef<SVGSVGElement, ElementVoltIconProps>(function ElementVoltIcon(
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
      <polygon points="13.5 2.5 5.5 13 11.5 13 10.5 21.5 18.5 11 12.5 11" />
      <path d="M4 6.5 6.5 8M18 16l2.5 1.5" />
    </svg>
  );
});

ElementVoltIcon.displayName = 'ElementVoltIcon';

export { ElementVoltIcon };
