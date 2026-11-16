import { useTranslation } from 'react-i18next';
import { FiCopy } from 'react-icons/fi';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import { MarkdownTable } from '../common/MarkdownTable';
import { copyText } from '../../utils/func/clipboard';

/** Longest Markdown / LaTeX shown; the extractor's output is untrusted and can be huge. */
const MAX_CHARS = 20000;

/**
 * A table's extracted cells as a real table, or an equation's LaTeX, with a copy button. Secondary to the crop:
 * the extraction is automatic and sometimes drops columns, so it is labelled as such and the image stays primary.
 */
export default function RegionData({ citation }: { citation: IAssistantCitation }) {
  const { t } = useTranslation();
  const copied = t('assistant.figure.copied');
  const markdown = citation.markdown?.includes('|') ? citation.markdown.slice(0, MAX_CHARS) : undefined;
  const latex = citation.latex?.trim() ? citation.latex.trim().slice(0, MAX_CHARS) : undefined;
  if (!markdown && !latex) return null;

  const copyButton = (text: string, label: string) => (
    <button
      type="button"
      onClick={() => copyText(text, copied)}
      className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300 hover:underline"
    >
      <FiCopy size={12} aria-hidden="true" /> {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {markdown ? (
        <>
          <MarkdownTable markdown={markdown} className="max-h-72 overflow-y-auto bg-white dark:bg-zinc-900" />
          <span className="flex flex-wrap items-center gap-3">{copyButton(markdown, t('assistant.figure.copyTable'))}</span>
        </>
      ) : null}
      {latex ? (
        <>
          <code className="block max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-50 dark:bg-zinc-900 p-2 font-mono text-[11px] text-zinc-800 dark:text-zinc-100">
            {latex}
          </code>
          <span className="flex flex-wrap items-center gap-3">{copyButton(latex, t('assistant.figure.copyLatex'))}</span>
        </>
      ) : null}
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('assistant.figure.extractedNote')}</span>
    </div>
  );
}
