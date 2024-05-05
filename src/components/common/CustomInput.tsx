import { ChangeEvent, InvalidEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from '../../assets/func/functions';

interface ICustomInputParams {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInvalid?: (e: InvalidEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder: string;
  value: string;
}
// Custom input used in step forms in ADMIN
const CustomInput = ({
  onChange,
  onInvalid,
  placeholder,
  required = false,
  value,
}: ICustomInputParams) => {
  const { t } = useTranslation();
  const id = uuid();

  return (
    <div className='w-full text-left'>
      <label
        className='w-full text-gray dark:text-lightGray italic text-xs pl-2'
        htmlFor={id}
      >
        {required ? t('input.required') : t('input.notRequired')}
      </label>

      <input
        className='w-full p-2 rounded-md bg-zinc-200 dark:bg-darkGray border-2 border-white dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor'
        required={required}
        onChange={onChange}
        onInvalid={onInvalid}
        id={id}
        value={value}
        placeholder={placeholder}
      />
    </div>
  );
};

export default CustomInput;
