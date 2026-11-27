import { forwardRef, useId, type SVGProps } from 'react';

export type AnimeAngerIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const AnimeAngerIcon = forwardRef<SVGSVGElement, AnimeAngerIconProps>(function AnimeAngerIcon(
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
      <path d="M9 4v4a2 2 0 0 1-2 2H3M15 4v4a2 2 0 0 0 2 2h4M9 20v-4a2 2 0 0 0-2-2H3M15 20v-4a2 2 0 0 1 2-2h4" />
    </svg>
  );
});

AnimeAngerIcon.displayName = 'AnimeAngerIcon';

export { AnimeAngerIcon };
