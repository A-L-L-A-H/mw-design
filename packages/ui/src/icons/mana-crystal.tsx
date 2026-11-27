import { forwardRef, useId, type SVGProps } from 'react';

export type ManaCrystalIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const ManaCrystalIcon = forwardRef<SVGSVGElement, ManaCrystalIconProps>(function ManaCrystalIcon(
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
      <polygon points="12 2.5 18.5 9.5 12 21.5 5.5 9.5" />
      <path d="M5.5 9.5h13M12 2.5l-2.5 7 2.5 12 2.5-12-2.5-7Z" />
    </svg>
  );
});

ManaCrystalIcon.displayName = 'ManaCrystalIcon';

export { ManaCrystalIcon };
