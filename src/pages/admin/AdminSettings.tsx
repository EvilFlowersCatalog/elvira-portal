import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { PageHeader, SearchField, StatusChip } from '../../components/admin';
import type { StatusVariant } from '../../components/admin';
import Button from '../../components/buttons/Button';
import { SchemaField } from '../../components/admin/policies/SchemaForm';
import UnavailableNotice from '../../components/admin/policies/UnavailableNotice';
import { isUnavailable, problemOf, useSaveSetting, useSettings } from '../../hooks/api/contentPolicies/useContentPolicies';
import { IJsonSchema, ISetting, SettingSource } from '../../utils/interfaces/contentPolicy';

const SETTINGS_ISSUE = 'https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/20';

const SOURCE_VARIANT: Record<SettingSource, StatusVariant> = { db: 'info', env: 'warning', default: 'neutral' };

/** The registry type as a schema, so a setting renders with the same form as a policy field. */
const schemaOf = (setting: ISetting): IJsonSchema => {
  if (setting.schema) return { title: setting.title ?? setting.key, ...setting.schema };
  const base: IJsonSchema = { title: setting.title ?? setting.key, description: setting.description };
  if (setting.choices?.length) return { ...base, enum: setting.choices };
  switch (setting.type) {
    case 'boolean':
    case 'integer':
    case 'number':
      return { ...base, type: setting.type };
    case 'string':
    case 'text':
    case 'url':
    case 'email':
      return { ...base, type: 'string' };
    default:
      // `json` and anything unknown: the JSON box.
      return base;
  }
};

const show = (value: unknown) =>
  value === undefined || value === null ? '—' : typeof value === 'string' ? value || '""' : JSON.stringify(value);

function SettingRow({ setting }: { setting: ISetting }) {
  const { t } = useTranslation();
  const save = useSaveSetting();
  const [draft, setDraft] = useState<unknown>(setting.secret ? undefined : setting.value);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => schemaOf(setting), [setting]);

  useEffect(() => {
    setDraft(setting.secret ? undefined : setting.value);
  }, [setting]);

  const dirty = setting.secret ? draft !== undefined : JSON.stringify(draft) !== JSON.stringify(setting.value);

  const run = async (reset: boolean) => {
    setError(null);
    try {
      await save.mutateAsync(reset ? { key: setting.key, reset: true } : { key: setting.key, value: draft ?? null });
      toast.success(reset ? t('administration.settings.resetDone', { key: setting.key }) : t('administration.settings.saved', { key: setting.key }));
    } catch (e) {
      setError(problemOf(e) ?? t('administration.settings.saveError'));
    }
  };

  return (
    <li className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-4 first:border-t-0 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs text-zinc-500 dark:text-zinc-400">{setting.key}</code>
        <StatusChip variant={SOURCE_VARIANT[setting.source] ?? 'neutral'} title={t(`administration.settings.sourceHint.${setting.source}`)}>
          {t(`administration.settings.source.${setting.source}`)}
        </StatusChip>
        {setting.secret ? <StatusChip variant="neutral">{t('administration.settings.secret')}</StatusChip> : null}
      </div>
      <SchemaField
        schema={schema}
        root={schema}
        name={setting.key}
        value={draft}
        required={!!setting.choices?.length}
        disabled={setting.readonly || save.isPending}
        onChange={setDraft}
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t('administration.settings.defaultValue', { value: show(setting.default) })}
      </p>
      {error ? <p className="text-xs text-redText dark:text-red">{error}</p> : null}
      {!setting.readonly ? (
        <div className="flex gap-2">
          <Button type="button" onClick={() => run(false)} disabled={!dirty || save.isPending}>
            {t('administration.settings.save')}
          </Button>
          {setting.source === 'db' ? (
            <button
              type="button"
              onClick={() => run(true)}
              disabled={save.isPending}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {t('administration.settings.reset')}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">{t('administration.settings.readonly')}</p>
      )}
    </li>
  );
}

/**
 * Instance settings (elvira-portal#47, catalog #20): every key of the catalog's settings registry, one field per
 * key typed from the registry, with its default and where the current value comes from (database, environment,
 * built-in). Saving stores the value in the database; "reset" drops it so the environment or default applies.
 */
const AdminSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();
  const [filter, setFilter] = useState('');
  const unavailable = settings.isError && isUnavailable(settings.error);

  // Grouped by the key's prefix (`content.default_policy` → content).
  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const map = new Map<string, ISetting[]>();
    for (const setting of settings.data ?? []) {
      if (
        needle &&
        !setting.key.toLowerCase().includes(needle) &&
        !(setting.title ?? '').toLowerCase().includes(needle) &&
        !(setting.description ?? '').toLowerCase().includes(needle)
      )
        continue;
      const group = setting.key.includes('.') ? setting.key.split('.')[0] : 'general';
      map.set(group, [...(map.get(group) ?? []), setting]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [settings.data, filter]);

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.settings.title')} description={t('administration.settings.description')} />
      {unavailable ? (
        <UnavailableNotice issue="EvilFlowersCatalog#20" issueUrl={SETTINGS_ISSUE} />
      ) : settings.isLoading ? (
        <div className="flex flex-col gap-2 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-700/50" />
          ))}
        </div>
      ) : settings.isError ? (
        <p className="px-4 text-sm text-redText dark:text-red">{t('administration.settings.loadError')}</p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4 px-4">
          <SearchField
            value={filter}
            onChange={setFilter}
            label={t('administration.settings.filter')}
            placeholder={t('administration.settings.filter')}
          />
          {groups.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('administration.settings.empty')}</p>
          ) : (
            groups.map(([group, items]) => (
              <section key={group} className="rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h2 className="border-b border-zinc-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {group}
                </h2>
                <ul>
                  {items.map((setting) => (
                    <SettingRow key={setting.key} setting={setting} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
