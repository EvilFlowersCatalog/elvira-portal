import { cloneElement, FocusEvent, MouseEvent, ReactElement, ReactNode, useId, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement<any>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const PLACEMENT: Record<NonNullable<TooltipProps['placement']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Styled tooltip shown on hover/focus — replaces the browser's default `title=""` bubble.
 * Clones the trigger in place (rather than wrapping it in an extra element) so it doesn't
 * disturb a trigger that's already absolutely/relatively positioned by its parent.
 */
const Tooltip = ({ content, children, placement = 'top', className }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const childProps = children.props as Record<string, any>;

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  return cloneElement(children, {
    'aria-describedby': visible ? id : undefined,
    className: twMerge('relative', childProps.className),
    onMouseEnter: (e: MouseEvent) => {
      childProps.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: MouseEvent) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: FocusEvent) => {
      childProps.onFocus?.(e);
      show();
    },
    onBlur: (e: FocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
    children: (
      <>
        {childProps.children}
        <span
          role="tooltip"
          id={id}
          className={twMerge(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-darkGray px-2.5 py-1.5 text-xs font-medium text-white shadow-[0px_4px_12px_rgba(0,0,0,0.25)] transition-opacity duration-150 dark:bg-zinc-900',
            PLACEMENT[placement],
            visible ? 'opacity-100' : 'opacity-0',
            className
          )}
        >
          {content}
        </span>
      </>
    ),
  });
};

export default Tooltip;
