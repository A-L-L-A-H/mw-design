import { forwardRef, useId, type SVGProps } from 'react';

export type AnimeSweatdropIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D1 = "M12 3c2.5 4.6 6 8.3 6 12.2a6 6 0 0 1-12 0C6 11.3 9.5 7.6 12 3Z";
const PATH_D2 = "M9.8 14.2c0 1.4.8 2.4 2 2.8";

const AnimeSweatdropIcon = forwardRef<SVGSVGElement, AnimeSweatdropIconProps>(function AnimeSweatdropIcon(
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
      <path d={PATH_D1} />
      <path d={PATH_D2} />
    </svg>
  );
});

AnimeSweatdropIcon.displayName = 'AnimeSweatdropIcon';

export { AnimeSweatdropIcon };
