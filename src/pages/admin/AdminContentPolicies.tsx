import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { DataTable, DataTableColumn, PageHeader, StatusChip, Tabs } from '../../components/admin';
import Button from '../../components/buttons/Button';
import PolicyDrawer from '../../components/admin/policies/PolicyDrawer';
import ExplainPanel from '../../components/admin/policies/ExplainPanel';
import UnavailableNotice from '../../components/admin/policies/UnavailableNotice';
import { isUnavailable, useContentPolicies } from '../../hooks/api/contentPolicies/useContentPolicies';
import { IContentPolicy } from '../../utils/interfaces/contentPolicy';

const POLICIES_ISSUE = 'https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/174';

/**
 * Content policies (elvira-portal#47, catalog #174): the versioned rule documents that decide how much of a
 * publication the assistant and agents may use. Superusers edit them here; "Explain" checks the outcome for a
 * publication and reader. Catalogs and publications pick a policy in their own forms.
 */
const AdminContentPolicies = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'explain' ? 'explain' : 'policies';
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const policies = useContentPolicies();
  const unavailable = policies.isError && isUnavailable(policies.error);

  const assignedTo = (policy: IContentPolicy) => {
    const parts: string[] = [];
    if (policy.assigned?.default) parts.push(t('administration.policies.assignedDefault'));
    const catalogs = policy.assigned?.catalogs ?? [];
    if (catalogs.length) parts.push(catalogs.map((c) => c.title).join(', '));
    if (policy.assigned?.entries) parts.push(t('administration.policies.assignedEntries', { count: policy.assigned.entries }));
    return parts.join(' · ') || '—';
  };

  const columns: DataTableColumn<IContentPolicy>[] = [
    {
      id: 'title',
      header: t('administration.policies.titleField'),
      hideable: false,
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-800 dark:text-zinc-100">{p.title}</span>
          <span className="font-mono text-xs text-zinc-500">{p.key}</span>
        </div>
      ),
    },
    {
      id: 'version',
      header: t('administration.policies.version'),
      cell: (p) => <StatusChip variant="neutral">v{p.version}</StatusChip>,
      width: 'w-24',
    },
    { id: 'assigned', header: t('administration.policies.assigned'), cell: (p) => <span className="text-sm">{assignedTo(p)}</span> },
    {
      id: 'updated',
      header: t('administration.policies.updated'),
      cell: (p) => (p.updated_at || p.created_at ? new Date(p.updated_at ?? p.created_at!).toLocaleString(i18n.language) : '—'),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.policies.title')}
        description={t('administration.policies.description')}
        actions={
          tab === 'policies' && !unavailable ? (
            <Button onClick={() => setEditing(null)} className="flex items-center gap-2">
              <FiPlus size={16} />
              {t('administration.policies.newFromPreset')}
            </Button>
          ) : undefined
        }
      />

      {unavailable ? (
        <UnavailableNotice issue="EvilFlowersCatalog#174" issueUrl={POLICIES_ISSUE} />
      ) : (
        <>
          <Tabs
            label={t('administration.policies.title')}
            active={tab}
            onChange={(id) => setSearchParams(id === 'policies' ? {} : { tab: id })}
            tabs={[
              { id: 'policies', label: t('administration.policies.tabPolicies'), count: policies.data?.length ?? null },
              { id: 'explain', label: t('administration.policies.tabExplain') },
            ]}
          />

          {tab === 'policies' ? (
            <DataTable
              caption={t('administration.policies.title')}
              columns={columns}
              rows={policies.data ?? []}
              getRowId={(p) => p.key}
              onRowClick={(p) => setEditing(p.key)}
              loading={policies.isLoading}
              error={policies.isError ? t('administration.policies.loadError') : undefined}
              onRetry={() => policies.refetch()}
              emptyTitle={t('administration.policies.empty')}
            />
          ) : (
            <div className="max-w-2xl px-4">
              <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{t('administration.policies.explain.pageHint')}</p>
              <ExplainPanel />
            </div>
          )}
        </>
      )}

      {/* Mounted per policy, so a discarded draft never carries over to the next one opened. */}
      {editing !== undefined && (
        <PolicyDrawer key={editing ?? '__new'} open policyKey={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
};

export default AdminContentPolicies;
