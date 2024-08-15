import useAxios from '../useAxios';

const useRemoveFromShelf = () => {
  const axios = useAxios();

  const removeFromShelf = async (shelfId: string): Promise<void> => {
    // Delete from my shelf
    const REMOVE_FROM_SHELF_URL = `/api/v1/shelf-records/${shelfId}`;
    await axios.delete(REMOVE_FROM_SHELF_URL);
  };

  return removeFromShelf;
};

export default useRemoveFromShelf;
