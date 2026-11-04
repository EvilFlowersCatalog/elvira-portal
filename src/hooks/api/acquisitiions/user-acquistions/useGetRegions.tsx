import type { IRegion } from '@evilflowers/evilflowersviewer';
import useAxios from '../../useAxios';
import useAuthContext from '../../../contexts/useAuthContext';
import { withAccessToken } from '../../../../utils/func/functions';

/** A region as `GET /api/v1/user-acquisitions/{id}/regions` returns it (IP-018). */
interface IRegionResponse {
  id: string;
  kind: IRegion['kind'];
  page: number;
  bbox: IRegion['bbox'];
  caption: string | null;
  category: string | null;
  markdown: string | null;
  latex: string | null;
  image_url: string | null;
}

/** Figures, tables and equations the catalog extracted on one reader page. */
const useGetRegions = () => {
  const axios = useAxios();
  const { auth } = useAuthContext();

  const getRegions = async (userAcquisitionId: string, page: number): Promise<IRegion[]> => {
    const { data } = await axios.get<{ response: { items: IRegionResponse[] } }>(
      `/api/v1/user-acquisitions/${userAcquisitionId}/regions`,
      { params: { page } }
    );
    return data.response.items.map((region) => ({
      id: region.id,
      kind: region.kind,
      page: region.page,
      bbox: region.bbox,
      caption: region.caption,
      category: region.category,
      markdown: region.markdown,
      latex: region.latex,
      // The crop is loaded by an <img>, which cannot send the bearer header.
      imageUrl: withAccessToken(region.image_url, auth?.token),
    }));
  };

  return getRegions;
};

export default useGetRegions;
