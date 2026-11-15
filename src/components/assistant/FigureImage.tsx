import { useEffect, useId, useRef, useState } from 'react';
import { IFigureMark } from '../../utils/interfaces/assistant';
import { MARK_COLOR } from './figureMarks';

/** Where a mark's number badge sits: its top-left corner, an arrow's tail, a point itself. */
const badgeAt = (mark: IFigureMark, w: number, h: number) => {
  if (mark.shape === 'point' || mark.shape === 'arrow') return { x: mark.x0 * w, y: mark.y0 * h };
  return { x: Math.min(mark.x0, mark.x1 ?? mark.x0) * w, y: Math.min(mark.y0, mark.y1 ?? mark.y0) * h };
};

function MarkShape({
  mark,
  w,
  h,
  index,
  active,
  arrowId,
}: {
  mark: IFigureMark;
  w: number;
  h: number;
  index: number;
  active: boolean;
  arrowId: string;
}) {
  const stroke = active ? 3.5 : 2.25;
  const x0 = mark.x0 * w;
  const y0 = mark.y0 * h;
  const x1 = (mark.x1 ?? mark.x0) * w;
  const y1 = (mark.y1 ?? mark.y0) * h;
  const badge = badgeAt(mark, w, h);
  return (
    <g>
      {mark.shape === 'box' ? (
        <rect
          x={Math.min(x0, x1)}
          y={Math.min(y0, y1)}
          width={Math.abs(x1 - x0)}
          height={Math.abs(y1 - y0)}
          rx={3}
          fill={MARK_COLOR}
          fillOpacity={active ? 0.16 : 0.07}
          stroke={MARK_COLOR}
          strokeWidth={stroke}
        />
      ) : null}
      {mark.shape === 'ellipse' ? (
        <ellipse
          cx={(x0 + x1) / 2}
          cy={(y0 + y1) / 2}
          rx={Math.abs(x1 - x0) / 2}
          ry={Math.abs(y1 - y0) / 2}
          fill={MARK_COLOR}
          fillOpacity={active ? 0.16 : 0.07}
          stroke={MARK_COLOR}
          strokeWidth={stroke}
        />
      ) : null}
      {mark.shape === 'arrow' ? (
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={MARK_COLOR} strokeWidth={stroke} markerEnd={`url(#${arrowId})`} />
      ) : null}
      {mark.shape === 'point' ? <circle cx={x0} cy={y0} r={active ? 7 : 5} fill={MARK_COLOR} stroke="#fff" strokeWidth={1.5} /> : null}
      <g transform={`translate(${Math.max(9, Math.min(w - 9, badge.x))} ${Math.max(9, Math.min(h - 9, badge.y))})`}>
        <circle r={9} fill={MARK_COLOR} stroke="#fff" strokeWidth={1.5} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#fff">
          {index + 1}
        </text>
      </g>
    </g>
  );
}

/**
 * A figure crop with the assistant's marks drawn over it. The overlay is sized from the image as rendered (not
 * the box around it), so marks stay on the parts they point at at any size; it is SVG, so no canvas reads the
 * cross-origin crop.
 */
export default function FigureImage({
  src,
  alt,
  marks,
  showMarks,
  activeMark,
  imgClassName,
}: {
  src: string;
  alt: string;
  marks: IFigureMark[];
  showMarks: boolean;
  activeMark?: number | null;
  imgClassName: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  // One arrowhead per overlay: several figure cards share the page, and `:` from useId breaks `url(#…)`.
  const arrowId = `efv-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const measure = () => (img.clientWidth && img.clientHeight ? setSize({ w: img.clientWidth, h: img.clientHeight }) : undefined);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return (
    <span className="relative inline-block max-w-full align-top">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => imgRef.current && setSize({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight })}
        className={`block ${imgClassName}`}
      />
      {showMarks && marks.length && size ? (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden="true"
        >
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={MARK_COLOR} />
            </marker>
          </defs>
          {marks.map((mark, index) => (
            <MarkShape key={index} mark={mark} w={size.w} h={size.h} index={index} active={activeMark === index} arrowId={arrowId} />
          ))}
        </svg>
      ) : null}
    </span>
  );
}

/** The numbered list of marks under a figure: what each one points at. Hovering an item highlights its mark. */
export function FigureMarksLegend({
  marks,
  onActivate,
}: {
  marks: IFigureMark[];
  onActivate: (index: number | null) => void;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {marks.map((mark, index) => (
        <li
          key={index}
          className="flex items-start gap-1.5 text-xs text-black dark:text-white"
          onMouseEnter={() => onActivate(index)}
          onMouseLeave={() => onActivate(null)}
          onFocus={() => onActivate(index)}
          onBlur={() => onActivate(null)}
          tabIndex={0}
        >
          <span
            className="mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: MARK_COLOR }}
          >
            {index + 1}
          </span>
          <span>
            {mark.label ? <span className="font-semibold">{mark.label}</span> : null}
            {mark.label && mark.note ? ' — ' : null}
            {mark.note ? <span className="text-gray-600 dark:text-gray-300">{mark.note}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
