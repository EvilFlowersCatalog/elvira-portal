import { useMemo, useState } from 'react';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';

type SummaryTextProps = {
    html: string | null;
    readMoreText: string;
    readLessText: string;
};

const PREVIEW_CHARS = 240;

// Markup the admin WYSIWYG editor produces. Everything else is unwrapped
// (its text kept), and every attribute except a safe link href is dropped.
const ALLOWED_TAGS = new Set([
    'P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'SUB', 'SUP', 'BLOCKQUOTE',
]);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT']);
const BLOCK_TAGS = new Set(['P', 'BR', 'DIV', 'LI', 'UL', 'OL', 'BLOCKQUOTE']);

function cleanNode(node: Element) {
    for (const child of Array.from(node.children)) {
        // SVG/MathML elements report lowercase tagName — normalize before comparing.
        const tag = child.tagName.toUpperCase();
        if (DROPPED_TAGS.has(tag)) {
            child.remove();
            continue;
        }
        cleanNode(child);
        if (!ALLOWED_TAGS.has(tag) || child.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
            child.replaceWith(...Array.from(child.childNodes));
            continue;
        }
        for (const attr of Array.from(child.attributes)) {
            const keep = tag === 'A' && attr.name === 'href' && /^https?:\/\//i.test(attr.value.trim());
            if (!keep) child.removeAttribute(attr.name);
        }
        if (tag === 'A') {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
        }
    }
}

/**
 * Summaries are HTML from imports and from the admin editor, so they reach
 * every reader: sanitize before injecting. DOMParser builds an inert document —
 * nothing in it runs or loads while we walk it.
 */
function parseSummary(raw: string): { html: string; text: string } {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    cleanNode(doc.body);
    // Plain text for the collapsed preview, with block boundaries kept as spaces
    // so "</p><p>" doesn't glue two sentences together.
    const textDoc = doc.body.cloneNode(true) as HTMLElement;
    textDoc.querySelectorAll('*').forEach((el) => {
        if (BLOCK_TAGS.has(el.tagName)) el.append(' ');
    });
    const text = (textDoc.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { html: doc.body.innerHTML, text };
}

export function SummaryText({ html: rawHtml, readMoreText, readLessText }: SummaryTextProps) {
    const [expanded, setExpanded] = useState(false);
    // Entries without a summary come back as null; render nothing rather than crash.
    const { html, text } = useMemo(() => parseSummary(rawHtml ?? ''), [rawHtml]);
    const isLong = text.length > PREVIEW_CHARS;

    return (
        <div className="w-full text-left">
            {expanded || !isLong ? (
                <span className="text-gray-500 dark:text-white" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
                <span className="text-gray-500 dark:text-white">{text.slice(0, PREVIEW_CHARS).trimEnd()}…</span>
            )}
            {isLong && !expanded && (
                <button
                    className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                    onClick={() => setExpanded(true)}
                >
                    <RiAddLine size={24} />
                    {readMoreText}
                </button>
            )}
            {isLong && expanded && (
                <button
                    className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                    onClick={() => setExpanded(false)}
                >
                    <RiCloseLine size={24} />
                    {readLessText}
                </button>
            )}
        </div>
    );
}
