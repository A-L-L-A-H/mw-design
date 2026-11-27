import { forwardRef, useId, type SVGProps } from 'react';

export type QuestScrollIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const QuestScrollIcon = forwardRef<SVGSVGElement, QuestScrollIconProps>(function QuestScrollIcon(
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
      <path d="M6.5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11" />
      <path d="M6.5 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2 2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="M11 9h5.5M11 12.5h5.5M11 16h3.5" />
    </svg>
  );
});

QuestScrollIcon.displayName = 'QuestScrollIcon';

export { QuestScrollIcon };
