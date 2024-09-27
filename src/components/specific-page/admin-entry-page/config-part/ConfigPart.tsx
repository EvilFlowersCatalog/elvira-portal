import { useTranslation } from 'react-i18next';
import { IEntryNewForm } from '../../../../utils/interfaces/entry';
import ConfigItem from './ConfigItem';
import { IPartParams } from '../../../../utils/interfaces/general/general';

const ConfigPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();

  return (
    <div className='flex flex-col flex-2 gap-2'>
      <span>{t('entry.wizard.configuration')}</span>
      <div className='bg-white dark:bg-gray flex-1 rounded-md grid grid-cols-2 xxl:grid-cols-3 gap-4'>
        <ConfigItem
          name={t('entry.wizard.download')}
          checked={entry.config?.evilflowres_metadata_fetch ?? false}
          onChange={(e) => {
            umami.track('Download Config Button', {
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
            umami.track('Share Config Button', {
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
            umami.track('Print Config Button', {
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
            umami.track('Annotation Config Button', {
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
          name={'DRM'}
          checked={entry.config?.evilflowers_ocr_rewrite ?? false}
          onChange={(e) => {
            umami.track('DRM Config Button', {
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
      </div>
    </div>
  );
};

export default ConfigPart;
