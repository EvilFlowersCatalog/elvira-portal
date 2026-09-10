import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export default function EntriesWrapper({ children, limitRows = false, className }: { className?: string, children: React.ReactNode, limitRows?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!limitRows) return;
    const container = containerRef.current;
    if (!container) return;

    const calculate = () => {
      const items = Array.from(container.children) as HTMLElement[];
      if (!items.length) return;

      const gap = parseFloat(getComputedStyle(container).rowGap) || 16;
      const containerTop = container.getBoundingClientRect().top;

      // Group items by their top offset to determine rows
      const rowMap = new Map<number, number>(); // rounded top → max height in that row

      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const relTop = Math.round(rect.top - containerTop);
        rowMap.set(relTop, Math.max(rowMap.get(relTop) ?? 0, rect.height));
      });

      const rows = [...rowMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, h]) => h);

      const shadowSpace = parseFloat(getComputedStyle(container).paddingBottom) || 0;

      const cumulative = (n: number) =>
        rows.slice(0, n).reduce((sum, h, i) => sum + h + (i > 0 ? gap : 0), 0) + shadowSpace;

      container.style.setProperty('--limit-1row', `${cumulative(1)}px`);
      container.style.setProperty('--limit-2rows', `${cumulative(2)}px`);
      container.style.setProperty('--limit-3rows', `${cumulative(3)}px`);
    };

    const ro = new ResizeObserver(calculate);
    ro.observe(container);

    // Re-observe children when they're added/removed
    const mo = new MutationObserver(() => {
      Array.from(container.children).forEach(child => ro.observe(child));
      calculate();
    });
    mo.observe(container, { childList: true });

    Array.from(container.children).forEach(child => ro.observe(child));
    calculate();

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [limitRows]);

  return (
    <div
      ref={containerRef}
      className={twMerge(
        `grid w-full grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 px-8 pb-4`,
        limitRows
          ? `[max-height:var(--limit-3rows)] md:[max-height:var(--limit-2rows)] lg:[max-height:var(--limit-1row)] overflow-y-hidden`
          : '',
        className
      )}
    >
      {children}
    </div>
  );
}
