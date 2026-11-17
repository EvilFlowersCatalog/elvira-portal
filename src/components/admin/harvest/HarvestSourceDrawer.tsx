import { useEffect, useMemo, useState } from 'react';
import { config } from '@/lib/config';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import Drawer from '../Drawer';
import CopyId from '../CopyId';
import ConfirmDialog from '../ConfirmDialog';
import { Field, Switch, TextInput } from '../Field';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';
import SchemaForm from '../policies/SchemaForm';
import { ICatalog } from '../../../utils/interfaces/catalog';
import {
  FIELD_POLICIES,
  FieldPolicy,
  HARVEST_MODES,
  HarvestMode,
  IHarvestSource,
  IHarvestSourcePayload,
  POLICY_FIELDS,
  policyDefault,
} from '../../../utils/interfaces/harvest';
import { useExternalSystems, useHarvestClient, useHarvestConnectors } from '../../../hooks/api/harvest/useHarvest';
import { useListCatalogs } from '../../../hooks/api/catalogs/useAdminCatalogs';
import { problemDetailMessage, validationErrorsByField } from '../../../utils/problemDetail';
import { SCHEDULE_PRESETS, describeSchedule } from './harvestFormat';

interface HarvestSourceDrawerProps {
  open: boolean;
  /** null => create mode. */
  source: IHarvestSource | null;
  onClose: () => void;
  onSaved: (source: IHarvestSource) => void;
  onDeleted?: () => void;
}

interface FormState {
  name: string;
  slug: string;
  adapter: string;
  targetCatalogId: string;
  baseUrl: string;
  metadataPrefix: string;
  setSpec: string;
  systemKey: string;
  mode: HarvestMode;
  fieldPolicy: Record<string, FieldPolicy>;
  schedule: string;
  enabled: boolean;
  oaiReexpose: boolean;
  config: Record<string, unknown>;
}

const fullPolicy = (stored?: Partial<Record<string, FieldPolicy>>): Record<string, FieldPolicy> =>
  Object.fromEntries(POLICY_FIELDS.map((field) => [field, stored?.[field] ?? policyDefault(field)]));

const EMPTY: FormState = {
  name: '',
  slug: '',
  adapter: '',
  targetCatalogId: config.ELVIRA_CATALOG_ID,
  baseUrl: '',
  metadataPrefix: 'marc21',
  setSpec: '',
  systemKey: '',
  mode: 'link_only',
  fieldPolicy: fullPolicy(),
  schedule: '',
  enabled: false,
  oaiReexpose: true,
  config: {},
};

/** "STU library (ARL)" → "stu-library-arl": a slug the API accepts (`SlugField`, at most 72). */
const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

type Errors = Partial<Record<keyof FormState | 'form', string>>;

/** API field → form field, for the 422 `validation_errors` paths. */
const API_FIELDS: Record<string, keyof FormState> = {
  name: 'name',
  slug: 'slug',
  adapter: 'adapter',
  target_catalog_id: 'targetCatalogId',
  base_url: 'baseUrl',
  metadata_prefix: 'metadataPrefix',
  set_spec: 'setSpec',
  system_key: 'systemKey',
  mode: 'mode',
  field_policy: 'fieldPolicy',
  schedule: 'schedule',
  config: 'config',
};

/**
 * Create or edit a harvest source (#51). The form follows the connector: base URL only when it needs one,
 * `sync` only when it can write, its own settings rendered from `config_schema`. No field ever takes a token or
 * password: secrets live in the server environment and the API refuses credential-like config keys.
 */
export default function HarvestSourceDrawer({ open, source, onClose, onSaved, onDeleted }: HarvestSourceDrawerProps) {
  const { t } = useTranslation();
  const mode = source ? 'edit' : 'create';
  const api = useHarvestClient();
  const listCatalogs = useListCatalogs();
  const { data: connectors = [] } = useHarvestConnectors();
  const { data: systems = [] } = useExternalSystems(open);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [catalogs, setCatalogs] = useState<ICatalog[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSlugTouched(!!source);
    setForm(
      source
        ? {
            name: source.name,
            slug: source.slug,
            adapter: source.adapter,
            targetCatalogId: source.target_catalog_id,
            baseUrl: source.base_url ?? '',
            metadataPrefix: source.metadata_prefix || 'marc21',
            setSpec: source.set_spec ?? '',
            systemKey: source.system_key,
            mode: source.mode,
            fieldPolicy: fullPolicy(source.field_policy),
            schedule: source.schedule ?? '',
            enabled: source.enabled,
            oaiReexpose: source.oai_reexpose,
            config: source.config ?? {},
          }
        : EMPTY
    );
    listCatalogs({ orderBy: 'title' })
      .then(({ items }) => setCatalogs(items))
      .catch(() => setCatalogs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source]);

  // A new source starts on the first connector once they have loaded.
  useEffect(() => {
    if (open && !source && !form.adapter && connectors.length) setForm((f) => ({ ...f, adapter: connectors[0].name }));
  }, [open, source, form.adapter, connectors]);

  const connector = connectors.find((c) => c.name === form.adapter);
  const canWrite = !!connector?.capabilities.includes('write');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  // External systems, plus the keys the connector owns once the catalog lists them (EvilFlowersCatalog#210).
  const keyChoices = useMemo(
    () => [
      ...systems.map((s) => ({ key: s.key, name: s.name })),
      ...(connector?.system_keys ?? []).filter((key) => !systems.some((s) => s.key === key)).map((key) => ({ key, name: connector!.title })),
    ],
    [systems, connector]
  );

  const validate = () => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = t('administration.harvest.form.required');
    if (!form.slug.trim()) e.slug = t('administration.harvest.form.required');
    if (!form.adapter) e.adapter = t('administration.harvest.form.required');
    if (!form.targetCatalogId) e.targetCatalogId = t('administration.harvest.form.required');
    if (!form.systemKey.trim()) e.systemKey = t('administration.harvest.form.required');
    if (connector?.needs_base_url && !form.baseUrl.trim()) e.baseUrl = t('administration.harvest.form.required');
    if (form.mode === 'sync' && !canWrite) e.mode = t('administration.harvest.form.syncNeedsWrite');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const payload = (): IHarvestSourcePayload => ({
    slug: form.slug.trim(),
    name: form.name.trim(),
    adapter: form.adapter,
    system_key: form.systemKey.trim(),
    target_catalog_id: form.targetCatalogId,
    base_url: connector?.needs_base_url ? form.baseUrl.trim() || null : null,
    ...(connector?.needs_base_url
      ? { metadata_prefix: form.metadataPrefix.trim() || 'marc21', set_spec: form.setSpec.trim() || null }
      : {}),
    mode: form.mode,
    // Only what differs from the catalog's defaults, so a later default change still reaches untouched fields.
    field_policy: Object.fromEntries(Object.entries(form.fieldPolicy).filter(([field, value]) => value !== policyDefault(field))),
    schedule: form.schedule.trim(),
    enabled: form.enabled,
    oai_reexpose: form.oaiReexpose,
    config: connector?.config_schema ? form.config : {},
  });

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = source ? await api.update(source.id, payload()) : await api.create(payload());
      toast.success(source ? t('administration.harvest.form.saved') : t('administration.harvest.form.created'));
      onSaved(saved);
      onClose();
    } catch (e: any) {
      const status = e?.response?.status;
      const byField = validationErrorsByField(e);
      const next: Errors = {};
      for (const [apiField, message] of Object.entries(byField)) {
        const field = API_FIELDS[apiField];
        if (field) next[field] = message;
        else next.form = next.form ? `${next.form} ${message}` : message;
      }
      if (status === 409) next.slug = t('administration.harvest.form.slugTaken');
      // A 422 without field paths (sync on a read-only connector, a changed slug) carries its reason in `detail`.
      if (status === 422 && !Object.keys(next).length) next.form = problemDetailMessage(e, t('administration.harvest.form.saveError'));
      setErrors(next);
      toast.error(next.slug ?? next.form ?? Object.values(next)[0] ?? problemDetailMessage(e, t('administration.harvest.form.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!source) return;
    setDeleting(true);
    try {
      await api.remove(source.id);
      toast.success(t('administration.harvest.form.deleted'));
      setConfirmDelete(false);
      onClose();
      onDeleted?.();
    } catch (e) {
      toast.error(problemDetailMessage(e, t('administration.harvest.form.deleteError')));
    } finally {
      setDeleting(false);
    }
  };

  const sectionTitle = 'text-sm font-semibold text-zinc-700 dark:text-zinc-200';
  const box = 'flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700';
  const triggerClass = 'h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40';

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width="max-w-2xl"
        title={mode === 'create' ? t('administration.harvest.form.createTitle') : t('administration.harvest.form.editTitle')}
        description={source?.name}
        meta={source ? <CopyId value={source.id} label={t('administration.harvest.sourceId')} /> : undefined}
        footer={
          <>
            {source && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText hover:bg-red/10 dark:text-red"
              >
                <FiTrash2 size={15} />
                {t('administration.harvest.form.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {t('administration.harvest.form.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.harvest.form.create') : t('administration.harvest.form.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {errors.form && (
            <p role="alert" className="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-sm text-redText dark:text-red">
              {errors.form}
            </p>
          )}

          {/* Connector: decides which of the fields below exist. */}
          <section className="flex flex-col gap-2">
            <h3 className={sectionTitle}>{t('administration.harvest.form.connector')}</h3>
            <div role="radiogroup" aria-label={t('administration.harvest.form.connector')} className="grid gap-2 sm:grid-cols-2">
              {connectors.map((c) => {
                const selected = form.adapter === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      set('adapter', c.name);
                      // A mode the new connector cannot do falls back to the default.
                      if (form.mode === 'sync' && !c.capabilities.includes('write')) set('mode', 'link_only');
                      if (c.name !== form.adapter) set('config', {});
                    }}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primaryLight/60 dark:bg-primaryDark/40'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{c.title}</span>
                    <span className="line-clamp-3 text-xs text-zinc-500 dark:text-zinc-400">{c.description}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {c.capabilities.map((cap) => (
                        <span key={cap} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                          {t(`administration.harvest.capability.${cap}`, { defaultValue: cap })}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.adapter && <p className="text-xs text-redText dark:text-red">{errors.adapter}</p>}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('administration.harvest.form.name')} htmlFor="hs-name" required error={errors.name}>
              <TextInput
                id="hs-name"
                value={form.name}
                invalid={!!errors.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
              />
            </Field>
            <Field
              label={t('administration.harvest.form.slug')}
              htmlFor="hs-slug"
              required
              hint={source ? t('administration.harvest.form.slugLocked') : t('administration.harvest.form.slugHint')}
              error={errors.slug}
            >
              <TextInput
                id="hs-slug"
                value={form.slug}
                invalid={!!errors.slug}
                disabled={!!source}
                maxLength={72}
                className="font-mono disabled:opacity-60"
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </Field>
          </div>

          <Field label={t('administration.harvest.form.targetCatalog')} htmlFor="hs-catalog" required error={errors.targetCatalogId}>
            <Select
              id="hs-catalog"
              value={form.targetCatalogId}
              placeholder={t('administration.harvest.form.pickCatalog')}
              onChange={(v) => set('targetCatalogId', v)}
              options={catalogs.map((c) => ({ value: c.id, label: c.title }))}
              triggerClassName={triggerClass}
            />
          </Field>

          {connector?.needs_base_url && (
            <div className={box}>
              <Field label={t('administration.harvest.form.baseUrl')} htmlFor="hs-base" required hint={t('administration.harvest.form.baseUrlHint')} error={errors.baseUrl}>
                <TextInput
                  id="hs-base"
                  type="url"
                  inputMode="url"
                  placeholder="https://…/oai"
                  value={form.baseUrl}
                  invalid={!!errors.baseUrl}
                  onChange={(e) => set('baseUrl', e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('administration.harvest.form.metadataPrefix')} htmlFor="hs-prefix" hint={t('administration.harvest.form.metadataPrefixHint')} error={errors.metadataPrefix}>
                  <TextInput id="hs-prefix" className="font-mono" value={form.metadataPrefix} onChange={(e) => set('metadataPrefix', e.target.value)} />
                </Field>
                <Field label={t('administration.harvest.form.setSpec')} htmlFor="hs-set" hint={t('administration.harvest.form.setSpecHint')} error={errors.setSpec}>
                  <TextInput id="hs-set" className="font-mono" value={form.setSpec} onChange={(e) => set('setSpec', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {connector?.needs_upload && (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
              {t('administration.harvest.form.uploadLater')}
            </p>
          )}

          <Field label={t('administration.harvest.form.systemKey')} htmlFor="hs-system" required hint={t('administration.harvest.form.systemKeyHint')} error={errors.systemKey}>
            <TextInput
              id="hs-system"
              list="hs-system-keys"
              className="font-mono"
              value={form.systemKey}
              invalid={!!errors.systemKey}
              onChange={(e) => set('systemKey', e.target.value.trim())}
            />
            <datalist id="hs-system-keys">
              {keyChoices.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </datalist>
            {keyChoices.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {keyChoices.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => set('systemKey', s.key)}
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      form.systemKey === s.key
                        ? 'border-primary bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                        : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s.name} <code className="ml-0.5 opacity-70">{s.key}</code>
                  </button>
                ))}
              </div>
            )}
          </Field>

          {/* Mode */}
          <section className="flex flex-col gap-2">
            <h3 className={sectionTitle}>{t('administration.harvest.form.mode')}</h3>
            <div role="radiogroup" aria-label={t('administration.harvest.form.mode')} className="grid gap-2 sm:grid-cols-2">
              {HARVEST_MODES.map((m) => {
                const disabled = m === 'sync' && !canWrite;
                const selected = form.mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => set('mode', m)}
                    title={disabled ? t('administration.harvest.form.syncNeedsWrite') : undefined}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? 'border-primary bg-primaryLight/60 dark:bg-primaryDark/40'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t(`administration.harvest.mode.${m}`)}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{t(`administration.harvest.modeHint.${m}`)}</span>
                  </button>
                );
              })}
            </div>
            {!canWrite && connector && <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.form.syncNeedsWrite')}</p>}
            {errors.mode && <p className="text-xs text-redText dark:text-red">{errors.mode}</p>}
          </section>

          {/* What a harvest may write, per field. Link-only never writes metadata. */}
          {form.mode !== 'link_only' && (
            <section className="flex flex-col gap-2">
              <h3 className={sectionTitle}>{t('administration.harvest.form.fieldPolicy')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.form.fieldPolicyHint')}</p>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium">{t('administration.harvest.form.field')}</th>
                      {FIELD_POLICIES.map((p) => (
                        <th key={p} scope="col" className="px-3 py-2 text-center font-medium">{t(`administration.harvest.policy.${p}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POLICY_FIELDS.map((field) => (
                      <tr key={field} className="border-t border-zinc-100 dark:border-zinc-700/60">
                        <th scope="row" className="px-3 py-1.5 text-left font-normal text-zinc-700 dark:text-zinc-200">
                          {t(`administration.harvest.fields.${field}`)}
                        </th>
                        {FIELD_POLICIES.map((p) => (
                          <td key={p} className="px-3 py-1.5 text-center">
                            <input
                              type="radio"
                              name={`policy-${field}`}
                              aria-label={`${t(`administration.harvest.fields.${field}`)}: ${t(`administration.harvest.policy.${p}`)}`}
                              checked={form.fieldPolicy[field] === p}
                              onChange={() => set('fieldPolicy', { ...form.fieldPolicy, [field]: p })}
                              className="accent-primary"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.fieldPolicy && <p className="text-xs text-redText dark:text-red">{errors.fieldPolicy}</p>}
            </section>
          )}

          {/* Connector-specific settings, from its JSON Schema. Never secrets. */}
          {connector?.config_schema && (
            <section className={box}>
              <h3 className={sectionTitle}>{t('administration.harvest.form.config', { connector: connector.title })}</h3>
              <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.form.configHint')}</p>
              <SchemaForm schema={connector.config_schema} value={form.config} onChange={(v) => set('config', v)} />
              {errors.config && <p className="text-xs text-redText dark:text-red">{errors.config}</p>}
            </section>
          )}

          {/* Schedule */}
          <Field
            label={t('administration.harvest.form.schedule')}
            htmlFor="hs-schedule"
            hint={`${describeSchedule(form.schedule, t)} · ${t('administration.harvest.form.scheduleHint')}`}
            error={errors.schedule}
          >
            <div className="flex flex-wrap gap-1.5 pb-1.5">
              {SCHEDULE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => set('schedule', preset.cron)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    form.schedule.trim() === preset.cron
                      ? 'border-primary bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                      : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {t(`administration.harvest.schedule.preset.${preset.id}`)}
                </button>
              ))}
            </div>
            <TextInput
              id="hs-schedule"
              className="font-mono"
              placeholder="*/15 * * * *"
              value={form.schedule}
              invalid={!!errors.schedule}
              onChange={(e) => set('schedule', e.target.value)}
            />
          </Field>

          <div className={box}>
            <div>
              <Switch checked={form.enabled} onChange={(v) => set('enabled', v)} label={t('administration.harvest.form.enabled')} />
              <p className="ml-14 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.form.enabledHint')}</p>
            </div>
            <div>
              <Switch checked={form.oaiReexpose} onChange={(v) => set('oaiReexpose', v)} label={t('administration.harvest.form.oaiReexpose')} />
              <p className="ml-14 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.harvest.form.oaiReexposeHint')}</p>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.harvest.form.deleteTitle')}
        message={t('administration.harvest.form.deleteBody', { name: source?.name ?? '' })}
        confirmLabel={t('administration.harvest.form.delete')}
        cancelLabel={t('administration.harvest.form.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
