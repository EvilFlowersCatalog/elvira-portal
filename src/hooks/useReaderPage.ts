import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The page the reader shows.
 *
 * The viewer's `onPageChange` (EvilFlowersViewer#152) reports it: pass the returned `onPageChange` in
 * the viewer's options. Viewer 0.7.9 has no such callback; for it the page is read from its bottom bar's
 * page box (`input[name="search-page"]`, whose placeholder carries the active page) until the callback
 * has fired once. Null until the viewer has rendered.
 */
export default function useReaderPage(rootId: string) {
  const [page, setPage] = useState<number | null>(null);
  const reported = useRef(false);

  const onPageChange = useCallback(({ page: next }: { page: number }) => {
    reported.current = true;
    setPage(next);
  }, []);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const read = () => {
      if (reported.current) return;
      const input = root.querySelector<HTMLInputElement>('input[name="search-page"]');
      const value = Number(input?.placeholder);
      setPage(Number.isInteger(value) && value > 0 ? value : null);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['placeholder'] });
    return () => observer.disconnect();
  }, [rootId]);

  return { page, onPageChange };
}
