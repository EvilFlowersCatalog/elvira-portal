import { useTranslation } from 'react-i18next';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import AiAssistant from '../../components/dialogs/AiAssistant';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';
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
      <EntryDetail />
      <AiAssistant />
      <LicenseCalendar />
    </div>
  );
};

export default Loans;
