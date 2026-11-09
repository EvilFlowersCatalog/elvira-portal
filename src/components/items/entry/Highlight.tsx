import { ElementType } from 'react';
import { sanitizeHighlight } from '../../../utils/func/highlight';

interface IHighlight {
  /** Server highlight (`<mark>` HTML). Falls back to `text` when empty. */
  html?: string | null;
  /** Plain text shown when there is no highlight. */
  text: string;
  as?: ElementType;
  className?: string;
}

/** Text with the search terms marked, as returned by the catalog search. */
const Highlight = ({ html, text, as: Tag = 'span', className }: IHighlight) =>
  html ? (
    <Tag className={`search-highlight ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: sanitizeHighlight(html) }} />
  ) : (
    <Tag className={className}>{text}</Tag>
  );

export default Highlight;
