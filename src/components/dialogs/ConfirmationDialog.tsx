import { useTranslation } from 'react-i18next';
import ModalWrapper from '../modal/ModalWrapper';

interface IConfirmationDialogParams {
  name: string;
  setOpen: (open: boolean) => void;
  handleDelete: () => Promise<void>;
}
const ConfirmationDialog = ({
  name,
  setOpen,
  handleDelete,
}: IConfirmationDialogParams) => {
  const { t } = useTranslation();

  return (
    <ModalWrapper
      setOpen={setOpen}
      title={t('modal.confirmation.title')}
      buttonLabel={t('modal.confirmation.label')}
      onClick={handleDelete}
    >
      <span className='text-xl text-black dark:text-white'>
        {t('modal.confirmation.dialog', { x: name })}
      </span>
    </ModalWrapper>
  );
};

export default ConfirmationDialog;
