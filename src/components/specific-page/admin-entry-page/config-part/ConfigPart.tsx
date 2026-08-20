import { useTranslation } from 'react-i18next';
import { IPartParams, IConfig } from '../../../../utils/interfaces/general/general';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import { Switch } from '../../../admin/Field';
import Select from '../../../primitives/Select';

/** Boolean reader/access flags, rendered data-driven with helper text. */
type BoolKey = keyof Pick<
  IConfig,
  | 'evilflowers_share_enabled'
  | 'evilflowers_viewer_print'
  | 'evilflowers_annotations_create'
  | 'evilflowers_ocr_enabled'
  | 'evilflowers_ocr_rewrite'
  | 'evilflowers_ip_block'
  | 'evilflowers_metadata_fetch'
  | 'readium_enabled'
>;

const BOOL_FIELDS: { key: BoolKey; labelKey: string; helpKey: string; event: string }[] = [
  { key: 'evilflowers_annotations_create', labelKey: 'annotations', helpKey: 'annotations', event: 'Annotation Config Button' },
  { key: 'evilflowers_share_enabled', labelKey: 'share', helpKey: 'share', event: 'Share Config Button' },
  { key: 'evilflowers_viewer_print', labelKey: 'print', helpKey: 'print', event: 'Print Config Button' },
  { key: 'evilflowers_metadata_fetch', labelKey: 'download', helpKey: 'download', event: 'Download Config Button' },
  { key: 'evilflowers_ocr_enabled', labelKey: 'ocrEnable', helpKey: 'ocrEnable', event: 'OCR Enable Config Button' },
  { key: 'evilflowers_ocr_rewrite', labelKey: 'ocrRewrite', helpKey: 'ocrRewrite', event: 'OCR Rewrite Config Button' },
  { key: 'evilflowers_ip_block', labelKey: 'intranetIpRestriction', helpKey: 'intranetIpRestriction', event: 'Intranet IP Block Config Button' },
  { key: 'readium_enabled', labelKey: 'readiumEnabled', helpKey: 'readiumEnabled', event: 'Readium Config Button' },
];

const ConfigPart = ({ entry, setEntry }: IPartParams) => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();
  const config = entry.config;

  const setConfig = (patch: Partial<IConfig>) =>
    setEntry({ ...entry, config: { ...config!, ...patch } });

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t('entry.wizard.readerSection')}
      </span>

      {/* Reader mode (render_type) — previously hidden / set-once */}
      <div className="flex flex-col gap-1">
        <label htmlFor="render-type" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('entry.wizard.renderType')}
        </label>
        <Select
          id="render-type"
          value={config?.evilflowers_render_type ?? 'page'}
          onChange={(value) => {
            umamiTrack('Render Type Config', { value });
            setConfig({ evilflowers_render_type: value as IConfig['evilflowers_render_type'] });
          }}
          options={[
            { value: 'page', label: t('entry.wizard.renderTypePage') },
            { value: 'document', label: t('entry.wizard.renderTypeDocument') },
          ]}
          className="max-w-xs"
          triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('entry.wizard.configHelp.renderType')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {BOOL_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-0.5">
            <Switch
              checked={config?.[f.key] ?? false}
              onChange={(checked) => {
                umamiTrack(f.event, { checked });
                setConfig({ [f.key]: checked } as Partial<IConfig>);
              }}
              label={t(`entry.wizard.${f.labelKey}`)}
            />
            <p className="ml-14 text-xs text-zinc-500 dark:text-zinc-400">
              {t(`entry.wizard.configHelp.${f.helpKey}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Readium concurrent-reads amount (only when Readium is on) */}
      {config?.readium_enabled && (
        <div className="flex flex-col gap-1">
          <label htmlFor="readium-amount" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('entry.wizard.readiumAmount')}
          </label>
          <input
            id="readium-amount"
            type="number"
            min={0}
            value={config?.readium_amount ?? 0}
            onChange={(e) => setConfig({ readium_amount: parseInt(e.target.value) || 0 })}
            className="h-10 w-full max-w-[160px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 px-3 text-sm outline-none focus:border-primary"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('entry.wizard.configHelp.readiumAmount')}</p>
        </div>
      )}
    </div>
  );
};

export default ConfigPart;
