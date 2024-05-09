import { ChangeEvent, FormEvent, InvalidEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IAuthCredentials } from '../../utils/interfaces/auth';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import { CircleLoader } from 'react-spinners';

const Login = () => {
  const { login } = useAuthContext();
  const { STUColor, theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { t } = useTranslation();
  const [loginForm, setLoginForm] = useState<IAuthCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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

    setLoading(true); // show loader

    // Login
    await login(loginForm);

    setLoading(false); // hide loader
  };

  return (
    <div className='flex flex-1 flex-col justify-center items-center p-4 pt-16 lg:pt-4'>
      <div className='flex flex-col p-5 h-1/2 min-h-96 w-full md:w-2/3 lg:w-4/6 xl:w-3/5 xxl:w-2/5 bg-zinc-100 dark:bg-darkGray justify-evenly items-center rounded-md'>
        <div className='flex flex-col h-1/2 items-center justify-center gap-2'>
          <img
            className='w-96'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt='Elvira-title-logo'
          />
          <span className='text-lg'>{t('login.digitalLibrary')}</span>
        </div>
        <div className='flex w-full h-1/2 justify-center items-start'>
          {loading ? (
            <div className='flex h-full justify-center items-center'>
              <CircleLoader color={STUColor} size={50} />
            </div>
          ) : (
            <form
              className='flex flex-col gap-5 w-full items-center'
              onSubmit={submit}
            >
              <input
                name='username'
                className='w-3/4 lg:w-2/4 p-2 rounded-md bg-zinc-white dark:bg-gray border-2 border-zinc-100 dark:border-darkGray outline-none focus:border-STUColor dark:focus:border-STUColor'
                value={loginForm.username}
                type='text'
                placeholder={t('login.username')}
                onChange={handleUsername}
                required
                onInvalid={(e: InvalidEvent<HTMLInputElement>) => {
                  e.target.setCustomValidity(
                    t('login.requiredMessage.username')
                  );
                }}
              />
              <div className='relative w-3/4 lg:w-2/4 flex items-center'>
                <input
                  name='password'
                  className='w-full border-2 border-zinc-100 dark:border-darkGray focus:border-STUColor dark:focus:border-STUColor p-2 outline-none bg-white dark:bg-gray rounded-md'
                  value={loginForm.password}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.password')}
                  onChange={handlePassword}
                  required
                  onInvalid={(e: InvalidEvent<HTMLInputElement>) =>
                    e.target.setCustomValidity(
                      t('login.requiredMessage.password')
                    )
                  }
                />
                <button
                  className='absolute right-3 '
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
              <Button type='submit'>
                <span>{t('login.loginBtn')}</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
