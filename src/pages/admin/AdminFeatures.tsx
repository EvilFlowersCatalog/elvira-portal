import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiInfo } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { PageHeader, StatusChip } from '../../components/admin';
import type { StatusVariant } from '../../components/admin';
import useAxios from '../../hooks/api/useAxios';
import { problemOf, useSaveSetting } from '../../hooks/api/contentPolicies/useContentPolicies';
import {
  FEATURES,
  FEATURES_SETTING_KEY,
  FeatureKey,
  FeatureSource,
  FeatureState,
  getFeatureSnapshot,
  resolveFeature,
  setFeatureSnapshot,
  toStored,
  useFeatureSnapshot,
} from '../../features/features';
import { PUBLIC_SETTINGS_PATH } from '../../features/useFeatureSync';

const ISSUE = 'EvilFlowersCatalog#212';
const ISSUE_URL = 'https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/212';

const SOURCE_VARIANT: Record<FeatureSource, StatusVariant> = { setting: 'info', build: 'neutral', capability: 'warning' };

type Choice = 'on' | 'off' | 'inherit';

/** The stored `portal.features` (superuser read); `null` when the catalog has no such key yet. */
const useStoredFeatures = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ['settings', FEATURES_SETTING_KEY],
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await axios.get<{ response: { value: unknown } }>(`/api/v1/settings/${FEATURES_SETTING_KEY}`);
        return toStored(data.response?.value);
      } catch (error) {
        if (isAxiosError(error) && [404, 405, 501].includes(error.response?.status ?? 0)) return null;
        throw error;
      }
    },
  });
};

/** Whether readers get the switches too (the public read, catalog #212). */
const usePublicRead = () =>
  useQuery({
    queryKey: ['settings', 'public-probe'],
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const base = (import.meta.env.ELVIRA_BASE_URL ?? '').replace(/\/$/, '');
      try {
        return (await fetch(`${base}${PUBLIC_SETTINGS_PATH}`, { headers: { Accept: 'application/json' } })).ok;
      } catch {
        return false;
      }
    },
  });

function Segmented({
  value,
  disabled,
  onChange,
  labels,
  name,
}: {
  value: Choice;
  disabled?: boolean;
  onChange: (value: Choice) => void;
  labels: Record<Choice, string>;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex shrink-0 rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-600">
      {(['on', 'off', 'inherit'] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={value === choice}
          disabled={disabled}
          onClick={() => value !== choice && onChange(choice)}
          className={twMerge(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            value === choice
              ? choice === 'off'
                ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900'
                : 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700/60'
          )}
        >
          {labels[choice]}
        </button>
      ))}
    </div>
  );
}

function FeatureRow({
  state,
  disabled,
  onChange,
}: {
  state: FeatureState;
  disabled: boolean;
  onChange: (key: FeatureKey, value: boolean | null) => void;
}) {
  const { t } = useTranslation();
  const k = 'administration.features';
  const name = t(`${k}.items.${state.key}.name`);
  const choice: Choice = state.stored === undefined ? 'inherit' : state.stored ? 'on' : 'off';
  const onOff = (on: boolean) => t(on ? `${k}.on` : `${k}.off`);

  return (
    <li className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4 first:border-t-0 dark:border-zinc-700 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{name}</span>
          <StatusChip variant={state.enabled ? 'success' : 'neutral'}>{onOff(state.enabled)}</StatusChip>
          <StatusChip variant={SOURCE_VARIANT[state.source]} dot={false}>
            {t(`${k}.source.${state.source}`)}
          </StatusChip>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t(`${k}.items.${state.key}.description`)}</p>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          {state.missing
            ? t(`${k}.missing`, { capability: t(`${k}.capability.${state.missing}`) })
            : t(`${k}.buildDefault`, { state: onOff(state.fallback) })}
        </p>
      </div>
      <Segmented
        name={name}
        value={choice}
        disabled={disabled}
        labels={{ on: t(`${k}.on`), off: t(`${k}.off`), inherit: t(`${k}.reset`) }}
        onChange={(next) => onChange(state.key, next === 'inherit' ? null : next === 'on')}
      />
    </li>
  );
}

/**
 * Administration › Features: switch portal features for every reader at runtime (catalog setting
 * `portal.features`, catalog #212). Always reachable, so a feature switched off can be switched back on.
 */
const AdminFeatures = () => {
  const { t } = useTranslation();
  const k = 'administration.features';
  const queryClient = useQueryClient();
  const stored = useStoredFeatures();
  const publicRead = usePublicRead();
  const save = useSaveSetting();
  const snapshot = useFeatureSnapshot();
  const [pending, setPending] = useState<FeatureKey | null>(null);

  const unavailable = stored.isSuccess && stored.data === null;
  // What the catalog stores (when we can read it) wins over the cached copy.
  const effective = useMemo(
    () => ({ ...snapshot, stored: stored.data ?? snapshot.stored }),
    [snapshot, stored.data]
  );
  const states = FEATURES.map((f) => resolveFeature(f.key, effective));

  const change = async (key: FeatureKey, value: boolean | null) => {
    const next = { ...(stored.data ?? {}) };
    if (value === null) delete next[key];
    else next[key] = value;
    const name = t(`${k}.items.${key}.name`);
    setPending(key);
    try {
      await save.mutateAsync({ key: FEATURES_SETTING_KEY, value: next });
      queryClient.setQueryData(['settings', FEATURES_SETTING_KEY], next);
      setFeatureSnapshot({ ...getFeatureSnapshot(), stored: next, fromCatalog: true });
      queryClient.invalidateQueries({ queryKey: ['portal-features'] });
      toast.success(
        value === null ? t(`${k}.resetDone`, { name }) : t(`${k}.saved`, { name, state: t(value ? `${k}.on` : `${k}.off`) })
      );
    } catch (error) {
      toast.error(problemOf(error) ?? t(`${k}.saveError`));
    } finally {
      setPending(null);
    }
  };

  const groups = (['reader', 'admin'] as const).map((area) => ({
    area,
    items: states.filter((s) => FEATURES.find((f) => f.key === s.key)?.area === area),
  }));

  return (
    <div className="pb-10">
      <PageHeader title={t(`${k}.title`)} description={t(`${k}.description`)} />
      <div className="flex max-w-4xl flex-col gap-4 px-4">
        {unavailable && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100">
            <FiInfo size={18} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{t(`${k}.unavailable.title`)}</p>
              <p className="mt-1">{t(`${k}.unavailable.body`)}</p>
              <a href={ISSUE_URL} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium underline">
                {t(`${k}.unavailable.issue`)}: {ISSUE}
              </a>
            </div>
          </div>
        )}
        {!unavailable && stored.isSuccess && publicRead.data === false && (
          <p className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
            <FiInfo size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {t(`${k}.notPublic`)}{' '}
              <a href={ISSUE_URL} target="_blank" rel="noreferrer" className="underline">
                {ISSUE}
              </a>
            </span>
          </p>
        )}
        {stored.isError && <p className="text-sm text-redText dark:text-red">{problemOf(stored.error) ?? t(`${k}.saveError`)}</p>}

        {groups.map(({ area, items }) => (
          <section key={area} className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="border-b border-zinc-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              {t(`${k}.${area}`)}
            </h2>
            <ul>
              {items.map((state) => (
                <FeatureRow
                  key={state.key}
                  state={state}
                  disabled={unavailable || stored.isLoading || pending !== null}
                  onChange={change}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default AdminFeatures;
