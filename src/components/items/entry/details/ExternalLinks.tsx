import { useTranslation } from 'react-i18next';
import { FiExternalLink } from 'react-icons/fi';
import { useExternalSystems } from '../../../../hooks/api/harvest/useHarvest';
import { recordUrl } from '../../../admin/harvest/harvestFormat';
import { IEntryIdentifiers } from '../../../../utils/interfaces/entry';

/**
 * Outward links of a publication for readers (#52): an `identifiers` key that names a configured external system with
 * a record URL template becomes "View in <system>" — the STU library catalogue, a Dataverse, a partner library. Built
 * from `GET /api/v1/external-systems`, so a new system appears without a portal change. Nothing when there are none.
 */
export default function ExternalLinks({ identifiers }: { identifiers?: Partial<IEntryIdentifiers> | null }) {
  const { t } = useTranslation();
  const { data: systems = [] } = useExternalSystems(!!identifiers && Object.keys(identifiers).length > 0);

  const links = systems
    .map((system) => {
      const id = identifiers?.[system.key];
      const url = id ? recordUrl(system.record_url_template, id) : null;
      return url ? { key: system.key, name: system.name, kind: system.kind, url } : null;
    })
    .filter((link): link is NonNullable<typeof link> => link !== null);

  if (!links.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1 text-sm text-secondary hover:bg-primaryLight dark:border-zinc-600 dark:text-secondaryLight dark:hover:bg-primaryDark"
        >
          <FiExternalLink size={14} />
          {/* A library catalogue holds the printed copy; anything else is "View in". */}
          {link.kind === 'ils' ? t('entry.detail.inPrintAt', { name: link.name }) : t('entry.detail.viewIn', { name: link.name })}
        </a>
      ))}
    </div>
  );
}
