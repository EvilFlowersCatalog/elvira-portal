import { useEffect } from 'react';
import { IEntryDetail } from '../utils/interfaces/entry';

const MARK = 'data-portal-citation';

/**
 * Highwire `citation_*` tags for the publication on screen, so Zotero / Mendeley connectors can save it
 * (https://www.zotero.org/support/dev/exposing_metadata). Added while mounted, removed on unmount.
 *
 * No `citation_pdf_url`: the file is only reachable through the reader's personal copy, and a URL with a
 * token in the page head would be stored, and synced, by the connector. The reader route publishes its own
 * tags through the viewer (`citationBib`, EvilFlowersViewer#154).
 */
export default function useCitationMeta(entry: IEntryDetail | undefined) {
  useEffect(() => {
    if (!entry) return;
    const tags: [string, string][] = [['citation_title', entry.title]];
    entry.authors.forEach((author) => tags.push(['citation_author', [author.surname, author.name].filter(Boolean).join(', ')]));
    if (entry.published_at) tags.push(['citation_publication_date', entry.published_at.slice(0, 10).replace(/-/g, '/')]);
    if (entry.publisher) tags.push(['citation_publisher', entry.publisher]);
    if (entry.identifiers?.doi) tags.push(['citation_doi', entry.identifiers.doi]);
    if (entry.identifiers?.isbn) tags.push(['citation_isbn', entry.identifiers.isbn]);
    if (entry.language?.alpha2) tags.push(['citation_language', entry.language.alpha2]);

    const elements = tags
      .filter(([, content]) => !!content)
      .map(([name, content]) => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        meta.setAttribute(MARK, '');
        document.head.appendChild(meta);
        return meta;
      });
    // A single-page app has to tell Zotero the page changed.
    document.dispatchEvent(new Event('ZoteroItemUpdated', { bubbles: true, cancelable: true }));

    return () => elements.forEach((meta) => meta.remove());
  }, [entry]);
}
