import { forwardRef, useId, type SVGProps } from 'react';

export type ElementSolarIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ElementSolarIcon = forwardRef<SVGSVGElement, ElementSolarIconProps>(function ElementSolarIcon(
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
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3m-15.1-7.1 2.1 2.1m8 8 2.1 2.1m0-12.2-2.1 2.1m-8 8-2.1 2.1" />
    </svg>
  );
});

ElementSolarIcon.displayName = 'ElementSolarIcon';

export { ElementSolarIcon };
