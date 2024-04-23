import useAxios from '../axios/useAxios';

const useDeleteEntry = () => {
  const axios = useAxios();

  const deleteEntry = async (entryId: string) => {
    const DELETE_ENTRY_URL = `/api/v1/catalogs/${
      import.meta.env.ELVIRA_CATALOG_ID
    }/entries/${entryId}`;

    await axios.delete(DELETE_ENTRY_URL);
  };

  return deleteEntry;
};

export default useDeleteEntry;
