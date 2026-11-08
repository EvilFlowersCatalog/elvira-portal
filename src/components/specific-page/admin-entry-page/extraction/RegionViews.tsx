import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiCopy, FiImage, FiMaximize2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { twMerge } from 'tailwind-merge';
import { IExtractionRegion } from '../../../../utils/interfaces/extraction';
import { Drawer, StatusChip } from '../../../admin';

export const copyText = async (text: string, okMessage: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMessage);
  } catch {
    /* clipboard blocked: nothing to do */
  }
};

/** A table region's markdown as a real table, like the viewer's grid. */
export const MarkdownTable = ({ markdown, className }: { markdown: string; className?: string }) => (
  <div className={twMerge('overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: (props) => <table className="w-full border-collapse text-xs" {...props} />,
        thead: (props) => <thead className="bg-zinc-50 dark:bg-zinc-900/40" {...props} />,
        th: (props) => (
          <th className="border-b border-zinc-200 px-2 py-1.5 text-left font-semibold dark:border-zinc-700" {...props} />
        ),
        td: (props) => <td className="border-b border-zinc-100 px-2 py-1 align-top dark:border-zinc-700/60" {...props} />,
        p: (props) => <p className="px-2 py-1 text-xs" {...props} />,
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

const Crop = ({ region, className }: { region: IExtractionRegion; className?: string }) => {
  const { t } = useTranslation();
  if (!region.image_url) {
    return (
      <div className={twMerge('flex items-center justify-center gap-1 text-xs text-zinc-400', className)}>
        <FiImage /> {t('administration.extraction.regions.noImage')}
      </div>
    );
  }
  return (
    <div className={twMerge('flex items-center justify-center overflow-hidden rounded bg-white', className)}>
      <img src={region.image_url} alt={region.printed_caption ?? region.caption ?? ''} loading="lazy" className="max-h-full max-w-full object-contain" />
    </div>
  );
};

const headline = (region: IExtractionRegion) => region.printed_caption || region.caption;

/** Grid card of a figure, table or equation; opens the detail drawer. */
export const RegionCard = ({ region, onOpen }: { region: IExtractionRegion; onOpen: () => void }) => {
  const { t } = useTranslation();
  const title = headline(region);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-left transition hover:border-primary hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/30"
    >
      {region.kind === 'table' && region.markdown ? (
        <div className="relative h-40 overflow-hidden">
          <MarkdownTable markdown={region.markdown} className="pointer-events-none border-0" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-zinc-800" />
        </div>
      ) : region.kind === 'equation' && !region.image_url && region.latex ? (
        <code className="block h-40 overflow-hidden whitespace-pre-wrap break-all rounded bg-zinc-50 p-2 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {region.latex}
        </code>
      ) : (
        <Crop region={region} className="h-40" />
      )}
      {title && <p className="line-clamp-3 text-xs font-medium text-zinc-800 dark:text-zinc-100">{title}</p>}
      {region.description && region.description !== title && (
        <p className="line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">{region.description}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1 text-[11px] text-zinc-400">
        <span>{t('administration.extraction.regions.page', { page: region.page })}</span>
        {region.category && <StatusChip dot={false} className="px-1.5 py-0 text-[10px]">{region.category}</StatusChip>}
        <FiMaximize2 className="ml-auto opacity-0 transition group-hover:opacity-100" />
      </div>
    </button>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-zinc-100 py-1.5 text-xs last:border-0 dark:border-zinc-700/60">
    <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
    <dd className="min-w-0 break-words text-zinc-800 dark:text-zinc-100">{children}</dd>
  </div>
);

/** Everything the catalog stores about one region. */
export const RegionDrawer = ({ region, onClose }: { region: IExtractionRegion | null; onClose: () => void }) => {
  const { t } = useTranslation();
  const [showCrop, setShowCrop] = useState(true);
  const copied = t('administration.extraction.copied');
  if (!region) return null;
  const b = region.bbox;
  return (
    <Drawer
      open={!!region}
      onClose={onClose}
      width="max-w-2xl"
      title={`${t(`administration.extraction.kind.${region.kind}`)} · ${t('administration.extraction.regions.page', { page: region.page })}`}
      description={headline(region) ?? undefined}
    >
      <div className="flex flex-col gap-4">
        {region.kind === 'table' && region.markdown && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t('administration.extraction.regions.table')}</h3>
              <button type="button" className="inline-flex items-center gap-1 text-xs text-primaryText hover:underline dark:text-primaryLight" onClick={() => copyText(region.markdown!, copied)}>
                <FiCopy /> {t('administration.extraction.regions.copyMarkdown')}
              </button>
            </div>
            <MarkdownTable markdown={region.markdown} />
          </section>
        )}

        {region.latex && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">LaTeX</h3>
              <button type="button" className="inline-flex items-center gap-1 text-xs text-primaryText hover:underline dark:text-primaryLight" onClick={() => copyText(region.latex!, copied)}>
                <FiCopy /> {t('administration.extraction.regions.copyLatex')}
              </button>
            </div>
            <code className="block whitespace-pre-wrap break-all rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {region.latex}
            </code>
          </section>
        )}

        {region.image_url && (
          <section className="flex flex-col gap-2">
            {region.kind !== 'figure' && (
              <button type="button" className="self-start text-xs text-primaryText hover:underline dark:text-primaryLight" onClick={() => setShowCrop((v) => !v)}>
                {showCrop ? t('administration.extraction.regions.hideCrop') : t('administration.extraction.regions.showCrop')}
              </button>
            )}
            {(showCrop || region.kind === 'figure') && <Crop region={region} className="max-h-[60vh] min-h-24 border border-zinc-200 p-2 dark:border-zinc-700" />}
          </section>
        )}

        <dl>
          {region.printed_caption && <Row label={t('administration.extraction.regions.printedCaption')}>{region.printed_caption}</Row>}
          {region.description && <Row label={t('administration.extraction.regions.description')}>{region.description}</Row>}
          {region.caption && region.caption !== region.printed_caption && region.caption !== region.description && (
            <Row label={t('administration.extraction.regions.caption')}>{region.caption}</Row>
          )}
          {region.category && <Row label={t('administration.extraction.regions.category')}>{region.category}</Row>}
          <Row label={t('administration.extraction.regions.position')}>
            {t('administration.extraction.regions.page', { page: region.page })} · #{region.seq} · ({b.x0.toFixed(3)}, {b.y0.toFixed(3)}) → ({b.x1.toFixed(3)}, {b.y1.toFixed(3)})
          </Row>
          {region.image_path && (
            <Row label={t('administration.extraction.regions.file')}>
              <span className="font-mono text-[11px]">{region.image_path}</span>
            </Row>
          )}
        </dl>

        {Object.keys(region.provenance ?? {}).length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-500">{t('administration.extraction.provenance')}</summary>
            <pre className="mt-2 overflow-x-auto rounded bg-zinc-50 p-2 text-[11px] dark:bg-zinc-900">{JSON.stringify(region.provenance, null, 2)}</pre>
          </details>
        )}
      </div>
    </Drawer>
  );
};
