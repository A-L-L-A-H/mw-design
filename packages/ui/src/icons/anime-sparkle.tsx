import { forwardRef, useId, type SVGProps } from 'react';

export type AnimeSparkleIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D1 = "m12 2 2 6.5L20.5 10.5 14 12.5 12 19l-2-6.5-6.5-2L10 8.5 12 2Z";
const PATH_D2 = "M18.5 16.5v4M16.5 18.5h4";

const AnimeSparkleIcon = forwardRef<SVGSVGElement, AnimeSparkleIconProps>(function AnimeSparkleIcon(
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

AnimeSparkleIcon.displayName = 'AnimeSparkleIcon';

export { AnimeSparkleIcon };
