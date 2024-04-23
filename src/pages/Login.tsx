import { ChangeEvent, FormEvent, InvalidEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import titleLogoLight from '../assets/images/elvira-logo/title-logo-light.png';
import useAppContext from '../hooks/useAppContext';
import { IAuthCredentials } from '../utils/interfaces/auth';
import useVerifyCredentials from '../hooks/api/verify/useVerifyCredentials';
import useAuthContext from '../hooks/useAuthContext';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';

const Login = () => {
  const { setShowLoader } = useAppContext();
  const { login } = useAuthContext();
  const { t } = useTranslation();
  const [loginForm, setLoginForm] = useState<IAuthCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const verifyCredentials = useVerifyCredentials();
  const location = useLocation();
  const navigate = useNavigate();

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
    setShowLoader(true); // Show loader

    try {
      const { response: user } = await verifyCredentials(loginForm); // verify given credentials

      // Set auth with given values
      login({
        userId: user.user.id,
        username: user.user.username,
        isSuperUser: user.user.is_superuser,
        token: user.access_token,
        refreshToken: user.refresh_token,
      });

      // Get where the user lastly was / if does not exist, go to home
      const pathname = location.state?.from?.pathname ?? NAVIGATION_PATHS.home;
      const params = location.state?.from?.search ?? '';

      const from = pathname + params;

      // Navigate to where was user lastly or to library
      navigate(from, { replace: true });
    } catch {
      toast.error(t('notifications.login.error'));
    } finally {
      setShowLoader(false); // hide loader
    }
  };

  return (
    <div className='main-body-without-search border flex flex-col justify-center items-center'>
      <div className='flex flex-col p-5 h-3/6 min-h-96 w-[95%] lg:w-4/6 xl:w-3/5 xxl:w-2/5 bg-darkGray dark:bg-darkGray justify-evenly items-center rounded-md'>
        <div className='flex flex-col items-center gap-2'>
          <img className='w-96' src={titleLogoLight} alt='Elvira-title-logo' />
          <span className='text-white text-lg'>
            {t('login.digitalLibrary')}
          </span>
        </div>
        <form
          className='flex flex-col gap-5 w-full items-center'
          onSubmit={submit}
        >
          <input
            name='username'
            className='w-3/4 lg:w-2/4 border-2 border-darkGray  focus:border-STUColor py-2 px-5 outline-none bg-white text-black  rounded-md'
            value={loginForm.username}
            type='text'
            placeholder={t('login.username')}
            onChange={handleUsername}
            required
            onInvalid={(e: InvalidEvent<HTMLInputElement>) => {
              e.target.setCustomValidity(t('login.requiredMessage.username'));
            }}
          />
          <div className='relative w-3/4 lg:w-2/4 flex items-center text-black'>
            <input
              name='password'
              className='w-full border-2 border-darkGray focus:border-STUColor py-2 px-5 outline-none bg-white rounded-md'
              value={loginForm.password}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.password')}
              onChange={handlePassword}
              required
              onInvalid={(e: InvalidEvent<HTMLInputElement>) =>
                e.target.setCustomValidity(t('login.requiredMessage.password'))
              }
            />
            <button
              className='absolute right-3 '
              type='button'
              onClick={() => setShowPassword((prevShow) => !prevShow)}
            >
              {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
            </button>
          </div>
          <Button type='submit'>
            <span>{t('login.loginBtn')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
