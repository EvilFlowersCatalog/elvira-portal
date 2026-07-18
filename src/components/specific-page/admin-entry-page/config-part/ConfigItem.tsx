import { ChangeEvent } from 'react';

interface IConfigItemProps {
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ConfigItem = ({ name, checked, onChange }: IConfigItemProps) => {
  return (
    <div className='flex items-center'>
      <input
        type='checkbox'
        className='m-[9px] h-[18px] w-[18px] cursor-pointer accent-primary'
        checked={checked}
        onChange={onChange}
        id={`checkbox-${name.toLocaleLowerCase()}`}
      />
      <label className='text-sm cursor-pointer' htmlFor={`checkbox-${name.toLocaleLowerCase()}`}>{name}</label>
    </div>
  );
};

export default ConfigItem;
