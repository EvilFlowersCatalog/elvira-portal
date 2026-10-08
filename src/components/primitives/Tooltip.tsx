import { cloneElement, FocusEvent, MouseEvent, ReactElement, ReactNode, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement<any>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const GAP = 8;

// Anchor point on the trigger's rect + the transform that places the bubble around it.
const ANCHOR: Record<
  NonNullable<TooltipProps['placement']>,
  { point: (r: DOMRect) => { x: number; y: number }; transform: string }
> = {
  top: { point: (r) => ({ x: r.left + r.width / 2, y: r.top }), transform: `translate(-50%, calc(-100% - ${GAP}px))` },
  bottom: { point: (r) => ({ x: r.left + r.width / 2, y: r.bottom }), transform: `translate(-50%, ${GAP}px)` },
  left: { point: (r) => ({ x: r.left, y: r.top + r.height / 2 }), transform: `translate(calc(-100% - ${GAP}px), -50%)` },
  right: { point: (r) => ({ x: r.right, y: r.top + r.height / 2 }), transform: `translate(${GAP}px, -50%)` },
};

/**
 * Styled tooltip shown on hover/focus — replaces the browser's default `title=""` bubble.
 * Clones the trigger in place (rather than wrapping it in an extra element) so it doesn't
 * disturb a trigger that's already absolutely/relatively positioned by its parent.
 *
 * The bubble is only rendered while visible and is portaled to <body> with fixed
 * positioning, so it never extends the scrollable area of an overflow container
 * (e.g. a table cell near the edge of a scrolling DataTable).
 */
const Tooltip = ({ content, children, placement = 'top', className }: TooltipProps) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const id = useId();
  const childProps = children.props as Record<string, any>;

  const show = (e: { currentTarget: Element }) => setAnchor(e.currentTarget.getBoundingClientRect());
  const hide = () => setAnchor(null);

  const { point, transform } = ANCHOR[placement];
  const pos = anchor ? point(anchor) : null;

  return cloneElement(children, {
    'aria-describedby': anchor ? id : undefined,
    className: twMerge('relative', childProps.className),
    onMouseEnter: (e: MouseEvent) => {
      childProps.onMouseEnter?.(e);
      show(e);
    },
    onMouseLeave: (e: MouseEvent) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: FocusEvent) => {
      childProps.onFocus?.(e);
      show(e);
    },
    onBlur: (e: FocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
    children: (
      <>
        {childProps.children}
        {pos &&
          createPortal(
            <span
              role="tooltip"
              id={id}
              style={{ position: 'fixed', left: pos.x, top: pos.y, transform }}
              className={twMerge(
                'pointer-events-none z-[1300] whitespace-nowrap rounded-md bg-darkGray px-2.5 py-1.5 text-xs font-medium text-white shadow-[0px_4px_12px_rgba(0,0,0,0.25)] dark:bg-zinc-900',
                className
              )}
            >
              {content}
            </span>,
            document.body
          )}
      </>
    ),
  });
};

export default Tooltip;
