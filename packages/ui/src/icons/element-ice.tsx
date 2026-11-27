import { forwardRef, useId, type SVGProps } from 'react';

export type ElementIceIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ElementIceIcon = forwardRef<SVGSVGElement, ElementIceIconProps>(function ElementIceIcon(
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
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8" />
      <path d="m9.5 5 2.5 2 2.5-2M9.5 19l2.5-2 2.5 2M5 10.2l2.6.8-.6 2.6M19 10.2l-2.6.8.6 2.6" />
    </svg>
  );
});

ElementIceIcon.displayName = 'ElementIceIcon';

export { ElementIceIcon };
