import { Metadata } from '../../../utils/interfaces/general/general';
import useAxios from '../useAxios';

export interface IApiKey {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  token: string;
}

export interface IApiKeyListParams {
  user_id?: string;
  name?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
}

export interface ICreateApiKeyPayload {
  name?: string;
  user_id?: string;
  is_active?: boolean;
}

export const useListApiKeys = () => {
  const axios = useAxios();
  return async (opts: IApiKeyListParams): Promise<{ items: IApiKey[]; metadata: Metadata }> => {
    const params = new URLSearchParams();
    if (opts.page) {
      params.set('page', String(opts.page));
      params.set('limit', String(opts.limit ?? 10));
    } else {
      params.set('paginate', 'false');
    }
    if (opts.user_id) params.set('user_id', opts.user_id);
    if (opts.name) params.set('name', opts.name);
    if (opts.orderBy) params.set('order_by', opts.orderBy);
    const { data } = await axios.get<{ items: IApiKey[]; metadata: Metadata }>('/api/v1/api_keys', { params });
    return { items: data.items, metadata: data.metadata };
  };
};

export const useCreateApiKey = () => {
  const axios = useAxios();
  return async (payload: ICreateApiKeyPayload): Promise<IApiKey> => {
    const { data } = await axios.post<{ response: IApiKey }>('/api/v1/api_keys', payload);
    return data.response;
  };
};

export const useDeleteApiKey = () => {
  const axios = useAxios();
  return async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/api_keys/${id}`);
  };
};
