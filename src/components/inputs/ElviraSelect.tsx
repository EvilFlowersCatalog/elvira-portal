import { ChangeEvent, ReactNode } from 'react';

interface IElviraSelectParams {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
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
      className='bg-transparent outline-none'
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  );
};

export default ElviraSelect;
