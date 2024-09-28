import { forwardRef, TextareaHTMLAttributes, useState } from 'react';
import { uuid } from '../../utils/func/functions';
import useAppContext from '../../hooks/contexts/useAppContext';

interface CustomTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalidMessage?: string;
}
// Custom input used in step forms in ADMIN
const ElviraTextarea = forwardRef<HTMLTextAreaElement, CustomTextareaProps>(
  ({ invalidMessage, ...props }, ref) => {
    const { stuText, stuBorderFocus, stuBorder } = useAppContext();

    const [focus, setFocus] = useState<boolean>(false);
    const id = uuid();

    const { placeholder, value } = props;

    return (
      <div className='relative w-full h-full mt-6'>
        <span
          className={`absolute duration-200 z-10 select-none pointer-events-none ${
            focus || value ? `-top-6 left-0 text-sm ${stuText}` : 'top-2 left-2'
          }`}
        >
          {placeholder}
        </span>
        <textarea
          ref={ref}
          {...props}
          className={`w-full h-full p-2 rounded-md bg-transparent border-2 ${
            value
              ? `${stuBorder}`
              : `${stuBorderFocus} border-black dark:border-white`
          } outline-none`}
          id={id}
          placeholder=''
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      </div>
    );
  }
);

export default ElviraTextarea;
