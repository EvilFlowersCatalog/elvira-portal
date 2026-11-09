import { IAuthorsList } from '../../../utils/interfaces/author';
import useAxios from '../useAxios';

interface IAuthorQuery {
  page?: number;
  limit?: number;
  paginate: boolean;
  /** Defaults to this build's catalog: authors belong to one catalog. */
  catalogId?: string;
}

const useGetAuthors = () => {
  const axios = useAxios();

  const getAuthors = async ({
    page,
    limit,
    paginate = false,
    catalogId = import.meta.env.ELVIRA_CATALOG_ID,
  }: IAuthorQuery) => {
    const GET_AUTHORS_URL = '/api/v1/authors';
    const params = new URLSearchParams();
    // Without it the form loads every author of every catalog (838 on dev) for
    // suggestions the user can't pick anyway.
    if (catalogId) params.set('catalog_id', catalogId);
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    params.set('paginate', paginate.toString());

    const { data: authors } = await axios.get<IAuthorsList>(GET_AUTHORS_URL, {
      params,
    });

    return authors;
  };

  return getAuthors;
};

export default useGetAuthors;
