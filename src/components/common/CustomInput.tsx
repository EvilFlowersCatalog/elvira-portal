import { ChangeEvent, InvalidEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from '../../utils/func/functions';

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
      <label className='w-full italic text-xs pl-1' htmlFor={id}>
        {required ? t('input.required') : t('input.notRequired')}
      </label>

      <input
        className='w-full p-2 rounded-md bg-white dark:bg-gray border-2 border-white dark:border-darkGray outline-none focus:border-STUColor dark:focus:border-STUColor'
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
