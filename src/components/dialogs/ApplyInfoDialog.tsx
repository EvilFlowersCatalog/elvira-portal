import { useTranslation } from 'react-i18next';
import {
  IDENTIFIERS_TYPE,
  IModalParams,
} from '../../utils/interfaces/general/general';
import ModalWrapper from '../modal/ModalWrapper';

interface IApplyInfoDialogParams extends IModalParams {
  type: IDENTIFIERS_TYPE;
  identifier: string;
}

const ApplyInfoDialog = ({
  close,
  yes,
  type,
  identifier,
}: IApplyInfoDialogParams) => {
  const { t } = useTranslation();

  return (
    <ModalWrapper
      close={close}
      title={t('modal.applyInfo.title')}
      buttonLabel={t('modal.applyInfo.label')}
      yes={yes}
    >
      <span className='text-xl text-black dark:text-white text-center'>
        {t('modal.applyInfo.dialog', {
          x: type.toLocaleUpperCase(),
          y: identifier,
        })}
      </span>
    </ModalWrapper>
  );
};

export default ApplyInfoDialog;
