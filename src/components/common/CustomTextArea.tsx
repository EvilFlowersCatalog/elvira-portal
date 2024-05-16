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
      <label className='w-full italic text-xs pl-1' htmlFor={id}>
        {required ? t('input.required') : t('input.notRequired')}
      </label>
      <textarea
        className='resize-none w-full h-full min-h-72 p-2 rounded-md bg-white dark:bg-gray border-2 border-white dark:border-darkGray outline-none focus:border-STUColor dark:focus:border-STUColor'
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
