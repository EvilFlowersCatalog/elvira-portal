import useAxios from '../useAxios';

interface ISetUserPassphraseParams {
  userId: string;
  passphrase: string;
}

const useSetUserPassphrase = () => {
  const axios = useAxios();

  const setUserPassphrase = async ({
    userId,
    passphrase,
  }: ISetUserPassphraseParams) => {
    const SET_USER_PASSPHRASE_URL = '';

    if (!SET_USER_PASSPHRASE_URL) {
      throw new Error('Not implemented: missing passphrase endpoint URL.');
    }

    await axios.post(SET_USER_PASSPHRASE_URL, {
      user_id: userId,
      passphrase,
    });
  };

  return setUserPassphrase;
};

export default useSetUserPassphrase;
