import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, Tabs } from '../../components/admin';
import ApiKeysTable from '../../components/admin/access/ApiKeysTable';
import GrantsTable from '../../components/admin/access/GrantsTable';
import Button from '../../components/buttons/Button';

const AdminAccess = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'grants' ? 'grants' : 'keys';
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.accessPage.title')}
        description={t('administration.accessPage.description')}
        actions={
          tab === 'keys' ? (
            <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
              <FiPlus size={16} />
              {t('administration.accessPage.keys.add')}
            </Button>
          ) : undefined
        }
      />

      <Tabs
        label={t('administration.accessPage.title')}
        active={tab}
        // Each tab has its own search, sort and page — start it clean.
        onChange={(id) => setSearchParams(id === 'keys' ? {} : { tab: id })}
        tabs={[
          { id: 'keys', label: t('administration.accessPage.tabKeys') },
          { id: 'grants', label: t('administration.accessPage.tabGrants') },
        ]}
      />

      {tab === 'keys' ? (
        <ApiKeysTable createOpen={createOpen} onCreateClose={() => setCreateOpen(false)} />
      ) : (
        <GrantsTable />
      )}
    </div>
  );
};

export default AdminAccess;
