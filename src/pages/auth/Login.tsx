import { ChangeEvent, FormEvent, InvalidEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/buttons/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IAuthCredentials } from '../../utils/interfaces/auth';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import { CircleLoader } from 'react-spinners';
import ElviraInput from '../../components/inputs/ElviraInput';

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
    <div className='flex w-full flex-col justify-center items-center p-4'>
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
              <CircleLoader color={STUColor} size={50} />
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
              <Button type='submit' title={t('login.loginBtn')} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
