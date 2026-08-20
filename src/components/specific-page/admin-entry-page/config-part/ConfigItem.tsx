import { ChangeEvent } from 'react';
import Checkbox from '../../../primitives/Checkbox';

interface IConfigItemProps {
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ConfigItem = ({ name, checked, onChange }: IConfigItemProps) => {
  return (
    <Checkbox
      id={`checkbox-${name.toLocaleLowerCase()}`}
      checked={checked}
      onChange={onChange}
      label={name}
      labelClassName="text-sm"
    />
  );
};

export default ConfigItem;
