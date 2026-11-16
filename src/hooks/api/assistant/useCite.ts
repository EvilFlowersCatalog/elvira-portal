import { useQuery } from '@tanstack/react-query';
import useAxios from '../useAxios';
import { CiteStyle, IAssistantCitation, ICiteReference } from '../../../utils/interfaces/assistant';

/** The catalog's cap per request (`reading.MAX_REFERENCES`). */
export const MAX_CITE_URIS = 50;

/**
 * The addresses to cite for these citations, in order, each once: the citation's `uri`, else its `/cite` link.
 * Citations without either (older turns, `[[page:N]]`) cannot be cited and are left out.
 */
export const citeUris = (citations: IAssistantCitation[]): string[] => {
  const uris: string[] = [];
  for (const citation of citations) {
    const uri = citation.uri || (citation.url && /^(https?:\/\/[^/]+)?\/cite\//.test(citation.url) ? citation.url : '');
    if (uri && !uris.includes(uri)) uris.push(uri);
  }
  return uris.slice(0, MAX_CITE_URIS);
};

/** The text a reference copies as: the formatted string, or the CSL-JSON item pretty-printed. */
export const referenceText = (reference: ICiteReference): string =>
  reference.text ?? (reference.csl ? JSON.stringify(reference.csl, null, 2) : '');

/**
 * Formatted references for citation addresses (`POST /api/v1/cite`, EvilFlowersCatalog#186), the MCP `cite`
 * tool's payload. One address the reader may not see fails the whole request (404), so only addresses the
 * assistant's own citations carry are sent. Deterministic: cached per addresses and style.
 */
const useCite = (uris: string[], style: CiteStyle, enabled: boolean) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['cite', style, uris],
    queryFn: async ({ signal }): Promise<ICiteReference[]> => {
      const { data } = await axios.post<{ response: { references?: ICiteReference[] } }>(
        '/api/v1/cite',
        { uris, style },
        { signal },
      );
      const references = data.response?.references;
      return Array.isArray(references)
        ? references.filter((r) => !!r && typeof r.uri === 'string' && (typeof r.text === 'string' || !!r.csl))
        : [];
    },
    enabled: enabled && uris.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

export default useCite;
