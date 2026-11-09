import useAxios from '../useAxios';
import useAuthContext from '../../contexts/useAuthContext';
import { withAccessToken } from '../../../utils/func/functions';

/** A publication similar to another, by the extraction index (IP-018 Phase 8). */
export interface ISimilarEntry {
  entry_id: string;
  /** Cosine similarity, 0-1. */
  score: number;
}

/** A figure of an open-access entry, for its detail page. */
export interface IEntryFigure {
  id: string;
  kind: 'figure' | 'table' | 'equation';
  page: number;
  caption: string | null;
  printed_caption: string | null;
  description: string | null;
  category: string | null;
  /** Carries the access token, so an <img> can load it. */
  image_url: string | null;
}

/**
 * Recommendations and figures. Entry similarity uses the entry's own vector and
 * works for every entry (catalog IP-021); passage similarity and figures come
 * from the extraction index and stay empty until a PDF is processed.
 */
const useSimilarEntries = () => {
  const axios = useAxios();
  const { auth } = useAuthContext();

  /** Publications similar to an entry as a whole. */
  const getSimilarToEntry = async (entryId: string, limit = 8): Promise<ISimilarEntry[]> => {
    const { data } = await axios.get<{ response: ISimilarEntry[] }>(`/api/v1/entries/${entryId}/similar`, {
      params: { limit },
    });
    return data.response;
  };

  /** Publications that discuss a passage of the reader's copy (the viewer's "Podobné"). */
  const getSimilarToPassage = async (userAcquisitionId: string, text: string, limit = 8): Promise<ISimilarEntry[]> => {
    const { data } = await axios.post<{ response: ISimilarEntry[] }>(
      `/api/v1/user-acquisitions/${userAcquisitionId}/similar`,
      { text },
      { params: { limit } }
    );
    return data.response;
  };

  /** Figures of an open-access entry; none for entries lent through Readium LCP. */
  /** Figures, tables and equations, in reading order (the API serves one kind per call). */
  const getEntryFigures = async (entryId: string): Promise<IEntryFigure[]> => {
    const kinds: IEntryFigure['kind'][] = ['figure', 'table', 'equation'];
    const lists = await Promise.all(
      kinds.map(async (kind) => {
        try {
          const { data } = await axios.get<{ response: IEntryFigure[] }>(`/api/v1/entries/${entryId}/figures`, {
            params: { kind },
          });
          return data.response;
        } catch {
          return [];
        }
      })
    );
    return lists
      .flat()
      .sort((a, b) => a.page - b.page)
      .map((figure) => ({ ...figure, image_url: withAccessToken(figure.image_url, auth?.token) }));
  };

  return { getSimilarToEntry, getSimilarToPassage, getEntryFigures };
};

export default useSimilarEntries;
