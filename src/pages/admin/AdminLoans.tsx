import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Tabs } from '../../components/admin';
import LoansTable from '../../components/admin/loans/LoansTable';
import ReservationsTable from '../../components/admin/loans/ReservationsTable';

const AdminLoans = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'reservations' ? 'reservations' : 'loans';

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.loansPage.title')} description={t('administration.loansPage.description')} />

      <Tabs
        label={t('administration.loansPage.title')}
        active={tab}
        // Each tab has its own search, sort and page — start it clean.
        onChange={(id) => setSearchParams(id === 'loans' ? {} : { tab: id })}
        tabs={[
          { id: 'loans', label: t('administration.loansPage.tabLoans') },
          { id: 'reservations', label: t('administration.loansPage.tabReservations') },
        ]}
      />

      {tab === 'loans' ? <LoansTable /> : <ReservationsTable />}
    </div>
  );
};

export default AdminLoans;
