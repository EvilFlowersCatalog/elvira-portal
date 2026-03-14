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
import FormModal from '../../components/modals/FormModal';
import LicenseTerms from '../../components/dialogs/LicenseTerms';

const Auth = () => {
  const { login , staySigned, setStaySigned} = useAuthContext();
  const { theme, titleLogoDark, titleLogoLight, umamiTrack } =
    useAppContext();
  const { cookies, setCookie } = useCookiesContext();

  const { t } = useTranslation();
  const [loginForm, setLoginForm] = useState<IAuthCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [licenseChecked, setLicenseChecked] = useState<boolean>(
    cookies[COOKIES_TYPE.LICENSE_KEY] ?? false
  );
  const [checLicensekInvalid, setCheckLicenseInvalid] = useState<boolean>(false);
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

  const handleLicenseCheckChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckLicenseInvalid(false);
    setCookie(COOKIES_TYPE.LICENSE_KEY, e.target.checked, {
      maxAge: 60 * 60 * 24 * 365, // year
    });
    setLicenseChecked(e.target.checked);
  };

  const handleLicenseCheckInvalid = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCheckLicenseInvalid(true);
  };

  return (
    <>
      {openLicenseModal && (
        <LicenseTerms setOpenLicenseModal={setOpenLicenseModal} />
      )}
      <div className='flex w-full flex-1 flex-col justify-center items-center p-4'>
        <div className='flex flex-col p-5 h-[500px] w-full max-w-[700px] justify-evenly items-center rounded-md'>
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
                <CircleLoader color={'var(--color-primary)'} size={50} />
              </div>
            ) : (
              <form
                className='flex flex-col gap-4 md:w-3/4 items-center'
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
                    className='pr-12'
                  />
                  <button
                    className='absolute top-[26px] right-1 p-2'
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
                <div className='w-full'>

                  <div className='flex w-full gap-2 items-center'>
                    <Checkbox
                      size='small'
                      required
                      checked={licenseChecked}
                      onChange={handleLicenseCheckChange}
                      onInvalid={handleLicenseCheckInvalid}
                      sx={{
                        color: checLicensekInvalid ? 'red' : 'var(--color-primary)',
                        '&.Mui-checked': {
                          color: checLicensekInvalid ? 'red' : 'var(--color-primary)',
                        },
                      }}
                    />
                    <button
                      type='button'
                      onClick={() => setOpenLicenseModal(true)}
                      className={`hover:underline text-sm cursor-pointer text-left ${
                        checLicensekInvalid ? 'text-red' : 'text-black dark:text-white'
                      }`}
                    >
                      {t('login.license')}
                    </button>
                  </div>
                  <div className='flex w-full gap-2 items-center'>
                    <Checkbox
                      size='small'
                      checked={staySigned}
                      onChange={(e, checked)=>setStaySigned(checked)}
                      sx={{
                        color: 'var(--color-primary)',
                        '&.Mui-checked': {
                          color: 'var(--color-primary)',
                        },
                      }}
                    />
                    <p onClick={()=>{setStaySigned(!staySigned)}}
                      className={`text-sm cursor-pointer text-left text-black dark:text-white`}
                    >
                      {t('login.stayLogged')}
                    </p>
                  </div>

                </div>
                <Button type='submit'>{t('login.loginBtn')}</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
