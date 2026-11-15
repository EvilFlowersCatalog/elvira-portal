import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Drawer from '../Drawer';
import Tabs from '../Tabs';
import { Field, TextInput } from '../Field';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';
import SchemaForm from './SchemaForm';
import ExplainPanel from './ExplainPanel';
import {
  problemOf,
  useContentPolicies,
  useContentPolicy,
  useContentPolicySchema,
  useContentPolicyVersions,
  useSaveContentPolicy,
} from '../../../hooks/api/contentPolicies/useContentPolicies';
import { documentDiff } from '../../../utils/func/documentDiff';
import { IContentPolicyVersion, PolicyDocument } from '../../../utils/interfaces/contentPolicy';

const SELECT_TRIGGER = 'h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40';
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const show = (value: unknown) => (value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value));
const byWhom = (who: IContentPolicyVersion['updated_by']) =>
  !who ? '' : typeof who === 'string' ? who : who.username ?? who.id;

function History({
  policyKey,
  onRestore,
}: {
  policyKey: string;
  onRestore: (version: IContentPolicyVersion) => void;
}) {
  const { t, i18n } = useTranslation();
  const versions = useContentPolicyVersions(policyKey);
  const list = useMemo(() => versions.data ?? [], [versions.data]);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  // Newest against the one before it, until the admin picks others.
  useEffect(() => {
    if (list.length && to === null) {
      setTo(list[0].version);
      setFrom(list[1]?.version ?? list[0].version);
    }
  }, [list, to]);

  const a = list.find((v) => v.version === from);
  const b = list.find((v) => v.version === to);
  const changes = useMemo(() => (a && b ? documentDiff(a.document, b.document) : []), [a, b]);

  if (versions.isLoading) return <p className="text-sm text-zinc-400">…</p>;
  if (versions.isError) return <p className="text-sm text-redText dark:text-red">{t('administration.policies.history.error')}</p>;
  if (!list.length) return <p className="text-sm text-zinc-500">{t('administration.policies.history.empty')}</p>;

  const options = list.map((v) => ({
    value: String(v.version),
    label: `v${v.version} · ${new Date(v.created_at).toLocaleString(i18n.language)}${byWhom(v.updated_by) ? ` · ${byWhom(v.updated_by)}` : ''}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t('administration.policies.history.from')} htmlFor="diff-from">
          <Select id="diff-from" value={String(from ?? '')} onChange={(v) => setFrom(Number(v))} options={options} triggerClassName={SELECT_TRIGGER} />
        </Field>
        <Field label={t('administration.policies.history.to')} htmlFor="diff-to">
          <Select id="diff-to" value={String(to ?? '')} onChange={(v) => setTo(Number(v))} options={options} triggerClassName={SELECT_TRIGGER} />
        </Field>
      </div>

      {a && b && a.version === b.version ? (
        <p className="text-sm text-zinc-500">{t('administration.policies.history.same')}</p>
      ) : changes.length === 0 ? (
        <p className="text-sm text-zinc-500">{t('administration.policies.history.noChanges')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2">{t('administration.policies.history.path')}</th>
                <th scope="col" className="px-3 py-2">v{a?.version}</th>
                <th scope="col" className="px-3 py-2">v{b?.version}</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <tr key={change.path} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="px-3 py-1.5 font-mono text-xs text-zinc-700 dark:text-zinc-200">{change.path}</td>
                  <td className="px-3 py-1.5 font-mono text-xs text-redText line-through decoration-1 dark:text-red">{show(change.before)}</td>
                  <td className="px-3 py-1.5 font-mono text-xs text-green-700 dark:text-green-400">{show(change.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {a && list[0] && a.version !== list[0].version ? (
        <button
          type="button"
          onClick={() => onRestore(a)}
          className="self-start text-sm font-medium text-primary hover:underline dark:text-primaryLight"
        >
          {t('administration.policies.history.restore', { version: a.version })}
        </button>
      ) : null}
    </div>
  );
}

/**
 * One content policy (elvira-portal#47): its document as a form generated from the catalog's JSON Schema, the
 * version history with a diff of any two versions, and "explain" against the unsaved draft. A save writes a new
 * version, which applies right away. In create mode the document starts from a preset (an existing policy).
 */
export default function PolicyDrawer({
  open,
  policyKey,
  onClose,
}: {
  open: boolean;
  /** The policy to edit; null creates a new one from a preset. */
  policyKey: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const creating = policyKey === null;
  const [tab, setTab] = useState<'edit' | 'history' | 'explain'>('edit');
  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');
  const [preset, setPreset] = useState<string>('');
  const [draft, setDraft] = useState<PolicyDocument>({});
  const [dirty, setDirty] = useState(false);
  const [keyError, setKeyError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);

  const policies = useContentPolicies(open);
  const schema = useContentPolicySchema(open);
  // The stored policy, or the preset a new one starts from.
  const source = useContentPolicy(open ? (creating ? preset || null : policyKey) : null);
  const save = useSaveContentPolicy();

  useEffect(() => {
    if (!open) return;
    setTab('edit');
    setKeyError(undefined);
    setSaveError(null);
    setDirty(false);
    setKey('');
    setPreset('');
    if (creating) {
      setTitle('');
      setDraft({});
    }
  }, [open, creating, policyKey]);

  // A loaded policy (or newly picked preset) becomes the draft, unless the admin already changed it.
  useEffect(() => {
    if (!source.data || dirty) return;
    setDraft((source.data.document ?? {}) as PolicyDocument);
    if (!creating) setTitle(source.data.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.data]);

  const edit = (next: PolicyDocument) => {
    setDraft(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (creating && !KEY_PATTERN.test(key)) {
      setKeyError(t('administration.policies.keyInvalid'));
      return;
    }
    try {
      // The document carries its own key and title too (the YAML in #174 does); keep them in step.
      const saved = await save.mutateAsync({
        key: creating ? key : policyKey!,
        title: title.trim() || (creating ? key : policyKey!),
        document: { ...draft, key: creating ? key : policyKey!, title: title.trim() || draft.title },
        create: creating,
      });
      toast.success(t('administration.policies.saved', { version: saved?.version ?? '' }));
      setDirty(false);
      if (creating) onClose();
    } catch (error) {
      setSaveError(problemOf(error) ?? t('administration.policies.saveError'));
    }
  };

  const presetOptions = (policies.data ?? []).map((p) => ({ value: p.key, label: `${p.title} (${p.key})` }));
  const current = !creating ? source.data : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={creating ? t('administration.policies.createTitle') : current?.title ?? policyKey ?? ''}
      description={
        creating ? t('administration.policies.createHint') : current ? `policy:${current.key}@${current.version}` : undefined
      }
      footer={
        tab === 'edit' ? (
          <>
            {saveError ? <p className="mr-auto max-w-sm text-xs text-redText dark:text-red">{saveError}</p> : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {t('administration.policies.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={save.isPending || (!creating && !dirty) || (creating && !preset)}>
              {save.isPending ? '…' : creating ? t('administration.policies.create') : t('administration.policies.saveVersion')}
            </Button>
          </>
        ) : undefined
      }
    >
      {!creating && (
        <Tabs
          label={t('administration.policies.title')}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
          tabs={[
            { id: 'edit', label: t('administration.policies.tabEdit') },
            { id: 'history', label: t('administration.policies.tabHistory') },
            { id: 'explain', label: t('administration.policies.tabExplain') },
          ]}
          className="mb-4"
        />
      )}

      {tab === 'edit' && (
        <div className="flex flex-col gap-4">
          {creating && (
            <>
              <Field label={t('administration.policies.preset')} htmlFor="policy-preset" required hint={t('administration.policies.presetHint')}>
                <Select
                  id="policy-preset"
                  value={preset}
                  onChange={(value) => {
                    setPreset(value);
                    setDirty(false);
                  }}
                  options={presetOptions}
                  placeholder={t('administration.policies.presetPlaceholder')}
                  triggerClassName={SELECT_TRIGGER}
                />
              </Field>
              <Field label={t('administration.policies.key')} htmlFor="policy-key" required hint={t('administration.policies.keyHint')} error={keyError}>
                <TextInput
                  id="policy-key"
                  value={key}
                  invalid={!!keyError}
                  onChange={(e) => {
                    setKey(e.target.value.trim().toLowerCase());
                    setKeyError(undefined);
                  }}
                />
              </Field>
            </>
          )}
          <Field label={t('administration.policies.titleField')} htmlFor="policy-title">
            <TextInput
              id="policy-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
            />
          </Field>

          {source.isLoading || schema.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-700/50" />
              ))}
            </div>
          ) : creating && !preset ? null : (
            <SchemaForm schema={schema.data} value={draft} onChange={edit} />
          )}
        </div>
      )}

      {tab === 'history' && policyKey && (
        <History
          policyKey={policyKey}
          onRestore={(version) => {
            setDraft(version.document);
            setTitle(version.title);
            setDirty(true);
            setTab('edit');
            toast.info(t('administration.policies.history.restored', { version: version.version }));
          }}
        />
      )}

      {tab === 'explain' && policyKey && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dirty ? t('administration.policies.explain.draftHint') : t('administration.policies.explain.savedHint')}
          </p>
          <ExplainPanel policyKey={policyKey} document={dirty ? draft : undefined} />
        </div>
      )}
    </Drawer>
  );
}
