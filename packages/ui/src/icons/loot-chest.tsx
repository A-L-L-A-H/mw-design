import { forwardRef, useId, type SVGProps } from 'react';

export type LootChestIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const LootChestIcon = forwardRef<SVGSVGElement, LootChestIconProps>(function LootChestIcon(
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
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M3 11.5h18M5 8V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V8" />
      <rect x="10.2" y="10" width="3.6" height="4" rx="0.6" />
    </svg>
  );
});

LootChestIcon.displayName = 'LootChestIcon';

export { LootChestIcon };
