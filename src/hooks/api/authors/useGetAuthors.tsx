import { IAuthorsList } from '../../../utils/interfaces/author';
import useAxios from '../useAxios';

interface IAuthorQuery {
  page?: number;
  limit?: number;
  paginate: boolean;
}

const useGetAuthors = () => {
  const axios = useAxios();

  const getAuthors = async ({
    page,
    limit,
    paginate = false,
  }: IAuthorQuery) => {
    const GET_AUTHORS_URL = '/api/v1/authors';
    const params = new URLSearchParams();
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
