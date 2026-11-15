import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { PageHeader, SearchField, StatusChip } from '../../components/admin';
import type { StatusVariant } from '../../components/admin';
import Button from '../../components/buttons/Button';
import { SchemaField } from '../../components/admin/policies/SchemaForm';
import UnavailableNotice from '../../components/admin/policies/UnavailableNotice';
import {
  isUnavailable,
  problemOf,
  useContentPolicies,
  useSaveSetting,
  useSettings,
} from '../../hooks/api/contentPolicies/useContentPolicies';
import { IJsonSchema, ISetting, SettingSource } from '../../utils/interfaces/contentPolicy';

const SETTINGS_ISSUE = 'https://github.com/EvilFlowersCatalog/EvilFlowersCatalog/issues/20';

const SOURCE_VARIANT: Record<SettingSource, StatusVariant> = { stored: 'info', setting: 'warning', default: 'neutral' };

/** Largest logo the upload accepts; the key itself is unlimited, but a data URI rides on every licence page. */
const MAX_LOGO_BYTES = 512 * 1024;

const show = (value: unknown) =>
  value === undefined || value === null ? '—' : typeof value === 'string' ? (value.length > 120 ? `${value.slice(0, 120)}…` : value || '""') : JSON.stringify(value);

const isImage = (value: unknown) => typeof value === 'string' && /^(data:image\/|https:\/\/)/.test(value);

function SettingRow({ setting, policyKeys }: { setting: ISetting; policyKeys: string[] }) {
  const { t } = useTranslation();
  const save = useSaveSetting();
  const [draft, setDraft] = useState<unknown>(setting.value);
  const [error, setError] = useState<string | null>(null);
  const logo = setting.key === 'branding.logo';

  // The registry's schema; the default policy picks from the policies that exist (the catalog validates it too).
  const schema = useMemo<IJsonSchema>(() => {
    const base: IJsonSchema = { ...setting.schema, title: setting.key, description: setting.description };
    if (setting.key === 'content.default_policy' && policyKeys.length) return { ...base, enum: policyKeys, pattern: undefined };
    return base;
  }, [setting, policyKeys]);

  useEffect(() => {
    setDraft(setting.value);
  }, [setting]);

  const dirty = JSON.stringify(draft ?? null) !== JSON.stringify(setting.value ?? null);

  const run = async (value: unknown) => {
    setError(null);
    try {
      await save.mutateAsync({ key: setting.key, value });
      toast.success(value === null ? t('administration.settings.resetDone', { key: setting.key }) : t('administration.settings.saved', { key: setting.key }));
    } catch (e) {
      setError(problemOf(e) ?? t('administration.settings.saveError'));
    }
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError(t('administration.settings.logoType'));
    if (file.size > MAX_LOGO_BYTES) return setError(t('administration.settings.logoSize', { kb: MAX_LOGO_BYTES / 1024 }));
    const reader = new FileReader();
    reader.onload = () => setDraft(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <li className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-4 first:border-t-0 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip variant={SOURCE_VARIANT[setting.source] ?? 'neutral'} title={t(`administration.settings.sourceHint.${setting.source}`)}>
          {t(`administration.settings.source.${setting.source}`)}
        </StatusChip>
        {setting.fallback ? <code className="text-[11px] text-zinc-500 dark:text-zinc-400">{setting.fallback}</code> : null}
      </div>
      {logo ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{setting.key}</span>
          {setting.description ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{setting.description}</p> : null}
          {isImage(draft) ? (
            <img src={draft as string} alt="" className="max-h-20 max-w-xs self-start rounded border border-zinc-200 bg-white p-1 dark:border-zinc-700" />
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700">
              {t('administration.settings.logoUpload')}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            <input
              aria-label={setting.key}
              value={typeof draft === 'string' && !draft.startsWith('data:') ? draft : ''}
              placeholder={typeof draft === 'string' && draft.startsWith('data:') ? t('administration.settings.logoEmbedded') : t('administration.settings.logoUrl')}
              onChange={(e) => setDraft(e.target.value || '')}
              className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100"
            />
          </div>
        </div>
      ) : (
        <SchemaField schema={schema} root={schema} name={setting.key} value={draft} required disabled={save.isPending} onChange={setDraft} />
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.settings.defaultValue', { value: show(setting.default) })}</p>
      {error ? <p className="text-xs text-redText dark:text-red">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={() => run(draft ?? null)} disabled={!dirty || save.isPending}>
          {t('administration.settings.save')}
        </Button>
        {setting.source === 'stored' ? (
          <button
            type="button"
            onClick={() => run(null)}
            disabled={save.isPending}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {t('administration.settings.reset')}
          </button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Instance settings (elvira-portal#47, catalog #20): every key the catalog declares, one field per key from its
 * JSON Schema, with its default and where the value comes from (stored here, the `EVILFLOWERS_*` deployment
 * setting, or the built-in default). Saving stores it; "reset" drops the stored value so the key inherits again.
 */
const AdminSettings = () => {
  const { t } = useTranslation();
  const settings = useSettings();
  const policies = useContentPolicies();
  const [filter, setFilter] = useState('');
  const unavailable = settings.isError && isUnavailable(settings.error);
  const policyKeys = useMemo(() => (policies.data ?? []).map((p) => p.key), [policies.data]);

  // Grouped by the key's prefix (`content.default_policy` → content).
  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const map = new Map<string, ISetting[]>();
    for (const setting of settings.data ?? []) {
      if (needle && !setting.key.toLowerCase().includes(needle) && !(setting.description ?? '').toLowerCase().includes(needle)) continue;
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
        <p className="px-4 text-sm text-redText dark:text-red">{problemOf(settings.error) ?? t('administration.settings.loadError')}</p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4 px-4">
          <SearchField value={filter} onChange={setFilter} label={t('administration.settings.filter')} placeholder={t('administration.settings.filter')} />
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
                    <SettingRow key={setting.key} setting={setting} policyKeys={policyKeys} />
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
