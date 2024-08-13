import useAxios from '../axios/useAxios';

const useCreateEntryAcquistion = () => {
  const axios = useAxios();

  const createEntryAcquisition = async (
    acquisition: FormData,
    entryId: string
  ) => {
    console.log(acquisition.get('content'));
    // Create user acquistion
    const CREATE_ENTRY_ACQUISITION_URL = `/api/v1/catalogs/${
      import.meta.env.ELVIRA_CATALOG_ID
    }/entries/${entryId}`;

    await axios.post(CREATE_ENTRY_ACQUISITION_URL, acquisition, {
      headers: {
        'Content-Type': undefined,
      },
    });
  };

  return createEntryAcquisition;
};

export default useCreateEntryAcquistion;
