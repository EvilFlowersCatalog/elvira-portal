import { useTranslation } from 'react-i18next';
import ModalWrapper from '../modal/ModalWrapper';
import { IModalParams } from '../../utils/interfaces/general/general';

interface IConfirmationDialogParams extends IModalParams {
  name: string;
  type: 'feed' | 'entry' | 'category';
}
const ConfirmationDialog = ({
  name,
  close,
  yes,
  type,
}: IConfirmationDialogParams) => {
  const { t } = useTranslation();

  return (
    <ModalWrapper
      close={close}
      title={t('modal.confirmation.title')}
      buttonLabel={t('modal.confirmation.label')}
      yes={yes}
    >
      <span className='text-xl text-black dark:text-white text-center'>
        {t('modal.confirmation.dialog', {
          x: name,
          y:
            type === 'feed'
              ? t('modal.confirmation.feed')
              : type === 'entry'
              ? t('modal.confirmation.entry')
              : t('modal.confirmation.category'),
        })}
      </span>
    </ModalWrapper>
  );
};

export default ConfirmationDialog;
