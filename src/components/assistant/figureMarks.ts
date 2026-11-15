import { IAssistantCitation, IFigureMark } from '../../utils/interfaces/assistant';

const SHAPES: IFigureMark['shape'][] = ['box', 'ellipse', 'arrow', 'point'];
const MAX_MARKS = 12;

/** The one colour marks are drawn in: readable over the usual white-background figure, in both themes. */
export const MARK_COLOR = '#e11d48';

const unit = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null;
const text = (value: unknown, max: number): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;

/**
 * A figure citation's marks, made safe to draw: known shapes only, coordinates clamped to the crop, at most
 * twelve, labels and notes as bounded plain text. Anything malformed is dropped rather than guessed at.
 */
export const figureMarks = (citation: IAssistantCitation): IFigureMark[] => {
  if (!Array.isArray(citation.marks)) return [];
  const marks: IFigureMark[] = [];
  for (const raw of citation.marks as unknown[]) {
    if (marks.length >= MAX_MARKS) break;
    if (!raw || typeof raw !== 'object') continue;
    const mark = raw as Record<string, unknown>;
    const shape = mark.shape as IFigureMark['shape'];
    const x0 = unit(mark.x0);
    const y0 = unit(mark.y0);
    if (!SHAPES.includes(shape) || x0 === null || y0 === null) continue;
    const x1 = unit(mark.x1);
    const y1 = unit(mark.y1);
    if (shape !== 'point' && (x1 === null || y1 === null)) continue;
    const label = text(mark.label, 60);
    const note = text(mark.note, 280);
    marks.push({
      shape,
      x0,
      y0,
      ...(x1 !== null ? { x1 } : {}),
      ...(y1 !== null ? { y1 } : {}),
      ...(label ? { label } : {}),
      ...(note ? { note } : {}),
    });
  }
  return marks;
};
