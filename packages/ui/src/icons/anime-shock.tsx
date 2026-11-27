import { forwardRef, useId, type SVGProps } from 'react';

export type AnimeShockIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D = (
  "m6 3 2.5 7.5L5.5 12 9 21M12 2.5v13m0 4v1.5"
  + "M18 3l-2.5 7.5 3 1.5L15 21"
);

const AnimeShockIcon = forwardRef<SVGSVGElement, AnimeShockIconProps>(function AnimeShockIcon(
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
      <path d={PATH_D} />
    </svg>
  );
});

AnimeShockIcon.displayName = 'AnimeShockIcon';

export { AnimeShockIcon };
