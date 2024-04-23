import { IAuthorsList } from '../../../utils/interfaces/author';
import useAxios from '../axios/useAxios';

const useGetAuthors = () => {
  const axios = useAxios();

  const getAuthors = async (page: number, limit: number) => {
    const GET_AUTHORS_URL = '/api/v1/authors';
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const { data: authors } = await axios.get<IAuthorsList>(GET_AUTHORS_URL, {
      params,
    });

    return authors;
  };

  return getAuthors;
};

export default useGetAuthors;
