import { useEffect, useState } from 'react';

/**
 * The page the reader shows, read from the viewer's own DOM: its bottom bar's page box
 * (`input[name="search-page"]`) carries the active page as its placeholder.
 *
 * Stopgap: `@evilflowers/evilflowersviewer` has no page-change callback yet. Once it gets one (e.g.
 * `onPageChange` in its options), pass that instead and drop this observer. Null until the viewer has rendered.
 */
export default function useReaderPage(rootId: string): number | null {
  const [page, setPage] = useState<number | null>(null);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const read = () => {
      const input = root.querySelector<HTMLInputElement>('input[name="search-page"]');
      const value = Number(input?.placeholder);
      setPage(Number.isInteger(value) && value > 0 ? value : null);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['placeholder'] });
    return () => observer.disconnect();
  }, [rootId]);

  return page;
}
