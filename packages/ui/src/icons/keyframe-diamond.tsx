import { forwardRef, useId, type SVGProps } from 'react';

export type KeyframeDiamondIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const KeyframeDiamondIcon = forwardRef<SVGSVGElement, KeyframeDiamondIconProps>(function KeyframeDiamondIcon(
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
      <polygon points="12 3 21 12 12 21 3 12" />
      <polygon points="12 8 16 12 12 16 8 12" />
    </svg>
  );
});

KeyframeDiamondIcon.displayName = 'KeyframeDiamondIcon';

export { KeyframeDiamondIcon };
