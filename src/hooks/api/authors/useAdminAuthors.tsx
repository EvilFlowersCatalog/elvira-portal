import { Metadata } from '../../../utils/interfaces/general/general';
import { IAuthor } from '../../../utils/interfaces/author';
import useAxios from '../useAxios';

export interface IAuthorListParams {
  catalog_id?: string;
  name?: string;
  surname?: string;
  query?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
}

export interface IAuthorPayload {
  name: string;
  surname: string;
  catalog_id: string;
}

export const useListAuthors = () => {
  const axios = useAxios();
  return async (opts: IAuthorListParams): Promise<{ items: IAuthor[]; metadata: Metadata }> => {
    const params = new URLSearchParams();
    if (opts.page) {
      params.set('page', String(opts.page));
      params.set('limit', String(opts.limit ?? 10));
    } else {
      params.set('paginate', 'false');
    }
    if (opts.catalog_id) params.set('catalog_id', opts.catalog_id);
    if (opts.query) params.set('query', opts.query);
    if (opts.name) params.set('name', opts.name);
    if (opts.surname) params.set('surname', opts.surname);
    if (opts.orderBy) params.set('order_by', opts.orderBy);
    const { data } = await axios.get<{ items: IAuthor[]; metadata: Metadata }>('/api/v1/authors', { params });
    return { items: data.items, metadata: data.metadata };
  };
};

export const useCreateAuthor = () => {
  const axios = useAxios();
  return async (payload: IAuthorPayload): Promise<IAuthor> => {
    const { data } = await axios.post<{ response: IAuthor }>('/api/v1/authors', payload);
    return data.response;
  };
};

export const useUpdateAuthor = () => {
  const axios = useAxios();
  return async (id: string, payload: IAuthorPayload): Promise<IAuthor> => {
    const { data } = await axios.put<{ response: IAuthor }>(`/api/v1/authors/${id}`, payload);
    return data.response;
  };
};

export const useDeleteAuthor = () => {
  const axios = useAxios();
  return async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/authors/${id}`);
  };
};
