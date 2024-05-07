import { ChangeEvent, InvalidEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { uuid } from '../../utils/func/functions';

interface ICustomTextAreaParams {
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder: string;
  value: string;
}
// Custom textarea used in steps in AMDIN
const CustomTextArea = ({
  onChange,
  placeholder,
  required = false,
  value,
}: ICustomTextAreaParams) => {
  const { t } = useTranslation();
  const id = uuid();

  return (
    <div className='w-full h-full'>
      <label
        className='w-full text-gray dark:text-lightGray italic text-xs pl-2'
        htmlFor={id}
      >
        {required ? t('input.required') : t('input.notRequired')}
      </label>
      <textarea
        className='w-full h-full resize-none p-2 rounded-md bg-zinc-200 dark:bg-darkGray border border-white dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor text-dark dark:text-white'
        placeholder={placeholder}
        required={required}
        value={value}
        id={id}
        onChange={onChange}
      />
    </div>
  );
};

export default CustomTextArea;
