import { Checkbox } from '@mui/material';
import { ChangeEvent } from 'react';
import useAppContext from '../../../../hooks/contexts/useAppContext';

interface IConfigItemProps {
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ConfigItem = ({ name, checked, onChange }: IConfigItemProps) => {
  const { stuColor } = useAppContext();

  return (
    <div className='flex items-center'>
      <Checkbox
        size='small'
        checked={checked}
        onChange={onChange}
        id={`checkbox-${name.toLocaleLowerCase()}`}
        sx={{
          color: stuColor,
          '&.Mui-checked': {
            color: stuColor,
          },
        }}
      />
      <label className='text-sm cursor-pointer' htmlFor={`checkbox-${name.toLocaleLowerCase()}`}>{name}</label>
    </div>
  );
};

export default ConfigItem;
