import { useCallback, useEffect, useRef, useState } from 'react';

/** Single-key shortcuts must never fire while the user types (search, assistant drawer, forms). */
const typingInto = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * Plain-key shortcuts for a page: `keys` maps a lower-case key to its action, or to null when the
 * action is unavailable right now. Ignored with modifiers, while typing, and while any dialog is open.
 */
export const useHotkeys = (keys: Record<string, (() => void) | null>) => {
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInto(e.target)) return;
      if (document.querySelector('[role=dialog]')) return;
      const action = ref.current[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

/**
 * Paper layout for the dashboard: light theme, A4 landscape, the report column at a fixed width so
 * the charts re-measure, then the browser dialog (which also offers "Save as PDF"). `printing` is
 * true while that layout is on; the matching CSS lives under `body.printing-dashboard` in main.css.
 */
export const usePrintReport = () => {
  const [printing, setPrinting] = useState(false);
  const print = useCallback(() => {
    const body = document.body;
    const wasDark = body.classList.contains('dark');
    const page = document.createElement('style');
    page.textContent = '@page { size: A4 landscape; margin: 10mm; }';
    document.head.appendChild(page);
    setPrinting(true);
    body.classList.add('printing-dashboard');
    body.classList.remove('dark');
    const restore = () => {
      page.remove();
      body.classList.remove('printing-dashboard');
      if (wasDark) body.classList.add('dark');
      setPrinting(false);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    // Give Responsive (50 ms debounce) time to re-measure at paper width.
    setTimeout(() => window.print(), 350);
  }, []);
  return { printing, print };
};
