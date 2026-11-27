import { forwardRef, type ComponentProps } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = Omit<ComponentProps<'img'>, 'alt'> & {
  name: string;
  size?: AvatarSize;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('');
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { className, name, size = 'md', src, ...props },
  ref
) {
  const classes = ['mw-ui-avatar', className].filter(Boolean).join(' ');
  return (
    <span
      ref={ref}
      data-slot="avatar"
      data-size={size}
      className={classes}
      role="img"
      aria-label={name}
    >
      {src ? <img src={src} alt="" {...props} /> : initials(name)}
    </span>
  );
});
