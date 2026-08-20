import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo } from 'react-icons/fi';

interface PopupInfoProps {
  children: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
}

const PopupInfo = ({ children, label, icon }: PopupInfoProps) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Bubble is portalled to <body> so it can't be clipped by an ancestor's
  // overflow:hidden (e.g. #outlet-wrapper) — position it in viewport
  // coordinates instead of relying on a positioned ancestor.
  const updateCoords = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current && !anchorRef.current.contains(target) &&
        bubbleRef.current && !bubbleRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={anchorRef}
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
        {icon ?? <FiInfo size={16} />}
      </button>
      {open && coords && createPortal(
        <div
          ref={bubbleRef}
          className='fixed z-50'
          style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, -100%)' }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className='w-64 bg-primaryLight dark:bg-zinc-700 border border-[#e5e5e5] dark:border-zinc-600 rounded-[8px] px-3 py-3 shadow text-[12px] text-darkGray dark:text-zinc-200 leading-[1.4] text-left relative'>
            {children}
            <span className='absolute top-full left-1/2 -translate-x-1/2 block w-[8px] h-[8px] bg-primaryLight dark:bg-zinc-700 border-b border-r border-[#e5e5e5] dark:border-zinc-600 rotate-45 -mt-[5px]' />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PopupInfo;
