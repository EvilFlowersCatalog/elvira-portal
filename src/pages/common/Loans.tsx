import { useTranslation } from 'react-i18next';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import LoansCardView from '../../components/items/loans/LoansCardView';

const Loans = () => {
  const { t } = useTranslation();
  return (
    <div className="h-screen overflow-auto">
      <Breadcrumb />
      <H1>{t('license.loansPage.title')}</H1>
      <div className="px-4">
        <LoansCardView />
      </div>
    </div>
  );
};

export default Loans;
