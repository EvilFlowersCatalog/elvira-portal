import { Checkbox } from '@mui/material';
import { ChangeEvent } from 'react';
import { IoHelpCircleOutline } from 'react-icons/io5';
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
        sx={{
          color: stuColor,
          '&.Mui-checked': {
            color: stuColor,
          },
        }}
      />
      <span className='text-sm'>{name}</span>
      <IoHelpCircleOutline className='min-w-10 hidden md:block' size={20} />
    </div>
  );
};

export default ConfigItem;
