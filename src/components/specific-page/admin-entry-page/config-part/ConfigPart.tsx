import { useTranslation } from 'react-i18next';
import ConfigItem from './ConfigItem';
import { IPartParams } from '../../../../utils/interfaces/general/general';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import ElviraNumberInput from '../../../inputs/ElviraNumberInput';

const ConfigPart = ({ entry, setEntry }: IPartParams) => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='flex flex-col flex-2 gap-2'>
      <span>{t('entry.wizard.configuration')}</span>
      <div className='flex-1 rounded-md flex flex-wrap gap-4'>
        <ConfigItem
          name={t('entry.wizard.download')}
          checked={entry.config?.evilflowres_metadata_fetch ?? false}
          onChange={(e) => {
            umamiTrack('Download Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowres_metadata_fetch: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem
          name={t('entry.wizard.share')}
          checked={entry.config?.evilflowers_share_enabled ?? false}
          onChange={(e) => {
            umamiTrack('Share Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowers_share_enabled: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem
          name={t('entry.wizard.print')}
          checked={entry.config?.evilflowers_viewer_print ?? false}
          onChange={(e) => {
            umamiTrack('Print Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowers_viewer_print: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem
          name={t('entry.wizard.annotations')}
          checked={entry.config?.evilflowers_annotations_create ?? false}
          onChange={(e) => {
            umamiTrack('Annotation Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowers_annotations_create: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem
          name={t('entry.wizard.ocrRewrite')}
          checked={entry.config?.evilflowers_ocr_rewrite ?? false}
          onChange={(e) => {
            umamiTrack('OCR Rewrite Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowers_ocr_rewrite: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem
          name={t('entry.wizard.readiumEnabled')}
          checked={entry.config?.readium_enabled ?? false}
          onChange={(e) => {
            umamiTrack('Readium Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                readium_enabled: e.target.checked,
              },
            });
          }}
        />
        <ConfigItem name={t('entry.wizard.intranetIpRestriction')}
          checked={entry.config?.evilflowers_ip_block ?? false}
          onChange={(e) => {
            umamiTrack('Intranet IP Block Config Button', {
              checked: e.target.checked,
            });
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                evilflowers_ip_block: e.target.checked,
              },
            });
          }}
        />
      </div>
      {entry.config?.readium_enabled && (
        <ElviraNumberInput
          placeholder={t('entry.wizard.readiumAmount')}
          value={entry.config?.readium_amount ?? 0}
          onChange={(e) => {
            setEntry({
              ...entry,
              config: {
                ...entry?.config!,
                readium_amount: parseInt(e.target.value) || 0,
              },
            });
          }}
        />
      )}
    </div>
  );
};

export default ConfigPart;
