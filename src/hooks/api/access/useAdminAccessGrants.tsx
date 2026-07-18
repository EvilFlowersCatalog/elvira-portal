import { Metadata } from '../../../utils/interfaces/general/general';
import useAxios from '../useAxios';

export interface IAccessGrant {
  id: string;
  type: string;
  range: string | null;
  user?: { id: string; username: string; name: string; surname: string };
  acquisition?: { relation: string; mime: string; url: string };
  entry?: { id: string; title: string };
  expire_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAccessGrantListParams {
  user_id?: string;
  acquisition_id?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const useListAccessGrants = () => {
  const axios = useAxios();
  return async (opts: IAccessGrantListParams): Promise<{ items: IAccessGrant[]; metadata: Metadata }> => {
    const params = new URLSearchParams();
    if (opts.page) {
      params.set('page', String(opts.page));
      params.set('limit', String(opts.limit ?? 10));
    } else {
      params.set('paginate', 'false');
    }
    if (opts.user_id) params.set('user_id', opts.user_id);
    if (opts.acquisition_id) params.set('acquisition_id', opts.acquisition_id);
    if (opts.type) params.set('type', opts.type);
    const { data } = await axios.get<{ items: IAccessGrant[]; metadata: Metadata }>('/api/v1/user-acquisitions', {
      params,
    });
    return { items: data.items, metadata: data.metadata };
  };
};

export const useRevokeAccessGrant = () => {
  const axios = useAxios();
  return async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/user-acquisitions/${id}`);
  };
};
