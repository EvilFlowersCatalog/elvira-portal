import { RefObject, useEffect, useRef } from 'react';

/** How close to the bottom (px) still counts as "following" the conversation. */
const FOLLOW_THRESHOLD = 120;

/**
 * Keeps a chat scrolled to its newest content. Scrolling on new messages alone
 * is not enough: book cards load their details afterwards and grow the list
 * after the scroll already ran. This follows every size change of `contentRef`,
 * unless the reader has scrolled up to read something older.
 */
const useStickToBottom = (
  containerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>
) => {
  const following = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const onScroll = () => {
      following.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < FOLLOW_THRESHOLD;
    };
    const observer = new ResizeObserver(() => {
      if (following.current) container.scrollTop = container.scrollHeight;
    });

    container.addEventListener('scroll', onScroll, { passive: true });
    observer.observe(content);
    container.scrollTop = container.scrollHeight;

    return () => {
      container.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [containerRef, contentRef]);

  /** Call when the reader sends a message: always jump to (and follow) the bottom. */
  return () => {
    following.current = true;
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  };
};

export default useStickToBottom;
