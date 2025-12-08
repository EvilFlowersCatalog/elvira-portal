import { useTranslation } from 'react-i18next';
import { AdvancedSearchWrapper } from '../../components/items/container/AdvancedSearch';
import LoansTable from '../../components/items/loans/LoansTable';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import AiAssistant from '../../components/dialogs/AiAssistant';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';

const Loans = () => {
  const { t } = useTranslation();
  return (<>
    <Breadcrumb />
    <H1>{t('license.loansPage.title')}</H1>
    <AdvancedSearchWrapper>
      <LoansTable></LoansTable>
    </AdvancedSearchWrapper>
    <EntryDetail />
    <AiAssistant />
    <LicenseCalendar />
  </>
  );
};

export default Loans;
