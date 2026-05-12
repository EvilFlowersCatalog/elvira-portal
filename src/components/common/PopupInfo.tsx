import { useEffect, useRef, useState } from 'react';
import { FiInfo } from 'react-icons/fi';

interface PopupInfoProps {
  children: React.ReactNode;
  label?: string;
}

const PopupInfo = ({ children, label }: PopupInfoProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={ref}
      className='relative inline-flex items-center'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='text-secondary dark:text-secondaryLight opacity-60 hover:opacity-100 transition-opacity'
        aria-label={label}
      >
        <FiInfo size={16} />
      </button>
      {open && (
        <div className='absolute bottom-full left-1/2 -translate-x-1/2 pb-2 z-20'>
          <div className='w-64 bg-primaryLight dark:bg-zinc-700 border border-[#e5e5e5] dark:border-zinc-600 rounded-[8px] px-3 py-3 shadow text-[12px] text-darkGray dark:text-zinc-200 leading-[1.4] text-left relative'>
            {children}
            <span className='absolute top-full left-1/2 -translate-x-1/2 block w-[8px] h-[8px] bg-primaryLight dark:bg-zinc-700 border-b border-r border-[#e5e5e5] dark:border-zinc-600 rotate-45 -mt-[5px]' />
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupInfo;
