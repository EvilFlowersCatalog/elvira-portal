import { IoMdDownload } from 'react-icons/io';
import {
  IDENTIFIERS_TYPE,
  IPartParams,
} from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';
import CircleLoader from 'react-spinners/CircleLoader';
import ElviraInput from '../../inputs/ElviraInput';
import { ChangeEvent, useState } from 'react';
import useGetData from '../../../hooks/api/identifiers/useGetData';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../admin/ConfirmDialog';
import Select from '../../primitives/Select';
import { FiX } from 'react-icons/fi';
import { useExternalSystems } from '../../../hooks/api/harvest/useHarvest';
import { BIBLIOGRAPHIC_IDENTIFIER_KEYS } from '../../../utils/interfaces/harvest';

interface FetchedMeta {
  title?: string;
  authors?: { name: string; surname: string }[];
  publisher?: string;
  year?: string;
  language?: string;
  bibtex?: string;
}

const IdentifiersPart = ({ entry, setEntry }: IPartParams) => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();

  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);
  const [pending, setPending] = useState<FetchedMeta | null>(null);

  const getData = useGetData();

  /** Fill only empty fields; return true if any existing non-empty field would change. */
  const applyFillingEmpties = (info: FetchedMeta) => {
    const hasAuthors = (entry.authors ?? []).some((a) => a.name || a.surname);
    const next = {
      ...entry!,
      title: entry?.title || info.title || '',
      authors: hasAuthors ? entry.authors : info.authors ?? entry?.authors ?? [],
      publisher: entry?.publisher || info.publisher || '',
      published_at: entry?.published_at || info.year || '',
      language_code: entry?.language_code || info.language,
      citation: entry?.citation || info.bibtex,
    };
    setEntry(next);
    // Would replacing overwrite anything the user already typed?
    return (
      (!!entry?.title && !!info.title && entry.title !== info.title) ||
      (hasAuthors && !!info.authors?.length) ||
      (!!entry?.publisher && !!info.publisher && entry.publisher !== info.publisher) ||
      (!!entry?.published_at && !!info.year && entry.published_at !== info.year) ||
      (!!entry?.citation && !!info.bibtex && entry.citation !== info.bibtex)
    );
  };

  const applyReplaceAll = (info: FetchedMeta) => {
    setEntry({
      ...entry!,
      title: info.title ?? entry?.title ?? '',
      authors: info.authors ?? entry?.authors ?? [],
      publisher: info.publisher ?? entry?.publisher ?? '',
      published_at: info.year ?? entry?.published_at ?? '',
      language_code: info.language ?? entry?.language_code,
      citation: info.bibtex ?? entry?.citation,
    });
  };

  const handleIdentifier = async (driver: IDENTIFIERS_TYPE, identifier: string) => {
    try {
      setLoadingInfo(true);
      const info = (await getData(driver, identifier)) as FetchedMeta;
      const hasConflict = applyFillingEmpties(info);
      if (hasConflict) {
        // Don't silently clobber what the user typed — ask first.
        setPending(info);
      }
      toast.success(t('notifications.dataFromIdentifiers.success'));
    } catch {
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleDOIChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({ ...entry, identifiers: { ...(entry?.identifiers ?? {}), doi: event.target.value } });
  };
  const handleISBNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({ ...entry, identifiers: { ...(entry?.identifiers ?? {}), isbn: event.target.value } });
  };

  const fetchButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="absolute right-2 top-[30px] z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-primaryText hover:bg-primaryLight dark:text-primaryLight dark:hover:bg-primaryDark"
    >
      <IoMdDownload size={18} />
    </button>
  );

  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t('entry.wizard.identifiers')}</span>
      {loadingInfo ? (
        <div className="flex h-full items-center justify-center py-6">
          <CircleLoader color={'var(--color-primary)'} size={30} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative flex w-full items-center gap-2">
            <ElviraInput onChange={handleDOIChange} placeholder={'DOI'} value={entry.identifiers?.doi ?? ''} />
            {fetchButton(t('entry.wizard.fetchFromDoi'), () => {
              if (entry.identifiers.doi) {
                umamiTrack('DOI Identifier Download Button', { identifier: entry.identifiers.doi });
                handleIdentifier(IDENTIFIERS_TYPE.doi, entry.identifiers.doi);
              }
            })}
          </div>
          <div className="relative flex w-full items-center gap-2">
            <ElviraInput onChange={handleISBNChange} placeholder={'ISBN'} value={entry.identifiers?.isbn ?? ''} />
            {fetchButton(t('entry.wizard.fetchFromIsbn'), () => {
              if (entry.identifiers.isbn) {
                umamiTrack('ISBN Identifier Download Button', { identifier: entry.identifiers.isbn });
                handleIdentifier(IDENTIFIERS_TYPE.isbn, entry.identifiers.isbn);
              }
            })}
          </div>
        </div>
      )}

      <OtherIdentifiers entry={entry} setEntry={setEntry} />

      <ConfirmDialog
        open={pending !== null}
        title={t('entry.wizard.metadataReplaceTitle')}
        message={t('entry.wizard.metadataReplaceBody')}
        confirmLabel={t('entry.wizard.metadataReplace')}
        cancelLabel={t('entry.wizard.metadataKeep')}
        onConfirm={() => {
          if (pending) applyReplaceAll(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};

/**
 * Every identifier besides DOI and ISBN (IP-033 Q8): `issn`, `ccnb`, the Dataverse ids and one key per configured
 * external system (`arl_stu` …), which is how a book stays linked to that system. Unknown keys are refused (422), so
 * new ones are picked from the allowed set; keys already on the entry are always shown and kept.
 */
function OtherIdentifiers({ entry, setEntry }: IPartParams) {
  const { t } = useTranslation();
  const { data: systems = [] } = useExternalSystems();
  const identifiers = (entry.identifiers ?? {}) as Record<string, string>;
  const shown = Object.keys(identifiers).filter((key) => key !== 'doi' && key !== 'isbn');
  const systemName = new Map(systems.map((s) => [s.key, s.name]));
  const allowed = [
    ...BIBLIOGRAPHIC_IDENTIFIER_KEYS.filter((key) => key !== 'doi' && key !== 'isbn'),
    ...systems.map((s) => s.key),
  ].filter((key, i, all) => all.indexOf(key) === i && !shown.includes(key));

  const setValue = (key: string, value: string) =>
    setEntry({ ...entry, identifiers: { ...identifiers, [key]: value } as typeof entry.identifiers });
  const remove = (key: string) => {
    const next = { ...identifiers };
    delete next[key];
    setEntry({ ...entry, identifiers: next as typeof entry.identifiers });
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-700">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('entry.wizard.otherIdentifiers')}</span>
      {shown.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <label htmlFor={`identifier-${key}`} className="w-28 shrink-0 truncate text-xs text-zinc-600 dark:text-zinc-300" title={key}>
            {systemName.get(key) ?? key.toUpperCase()}
          </label>
          <input
            id={`identifier-${key}`}
            value={identifiers[key] ?? ''}
            onChange={(e) => setValue(key, e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40"
          />
          <button
            type="button"
            aria-label={t('entry.wizard.removeIdentifier', { key })}
            title={t('entry.wizard.removeIdentifierHint')}
            onClick={() => remove(key)}
            className="text-zinc-400 hover:text-redText dark:hover:text-red"
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
      {allowed.length > 0 && (
        <Select
          aria-label={t('entry.wizard.addIdentifier')}
          value=""
          placeholder={t('entry.wizard.addIdentifier')}
          onChange={(key) => key && setValue(key, '')}
          options={allowed.map((key) => ({ value: key, label: systemName.get(key) ? `${systemName.get(key)} (${key})` : key.toUpperCase() }))}
          triggerClassName="h-8 rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 text-xs"
        />
      )}
    </div>
  );
}

export default IdentifiersPart;
