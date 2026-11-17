import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Select from '../../primitives/Select';
import { useFeature } from '../../../features/features';
import {
  problemOf,
  useAssignContentPolicy,
  useCatalogPolicy,
  useContentPolicies,
} from '../../../hooks/api/contentPolicies/useContentPolicies';

/**
 * Assigns an existing content policy (elvira-portal#47) to a catalog or one entry, with "Inherit" as the default.
 * It saves on change through `POST /content-policies/{key|inherit}/assign` — neither the catalog nor the entry
 * form can carry the key (the entry config merges, so it could never be cleared). It lists policies only;
 * editing happens on the policies page. Renders nothing while the catalog has no policies API.
 */
export default function ContentPolicyPicker({
  id,
  catalogId,
  entryId,
  entryValue,
  inheritLabel,
  hint,
}: {
  id: string;
  catalogId?: string;
  entryId?: string;
  /** The entry's `config.content_policy`, as loaded with the entry. */
  entryValue?: string | null;
  inheritLabel: string;
  hint: string;
}) {
  const { t } = useTranslation();
  // With the policies page (Administration › Features): no request on entry and catalog forms while it is off.
  const enabled = useFeature('contentPolicies');
  const policies = useContentPolicies(enabled);
  const catalogPolicy = useCatalogPolicy(catalogId ?? null, enabled && !entryId);
  const assign = useAssignContentPolicy();
  const [value, setValue] = useState<string | null>(entryId ? entryValue ?? null : null);

  useEffect(() => {
    if (entryId) setValue(entryValue ?? null);
  }, [entryId, entryValue]);
  useEffect(() => {
    if (!entryId && catalogPolicy.data !== undefined) setValue(catalogPolicy.data);
  }, [entryId, catalogPolicy.data]);

  if (!enabled || policies.isError || !policies.data?.length || (!entryId && !catalogId)) return null;

  const change = async (selected: string) => {
    const key = selected || null;
    const previous = value;
    setValue(key);
    try {
      await assign.mutateAsync({ key, ...(entryId ? { entryIds: [entryId] } : { catalogId }) });
      toast.success(key ? t('administration.policies.picker.assigned', { key }) : t('administration.policies.picker.inherited'));
      if (!entryId) catalogPolicy.refetch();
    } catch (error) {
      setValue(previous);
      toast.error(problemOf(error) ?? t('administration.policies.picker.error'));
    }
  };

  const known = policies.data.some((p) => p.key === value);
  const options = [
    { value: '', label: inheritLabel },
    ...policies.data.map((p) => ({ value: p.key, label: `${p.title} (${p.key})` })),
    // A key the list no longer has stays visible rather than silently reading as "inherit".
    ...(value && !known ? [{ value, label: value }] : []),
  ];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {t('administration.policies.picker.label')}
      </label>
      <Select
        id={id}
        value={value ?? ''}
        onChange={change}
        disabled={assign.isPending || (!entryId && catalogPolicy.isLoading)}
        options={options}
        className="max-w-sm"
        triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}
