import useAxios from '../useAxios';

interface ISetUserPassphraseParams {
  userId: string;
  name: string;
  surname: string;
  is_active: boolean;
  lcp_passphrase: string;
  lcp_passphrase_hint: string;
  password?: string;
}

const useSetUserPassphrase = () => {
  const axios = useAxios();

  const setUserPassphrase = async ({
    userId,
    ...payload
  }: ISetUserPassphraseParams) => {
    const SET_USER_PASSPHRASE_URL = `/api/v1/users/${userId}`;

    await axios.put(SET_USER_PASSPHRASE_URL, payload);
  };

  return setUserPassphrase;
};

export default useSetUserPassphrase;
