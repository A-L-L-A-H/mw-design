import { forwardRef, useId, type SVGProps } from 'react';

export type PotionFlaskIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PotionFlaskIcon = forwardRef<SVGSVGElement, PotionFlaskIconProps>(function PotionFlaskIcon(
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
      <path d="M9.5 3h5M10.5 3v4.5L5.2 16a3.5 3.5 0 0 0 3 5.2h7.6a3.5 3.5 0 0 0 3-5.2L13.5 7.5V3" />
      <path d="M7.2 14.5h9.6" />
      <circle cx="10.5" cy="17.5" r="0.9" />
      <circle cx="14" cy="16.5" r="0.7" />
    </svg>
  );
});

PotionFlaskIcon.displayName = 'PotionFlaskIcon';

export { PotionFlaskIcon };
