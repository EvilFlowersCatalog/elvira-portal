import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { FiCopy, FiDownload, FiX } from 'react-icons/fi';
import useEscapeLayer from '../../hooks/useEscapeLayer';
import useCite, { referenceText } from '../../hooks/api/assistant/useCite';
import { copyText } from '../../utils/func/clipboard';
import { CiteStyle, ICiteReference } from '../../utils/interfaces/assistant';

const STYLES: CiteStyle[] = ['iso690', 'apa', 'bibtex', 'csl-json'];
const STYLE_KEY = 'elvira.citeStyle';

/** The style the reader picked last (a per-browser convenience; ISO 690 when storage is unavailable). */
const savedStyle = (): CiteStyle => {
  try {
    const value = localStorage.getItem(STYLE_KEY);
    return STYLES.includes(value as CiteStyle) ? (value as CiteStyle) : 'iso690';
  } catch {
    return 'iso690';
  }
};

const FILES: Record<CiteStyle, { extension: string; type: string }> = {
  iso690: { extension: 'txt', type: 'text/plain' },
  apa: { extension: 'txt', type: 'text/plain' },
  bibtex: { extension: 'bib', type: 'application/x-bibtex' },
  'csl-json': { extension: 'json', type: 'application/json' },
};

/** Everything in one block: one reference per paragraph, BibTeX entries apart, CSL-JSON as one array (Zotero imports it). */
const allText = (references: ICiteReference[], style: CiteStyle) =>
  style === 'csl-json'
    ? JSON.stringify(references.map((r) => r.csl).filter(Boolean), null, 2)
    : references.map(referenceText).join('\n\n');

const download = (text: string, style: CiteStyle) => {
  const { extension, type } = FILES[style];
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `references.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * "Cite these sources" (EvilFlowersCatalog#186, elvira-portal#49): formatted references for an answer's
 * citations, or for the whole chat, from `POST /api/v1/cite`. ISO 690 by default — the norm for theses at STU —
 * with APA, BibTeX and CSL-JSON one tab away; copy one, copy all, or download a file for a reference manager.
 * Formatting is the catalog's (deterministic, from the record), never the model's.
 */
export default function CiteDialog({ uris, title, onClose }: { uris: string[]; title: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [style, setStyleState] = useState<CiteStyle>(savedStyle);
  const { data: references = [], isLoading, error } = useCite(uris, style, true);
  useEscapeLayer(onClose, true);

  const setStyle = (next: CiteStyle) => {
    setStyleState(next);
    try {
      localStorage.setItem(STYLE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts until the dialog closes */
    }
  };

  const status = isAxiosError(error) ? error.response?.status : undefined;
  const copied = t('assistant.references.copied');
  const mono = style === 'bibtex' || style === 'csl-json';

  return createPortal(
    <div
      className="fixed inset-0 z-[1301] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-2xl max-h-full overflow-hidden bg-white dark:bg-zinc-900 rounded-lg flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 pb-2">
          <p className="text-sm text-black dark:text-white">
            <span className="font-semibold">{title}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('assistant.references.count', { count: uris.length })}
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FiX size={18} aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label={t('assistant.references.style')} className="flex flex-wrap gap-1 px-4">
          {STYLES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={style === option}
              onClick={() => setStyle(option)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                style === option
                  ? 'border-primary bg-primary text-white dark:border-primaryLight dark:bg-primaryLight dark:text-black'
                  : 'border-zinc-300 text-gray-700 hover:border-primary dark:border-zinc-600 dark:text-gray-200'
              }`}
            >
              {t(`assistant.references.styles.${option}`)}
            </button>
          ))}
        </div>

        <div className="grow overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-24" aria-busy={isLoading}>
          {isLoading ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('assistant.references.loading')}</p>
          ) : error ? (
            <p className="text-xs px-2 py-1.5 rounded-md bg-red/10 text-redText dark:text-red">
              {t(status === 404 ? 'assistant.references.notFound' : 'assistant.references.failed')}
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {references.map((reference) => (
                <li key={reference.uri} className="group flex items-start gap-2">
                  <span
                    className={`grow min-w-0 text-xs text-black dark:text-[#e5e7eb] whitespace-pre-wrap break-words select-text ${
                      mono ? 'font-mono bg-zinc-100 dark:bg-zinc-800 rounded p-2' : ''
                    }`}
                  >
                    {referenceText(reference)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(referenceText(reference), copied)}
                    aria-label={t('assistant.references.copyOne')}
                    title={t('assistant.references.copyOne')}
                    className="shrink-0 p-1 rounded text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primaryLight"
                  >
                    <FiCopy size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 dark:border-zinc-700 px-4 py-2.5">
          <p className="grow min-w-0 text-[11px] text-gray-500 dark:text-gray-400">{t('assistant.references.note')}</p>
          <button
            type="button"
            disabled={!references.length}
            onClick={() => download(allText(references, style), style)}
            className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline disabled:opacity-50"
          >
            <FiDownload size={12} aria-hidden="true" /> {t('assistant.references.download', { extension: FILES[style].extension })}
          </button>
          <button
            type="button"
            disabled={!references.length}
            onClick={() => copyText(allText(references, style), copied)}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary text-white dark:bg-primaryLight dark:text-black disabled:opacity-50"
          >
            <FiCopy size={12} aria-hidden="true" /> {t('assistant.references.copyAll')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
