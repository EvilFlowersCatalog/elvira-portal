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

/** The access bases from most to least; the column header names them in this order. */
const BASES = ['open', 'loan', 'past_loan', 'none'];

const POLICIES_ISSUE ='https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/174';

/**
 * Content policies (elvira-portal#47, catalog #174): the versioned rule documents that decide how much of a
 * publication the assistant and agents may use. Superusers edit them here; "Explain" checks the outcome for a
 * publication and reader. Catalogs and publications pick a policy in their own forms.
 */
const AdminContentPolicies = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'explain' ? 'explain' : 'policies';
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const policies = useContentPolicies();
  const unavailable = policies.isError && isUnavailable(policies.error);

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
      cell: (p) =>
        p.builtin ? (
          <StatusChip variant="neutral" title={t('administration.policies.builtinHint')}>
            {t('administration.policies.builtin')}
          </StatusChip>
        ) : (
          <StatusChip variant="neutral">v{p.version}</StatusChip>
        ),
      width: 'w-32',
    },
    {
      id: 'tiers',
      header: t('administration.policies.tiers'),
      cell: (p) => {
        // In the bases' own order: jsonb hands the keys back sorted alphabetically.
        const tiers = (p.document?.tiers ?? {}) as Record<string, string>;
        return (
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
            {BASES.map((basis) => tiers[basis] ?? '—').join(' · ')}
          </span>
        );
      },
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
        <PolicyDrawer key={editing ?? '__new'} policyKey={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
};

export default AdminContentPolicies;
