import { forwardRef, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { entryPath } from '@/lib/links/paths';
import { prefetchEntry } from '../../../hooks/api/entries/entryQueries';
import useEntryDialog from '../../../hooks/useEntryDialog';

interface IEntryLink {
  entryId: string;
  catalogId?: string | null;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  /** Above the assistant drawer (opened from a chat). */
  onTop?: boolean;
  onOpen?: () => void;
}

/**
 * A link to a publication. Its address is the publication page (`/entries/:id`), so middle-click,
 * Ctrl/⌘-click, "Copy link address" and a new tab all get the canonical page; a plain click opens the
 * dialog over the current page instead, keeping the list and its scroll. Hover, focus and touch warm the
 * cache, so the dialog usually opens with no request at all.
 */
const EntryLink = forwardRef<HTMLAnchorElement, IEntryLink>(
  ({ entryId, catalogId, children, className, onTop, onOpen, ...rest }, ref) => {
    const dialog = useEntryDialog();
    const prefetch = () => prefetchEntry(entryId, catalogId);

    const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
      // Let the browser handle new-tab / new-window / download gestures on the real address.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      dialog.open(entryId, { catalogId, onTop });
      onOpen?.();
    };

    return (
      <Link
        ref={ref}
        to={entryPath(entryId, { catalogId })}
        onClick={onClick}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        className={className}
        aria-label={rest['aria-label']}
      >
        {children}
      </Link>
    );
  },
);
EntryLink.displayName = 'EntryLink';

export default EntryLink;
