import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { IUser } from '../../../utils/interfaces/user';
import { IExplainResult, PolicyDocument } from '../../../utils/interfaces/contentPolicy';
import { problemOf, useExplainAccess } from '../../../hooks/api/contentPolicies/useContentPolicies';
import UserPicker from '../UserPicker';
import EntryPicker, { PickedEntry } from '../EntryPicker';
import StatusChip from '../StatusChip';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';

const show = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

function ExplainResult({ result }: { result: IExplainResult }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700" aria-live="polite">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">{t('administration.policies.explain.basis')}</dt>
        <dd className="font-medium text-zinc-800 dark:text-zinc-100">{result.basis}</dd>
        <dt className="text-zinc-500 dark:text-zinc-400">{t('administration.policies.explain.policy')}</dt>
        <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-100">{result.policy}</dd>
        {result.base_tier ? (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">{t('administration.policies.explain.baseTier')}</dt>
            <dd className="text-zinc-800 dark:text-zinc-100">{result.base_tier}</dd>
          </>
        ) : null}
      </dl>
      {result.caps.length ? (
        <ol className="flex flex-col gap-1">
          {result.caps.map((cap, index) => (
            <li key={`${cap.cap}-${index}`} className="flex flex-wrap items-center gap-2 text-sm">
              <StatusChip variant={cap.applied ? 'warning' : 'neutral'}>
                {cap.applied ? t('administration.policies.explain.applied') : t('administration.policies.explain.skipped')}
              </StatusChip>
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-200">{cap.cap}</span>
              {cap.value !== undefined ? <span className="text-xs text-zinc-500">= {show(cap.value)}</span> : null}
              {cap.tier ? <span className="text-xs text-zinc-500">→ {cap.tier}</span> : null}
              {cap.reason ? <span className="text-xs text-zinc-500">({cap.reason})</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="text-sm text-zinc-700 dark:text-zinc-200">
        {t('administration.policies.explain.finalTier')}{' '}
        <StatusChip variant="info">{result.tier}</StatusChip>
      </p>
    </div>
  );
}

/**
 * "Explain" (elvira-portal#47): which tier a reader gets for a publication and why — the basis, every cap and the
 * final tier, `POST /api/v1/content-policies/explain`. With `document`, it explains an unsaved draft, so an admin
 * sees the effect of a change before saving it.
 */
export default function ExplainPanel({ policyKey, document }: { policyKey?: string; document?: PolicyDocument }) {
  const { t } = useTranslation();
  const explain = useExplainAccess();
  const [entry, setEntry] = useState<PickedEntry | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [processor, setProcessor] = useState<'local' | 'external'>('local');

  const run = () => {
    if (!entry) return;
    explain.mutate({
      entry_id: entry.id,
      ...(user ? { user_id: user.id } : {}),
      processor,
      ...(policyKey ? { policy: policyKey } : {}),
      ...(document ? { document } : {}),
    });
  };

  const chip = (label: string, onClear: () => void) => (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-800 dark:bg-zinc-700/60 dark:text-zinc-100">
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
      </div>
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
          className="max-w-xs"
          triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
        />
      </div>
      <Button type="button" onClick={run} disabled={!entry || explain.isPending} className="self-start">
        {explain.isPending ? '…' : document ? t('administration.policies.explain.runDraft') : t('administration.policies.explain.run')}
      </Button>
      {explain.isError ? (
        <p className="text-sm text-redText dark:text-red">{problemOf(explain.error) ?? t('administration.policies.explain.error')}</p>
      ) : null}
      {explain.data ? <ExplainResult result={explain.data} /> : null}
    </div>
  );
}
