import { IMyShelfPostResponse } from '../../../utils/interfaces/my-shelf';
import useAxios from '../axios/useAxios';

const useAddToShelf = () => {
  const axios = useAxios();

  const addToShelf = async (entryId: string): Promise<IMyShelfPostResponse> => {
    // Add entry to my shelf
    const ADD_TO_SHELF_URL = '/api/v1/shelf-records';
    const { data: shelfEntry } = await axios.post<IMyShelfPostResponse>(
      ADD_TO_SHELF_URL,
      {
        entry_id: entryId,
      }
    );

    return shelfEntry;
  };

  return addToShelf;
};

export default useAddToShelf;
