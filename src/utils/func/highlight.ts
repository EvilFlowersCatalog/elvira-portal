/**
 * Keep only `<mark>` / `</mark>` of a search highlight. The catalog already
 * HTML-escapes highlights and `<mark>` is its only markup; this is defence in
 * depth, not the escaping itself.
 */
export const sanitizeHighlight = (html: string): string => html.replace(/<(?!\/?mark>)[^>]*>/gi, '');
