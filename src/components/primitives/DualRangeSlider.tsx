import { ChangeEvent, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onFinish?: () => void;
  className?: string;
}

const THUMB_CLASSES = `
  absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-full m-0 appearance-none bg-transparent pointer-events-none
  [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-darkGray dark:[&::-webkit-slider-thumb]:bg-white
  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
  [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:cursor-pointer
  [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none
  [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:bg-darkGray dark:[&::-moz-range-thumb]:bg-white
  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
  [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:cursor-pointer
`;

/** Two overlaid native range inputs (track hidden, only thumbs clickable) driving a single [from, to] value. */
export default function DualRangeSlider({ min, max, value, onChange, onFinish, className }: DualRangeSliderProps) {
  const span = Math.max(max - min, 1);
  const [from, to] = value;
  const fromPct = ((from - min) / span) * 100;
  const toPct = ((to - min) / span) * 100;

  const handleFromChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onChange([Math.min(Number(e.target.value), to), to]);
  }, [to, onChange]);

  const handleToChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onChange([from, Math.max(Number(e.target.value), from)]);
  }, [from, onChange]);

  return (
    <div className={twMerge('relative flex h-4 w-full items-center', className)}>
      <div className="absolute h-1.5 w-full rounded-full bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.15)]" />
      <div
        className="absolute h-1.5 rounded-full bg-primary"
        style={{ left: `${fromPct}%`, right: `${100 - toPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={from}
        onChange={handleFromChange}
        onMouseUp={onFinish}
        onTouchEnd={onFinish}
        aria-label="minimum"
        className={twMerge(THUMB_CLASSES, 'z-10')}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={to}
        onChange={handleToChange}
        onMouseUp={onFinish}
        onTouchEnd={onFinish}
        aria-label="maximum"
        className={twMerge(THUMB_CLASSES, 'z-20')}
      />
    </div>
  );
}
