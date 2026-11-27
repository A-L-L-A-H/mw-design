import { forwardRef, useId, type SVGProps } from 'react';

export type SkillNodeIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const SkillNodeIcon = forwardRef<SVGSVGElement, SkillNodeIconProps>(function SkillNodeIcon(
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
      <circle cx="12" cy="5.5" r="2.5" />
      <circle cx="5.5" cy="18" r="2.5" />
      <circle cx="18.5" cy="18" r="2.5" />
      <path d="M10.7 7.7 6.8 15.8M13.3 7.7l3.9 8.1M8 18h8" />
    </svg>
  );
});

SkillNodeIcon.displayName = 'SkillNodeIcon';

export { SkillNodeIcon };
