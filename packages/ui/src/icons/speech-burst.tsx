import { forwardRef, useId, type SVGProps } from 'react';

export type SpeechBurstIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const SpeechBurstIcon = forwardRef<SVGSVGElement, SpeechBurstIconProps>(function SpeechBurstIcon(
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
      <polygon points="4 6 8 7.5 11.5 3.5 14.5 7 20 5 18.5 10.5 22 13.5 17.5 15.5 18.5 20 13 17.5 8 20.5 8.5 16 3 15 6 11" />
    </svg>
  );
});

SpeechBurstIcon.displayName = 'SpeechBurstIcon';

export { SpeechBurstIcon };
