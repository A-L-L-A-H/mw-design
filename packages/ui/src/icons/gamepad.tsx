import { forwardRef, useId, type SVGProps } from 'react';

export type GamepadIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> & {
  title?: string;
  size?: number | string;
};

const PATH_D1 = (
  "M6.5 7h11a4 4 0 0 1 3.9 4.8l-.9 4.5a2.6 2.6 0 0 1-4.5 1.2L14.2 15.5H9.8L8"
  + " 17.5a2.6 2.6 0 0 1-4.5-1.2l-.9-4.5A4 4 0 0 1 6.5 7Z"
);
const PATH_D2 = "M7.5 10.5v3M6 12h3";

const GamepadIcon = forwardRef<SVGSVGElement, GamepadIconProps>(function GamepadIcon(
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
      <circle cx="15.5" cy="11" r="0.8" />
      <circle cx="17.5" cy="12.8" r="0.8" />
    </svg>
  );
});

GamepadIcon.displayName = 'GamepadIcon';

export { GamepadIcon };
