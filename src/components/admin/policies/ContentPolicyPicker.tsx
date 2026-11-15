import { useTranslation } from 'react-i18next';
import Select from '../../primitives/Select';
import { useContentPolicies } from '../../../hooks/api/contentPolicies/useContentPolicies';

/**
 * Assigns an existing content policy (elvira-portal#47): a picker on the catalog settings and on entry edit, with
 * "inherit" as the default. It lists policies only — editing happens on the policies page. Renders nothing while
 * the catalog has no policies API (or none defined), so the forms stay as they were.
 */
export default function ContentPolicyPicker({
  id,
  value,
  onChange,
  inheritLabel,
  hint,
}: {
  id: string;
  value: string | null | undefined;
  onChange: (key: string | null) => void;
  /** What "inherit" falls back to here (the catalog's policy, the instance default). */
  inheritLabel: string;
  hint: string;
}) {
  const { t } = useTranslation();
  // Behind the flag with the policies page: no request (and no 404) on production entry and catalog forms.
  const enabled = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';
  const policies = useContentPolicies(enabled);
  if (!enabled) return null;
  if (policies.isError || !policies.data?.length) return null;

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
        onChange={(selected) => onChange(selected || null)}
        options={options}
        className="max-w-sm"
        triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}
