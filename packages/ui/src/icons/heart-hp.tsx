import { forwardRef, useId, type SVGProps } from 'react';

export type HeartHpIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const HeartHpIcon = forwardRef<SVGSVGElement, HeartHpIconProps>(function HeartHpIcon(
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
      <path d="M12 20.5 4.8 13.8a4.7 4.7 0 0 1 6.7-6.6L12 7.8l.5-.6a4.7 4.7 0 0 1 6.7 6.6L12 20.5Z" />
      <path d="M8.5 11.5h2l1-2 1.2 4 1-2h1.8" />
    </svg>
  );
});

HeartHpIcon.displayName = 'HeartHpIcon';

export { HeartHpIcon };
