import { ChangeEvent, ReactNode } from 'react';

interface IElviraSelectParams {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}

export const MUISelectStyle = {
  '&:before': { borderBottom: '0px' },
  '&:hover:not(.Mui-disabled):before': { borderBottom: '0px' },
  '.MuiSelect-icon': { color: 'black' },
  '.dark & .MuiSelect-icon': { color: 'white' },
}

const ElviraSelect = ({
  name,
  value,
  onChange,
  children,
}: IElviraSelectParams) => {
  return (
    <select
      name={name}
      className='bg-transparent outline-none p-2 pl-0'
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  );
};

export default ElviraSelect;
