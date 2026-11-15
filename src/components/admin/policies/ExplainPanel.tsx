import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { IUser } from '../../../utils/interfaces/user';
import { IExplainResult } from '../../../utils/interfaces/contentPolicy';
import { problemOf, useContentPolicies, useExplainAccess } from '../../../hooks/api/contentPolicies/useContentPolicies';
import UserPicker from '../UserPicker';
import EntryPicker, { PickedEntry } from '../EntryPicker';
import StatusChip from '../StatusChip';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';

const SELECT_TRIGGER = 'h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40';
const show = (value: unknown) => (value === null || value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value));
const yesNo = (value: boolean | null, t: (k: string) => string) =>
  value === null ? '—' : value ? t('administration.policies.explain.yes') : t('administration.policies.explain.no');

function ExplainResult({ result }: { result: IExplainResult }) {
  const { t } = useTranslation();
  const rows: [string, React.ReactNode][] = [
    [t('administration.policies.explain.basis'), show(result.basis)],
    [t('administration.policies.explain.reason'), show(result.reason)],
    [
      t('administration.policies.explain.policy'),
      <span key="p" className="font-mono text-xs">
        {result.policy}
        {result.policy_source ? <span className="ml-1 font-sans text-zinc-500">({result.policy_source})</span> : null}
      </span>,
    ],
    [t('administration.policies.explain.lcp'), yesNo(result.lcp, t)],
    [t('administration.policies.explain.insideIp'), yesNo(result.inside_ip, t)],
    [t('administration.policies.explain.processor'), show(result.processor)],
  ];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700" aria-live="polite">
      {!result.visible ? (
        <p className="text-sm text-redText dark:text-red">{t('administration.policies.explain.hidden')}</p>
      ) : null}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="text-zinc-800 dark:text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('administration.policies.explain.caps')}</span>
        {result.caps.length ? (
          <ol className="flex flex-col gap-1">
            {/* Each cap is a ceiling; the response doesn't say the basis tier, so which one bit isn't shown. */}
            {result.caps.map((cap, index) => (
              <li key={`${cap.cap}-${index}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{cap.cap}</span>
                <span className="text-xs text-zinc-500">≤ {cap.tier}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-zinc-500">{t('administration.policies.explain.noCaps')}</p>
        )}
      </div>
      {result.budget ? (
        <p className="text-xs text-zinc-500">
          {t('administration.policies.explain.budget')}: <span className="font-mono">{show(result.budget)}</span>
        </p>
      ) : null}
      <p className="text-sm text-zinc-700 dark:text-zinc-200">
        {t('administration.policies.explain.finalTier')} <StatusChip variant="info">{show(result.tier)}</StatusChip>
      </p>
      {result.how_to_unlock && !(Array.isArray(result.how_to_unlock) && !result.how_to_unlock.length) ? (
        <p className="text-xs text-zinc-500">
          {t('administration.policies.explain.unlock')}: {show(result.how_to_unlock)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * "Explain" (elvira-portal#47): which tier a reader gets for a publication and why, `POST
 * /api/v1/content-policies/explain`. `policy` asks what another stored policy would decide, without assigning it.
 */
export default function ExplainPanel({ policyKey }: { policyKey?: string }) {
  const { t } = useTranslation();
  const explain = useExplainAccess();
  const policies = useContentPolicies(!policyKey);
  const [entry, setEntry] = useState<PickedEntry | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [processor, setProcessor] = useState<'local' | 'external'>('local');
  const [override, setOverride] = useState('');
  const policy = policyKey ?? (override || undefined);

  const run = () => {
    if (!entry) return;
    explain.mutate({
      entry_id: entry.id,
      ...(user ? { user_id: user.id } : {}),
      processor,
      ...(policy ? { policy } : {}),
    });
  };

  const chip = (label: string, onClear: () => void) => (
    <span className="inline-flex items-center gap-1 self-start rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-800 dark:bg-zinc-700/60 dark:text-zinc-100">
      {label}
      <button type="button" onClick={onClear} aria-label={t('administration.policies.explain.clear')} className="text-zinc-400 hover:text-zinc-700">
        <FiX size={14} />
      </button>
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('administration.policies.explain.entry')}</span>
        {entry ? (
          chip(entry.title, () => setEntry(null))
        ) : (
          <EntryPicker
            onSelect={setEntry}
            label={t('administration.policies.explain.entry')}
            placeholder={t('administration.policies.explain.entryPlaceholder')}
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('administration.policies.explain.user')}</span>
        {user ? (
          chip(user.username, () => setUser(null))
        ) : (
          <UserPicker
            onSelect={setUser}
            label={t('administration.policies.explain.user')}
            placeholder={t('administration.policies.explain.userPlaceholder')}
          />
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.policies.explain.userHint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="explain-processor" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('administration.policies.explain.processor')}
          </label>
          <Select
            id="explain-processor"
            value={processor}
            onChange={(value) => setProcessor(value as 'local' | 'external')}
            options={[
              { value: 'local', label: t('administration.policies.explain.local') },
              { value: 'external', label: t('administration.policies.explain.external') },
            ]}
            triggerClassName={SELECT_TRIGGER}
          />
        </div>
        {!policyKey ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="explain-policy" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {t('administration.policies.explain.policyOverride')}
            </label>
            <Select
              id="explain-policy"
              value={override}
              onChange={setOverride}
              options={[
                { value: '', label: t('administration.policies.explain.assigned') },
                ...(policies.data ?? []).map((p) => ({ value: p.key, label: `${p.title} (${p.key})` })),
              ]}
              triggerClassName={SELECT_TRIGGER}
            />
          </div>
        ) : null}
      </div>
      <Button type="button" onClick={run} disabled={!entry || explain.isPending} className="self-start">
        {explain.isPending ? '…' : t('administration.policies.explain.run')}
      </Button>
      {explain.isError ? (
        <p className="text-sm text-redText dark:text-red">{problemOf(explain.error) ?? t('administration.policies.explain.error')}</p>
      ) : null}
      {explain.data ? <ExplainResult result={explain.data} /> : null}
    </div>
  );
}
