import { ChangeEvent, FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/buttons/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IAuthCredentials } from '../../utils/interfaces/auth';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import {
  COOKIES_TYPE,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import { CircleLoader } from 'react-spinners';
import ElviraInput from '../../components/inputs/ElviraInput';
import { Checkbox } from '@mui/material';
import useCookiesContext from '../../hooks/contexts/useCookiesContext';
import ModalWrapper from '../../components/modal/ModalWrapper';
import LicenseTerms from '../../components/dialogs/LicenseTerms';

const Auth = () => {
  const { login } = useAuthContext();
  const { stuColor, theme, titleLogoDark, titleLogoLight, umamiTrack } =
    useAppContext();
  const { cookies, setCookie } = useCookiesContext();

  const { t } = useTranslation();
  const [loginForm, setLoginForm] = useState<IAuthCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(
    cookies[COOKIES_TYPE.LICENSE_KEY] ?? false
  );
  const [checkInvalid, setCheckInvalid] = useState<boolean>(false);
  const [openLicenseModal, setOpenLicenseModal] = useState<boolean>(false);

  // Handle usernamen input change
  const handleUsername = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity('');
    setLoginForm((prevForm) => ({
      ...prevForm,
      username: event.target.value,
    }));
  };

  // Handle password input change
  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity('');
    setLoginForm((prevForm) => ({
      ...prevForm,
      password: event.target.value,
    }));
  };

  // Submit form function to log in user
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevent default (reload in form)
    umamiTrack('Login Button');

    setLoading(true); // show loader

    // Login
    await login(loginForm);

    setLoading(false); // hide loader
  };

  const handleCheckChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckInvalid(false);
    setCookie(COOKIES_TYPE.LICENSE_KEY, e.target.checked, {
      maxAge: 60 * 60 * 24 * 365, // year
    });
    setChecked(e.target.checked);
  };

  const handleCheckkInvalid = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCheckInvalid(true);
  };

  return (
    <>
      {openLicenseModal && (
        <LicenseTerms setOpenLicenseModal={setOpenLicenseModal} />
      )}
      <div className='flex w-full flex-1 flex-col justify-center items-center p-4'>
        <div className='flex flex-col p-5 h-[500px] w-full md:w-2/3 lg:w-4/6 xl:w-3/5 xxl:w-2/5 bg-zinc-100 dark:bg-darkGray justify-evenly items-center rounded-md'>
          <div className='flex flex-col items-center justify-center gap-2'>
            <img
              className='w-96'
              src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
              alt='Elvira Logo'
            />
            <span className='text-lg'>{t('login.digitalLibrary')}</span>
          </div>
          <div className='flex w-full h-fit justify-center items-start'>
            {loading ? (
              <div className='flex h-full justify-center items-center'>
                <CircleLoader color={stuColor} size={50} />
              </div>
            ) : (
              <form
                className='flex flex-col gap-4 w-3/4 items-center'
                onSubmit={submit}
              >
                <ElviraInput
                  value={loginForm.username}
                  onChange={handleUsername}
                  placeholder={t('login.username')}
                  invalidMessage={t('login.requiredMessage.username')}
                  required
                />
                <div className='relative w-full flex'>
                  <ElviraInput
                    value={loginForm.password}
                    onChange={handlePassword}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.password')}
                    invalidMessage={t('login.requiredMessage.password')}
                    required
                  />
                  <button
                    className='absolute top-[31px] -right-7'
                    type='button'
                    onClick={() => setShowPassword((prevShow) => !prevShow)}
                  >
                    {showPassword ? (
                      <FaEye size={20} />
                    ) : (
                      <FaEyeSlash size={20} />
                    )}
                  </button>
                </div>
                <div className='flex w-full gap-2 items-center'>
                  <Checkbox
                    size='small'
                    required
                    checked={checked}
                    onChange={handleCheckChange}
                    onInvalid={handleCheckkInvalid}
                    sx={{
                      color: checkInvalid ? 'red' : stuColor,
                      '&.Mui-checked': {
                        color: checkInvalid ? 'red' : stuColor,
                      },
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => setOpenLicenseModal(true)}
                    className={`hover:underline text-sm cursor-pointer text-left ${
                      checkInvalid ? 'text-red' : 'text-black dark:text-white'
                    }`}
                  >
                    {t('login.license')}
                  </button>
                </div>
                <Button type='submit' title={t('login.loginBtn')} />
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
