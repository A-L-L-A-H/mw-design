import { forwardRef, useId, type SVGProps } from 'react';

export type ElementFireIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ElementFireIcon = forwardRef<SVGSVGElement, ElementFireIconProps>(function ElementFireIcon(
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
      <path d="M12.5 2.5c.8 3.2-1.8 4.8-2.2 7.2-.2 1.2.4 2.2 1.5 2.5-.2-1.6.9-2.8 2.2-3.7 2.5 2 4.5 4.4 4.5 7.2a6.5 6.5 0 1 1-13 0c0-3.4 2.4-6.3 5-9 .8-.8 1.5-2.1 2-4.2Z" />
    </svg>
  );
});

ElementFireIcon.displayName = 'ElementFireIcon';

export { ElementFireIcon };
