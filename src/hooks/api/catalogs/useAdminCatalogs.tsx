import { Metadata } from '../../../utils/interfaces/general/general';
import { ICatalog, ICatalogPayload } from '../../../utils/interfaces/catalog';
import useAxios from '../useAxios';

export interface ICatalogListParams {
  title?: string;
  url_name?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
}

/** Admin catalog CRUD (paginated list + detail + create/update/delete). */
export const useListCatalogs = () => {
  const axios = useAxios();
  return async (opts: ICatalogListParams): Promise<{ items: ICatalog[]; metadata: Metadata }> => {
    const params = new URLSearchParams();
    if (opts.page) {
      params.set('page', String(opts.page));
      params.set('limit', String(opts.limit ?? 10));
    } else {
      params.set('paginate', 'false');
    }
    if (opts.title) params.set('title', opts.title);
    if (opts.url_name) params.set('url_name', opts.url_name);
    if (opts.orderBy) params.set('order_by', opts.orderBy);
    const { data } = await axios.get<{ items: ICatalog[]; metadata: Metadata }>('/api/v1/catalogs', { params });
    return { items: data.items, metadata: data.metadata };
  };
};

export const useGetCatalogDetail = () => {
  const axios = useAxios();
  return async (id: string): Promise<ICatalog> => {
    const { data } = await axios.get<{ response: ICatalog }>(`/api/v1/catalogs/${id}`);
    return data.response;
  };
};

export const useCreateCatalog = () => {
  const axios = useAxios();
  return async (payload: ICatalogPayload): Promise<ICatalog> => {
    const { data } = await axios.post<{ response: ICatalog }>('/api/v1/catalogs', payload);
    return data.response;
  };
};

export const useUpdateCatalog = () => {
  const axios = useAxios();
  return async (id: string, payload: ICatalogPayload): Promise<ICatalog> => {
    const { data } = await axios.put<{ response: ICatalog }>(`/api/v1/catalogs/${id}`, payload);
    return data.response;
  };
};

export const useDeleteCatalog = () => {
  const axios = useAxios();
  return async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/catalogs/${id}`);
  };
};
