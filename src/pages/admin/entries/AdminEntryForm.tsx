import FileDropzone from "../../../components/dropzones/FileDropzone";
import ElviraTextarea from "../../../components/inputs/ElviraTextarea";
import WYSIWYG from "../../../components/inputs/WYSIWYG";
import PageLoading from "../../../components/page/PageLoading";
import AdditionalDataPart from "../../../components/specific-page/admin-entry-page/AdditionalDataPart";
import AuthorsPart from "../../../components/specific-page/admin-entry-page/AuthorsPart";
import CategoriesPart from "../../../components/specific-page/admin-entry-page/CategoriesPart";
import ConfigPart from "../../../components/specific-page/admin-entry-page/config-part/ConfigPart";
import FeedsPart from "../../../components/specific-page/admin-entry-page/FeedsPart";
import IdentifiersPart from "../../../components/specific-page/admin-entry-page/IdentifiersPart";
import { useTranslation } from "react-i18next";
import { IEntryNewForm } from "../../../utils/interfaces/entry";
import { ContentEditableEvent } from "react-simple-wysiwyg";
import { ChangeEvent, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../components/buttons/Button";
import { BiSave } from "react-icons/bi";
import { CopyId, PageHeader } from "../../../components/admin";
import { useSearchParams } from "react-router-dom";
import { FiActivity, FiArchive, FiCpu } from "react-icons/fi";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import EntryLinkedSystems from "../../../components/admin/harvest/EntryLinkedSystems";
import { useEntrySync, useHarvestSources } from "../../../hooks/api/harvest/useHarvest";
import { fmtDateTime } from "../../../utils/func/adminDate";
import EntryJobsPanel from "../../../components/admin/jobs/EntryJobsPanel";
import { twMerge } from "tailwind-merge";
import EntryExtractionPanel from "../../../components/specific-page/admin-entry-page/extraction/EntryExtractionPanel";

interface IAdminEntryFormProps {
    FormType: "add" | "edit";
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    entry: IEntryNewForm | null;
    setEntry: React.Dispatch<React.SetStateAction<IEntryNewForm | null>>;
    stringImage: string;
    setStringImage: React.Dispatch<React.SetStateAction<string>>;
    catalogId?: string;
    files?: { id: string; relation: string; file: File }[];
    setFiles?: React.Dispatch<React.SetStateAction<{ id: string; relation: string; file: File }[]>>;
    /** Edit mode (IP-034): where the stored entry came from, whether it is withdrawn, and withdraw/restore. */
    stored?: {
        origin: string;
        withdrawnAt: string | null;
        onWithdraw: (withdrawn: boolean) => void | Promise<void>;
        isWithdrawing: boolean;
    };
}

/** "Imported from <source name>" for a `harvest:<slug>` origin; the slug resolves to the source's name. */
function OriginLabel({ origin }: { origin: string }) {
    const { t } = useTranslation();
    const slug = origin.startsWith('harvest:') ? origin.slice('harvest:'.length) : null;
    const { data } = useHarvestSources({ query: slug ?? undefined, limit: 5 }, !!slug);
    if (!slug) return null;
    const source = data?.items.find((s) => s.slug === slug);
    return (
        <span className='inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'>
            {t('entry.withdrawal.importedFrom', { name: source?.name ?? slug })}
        </span>
    );
}

export default function AdminEntryForm({
    FormType,
    handleSubmit,
    isLoading,
    entry,
    setEntry,
    stringImage,
    setStringImage,
    catalogId,
    files,
    setFiles,
    stored,
}: IAdminEntryFormProps) {
    const { t } = useTranslation();
    const [confirmWithdraw, setConfirmWithdraw] = useState<boolean>(false);
    const { 'entry-id': id } = useParams();
    const [isFilesLoading, setIsFilesLoading] = useState<boolean>(false);
    // Inline message instead of the browser's bubble (which is in the browser's
    // language, not the app's) — same pattern as ElviraInput.
    const [titleInvalid, setTitleInvalid] = useState<boolean>(false);
    // Secondary view of an existing publication: its AI processing (IP-018). Kept in the URL
    // (`?tab=ai`) so the entries list can link straight to it; the form stays mounted underneath,
    // so switching views never loses unsaved edits.
    const [searchParams, setSearchParams] = useSearchParams();
    const view: 'publication' | 'ai' | 'jobs' =
        FormType === 'edit' && (searchParams.get('tab') === 'ai' || searchParams.get('tab') === 'jobs')
            ? (searchParams.get('tab') as 'ai' | 'jobs')
            : 'publication';
    const showAi = view === 'ai';
    const showJobs = view === 'jobs';
    const setView = (next: 'publication' | 'ai' | 'jobs') => {
        const params = new URLSearchParams(searchParams);
        if (next === 'publication') params.delete('tab');
        else params.set('tab', next);
        setSearchParams(params, { replace: true, state: window.history.state?.usr });
    };

    const handleSummaryChange = (event: ContentEditableEvent) => {
        setEntry((prevEntry) => ({
            ...prevEntry!, // Preserve existing properties of entryForm
            summary: event.target.value, // Update the summary property
        }));
    };
    const handleCitationChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEntry((prevEntry) => ({
            ...prevEntry!, // Preserve existing properties of entryForm
            citation: event.target.value, // Update the citation property
        }));
    };
    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTitleInvalid(false);
        setEntry((prevEntry) => ({ ...prevEntry!, title: event.target.value }));
    };

    const cardClass = 'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm';
    const sectionTitle = 'text-sm font-semibold text-zinc-700 dark:text-zinc-200';

    return (
        <div className='flex h-full flex-col overflow-y-auto'>
            {entry === null || isLoading ? (
                <PageLoading />
            ) : (
                <form className='flex flex-1 flex-col' onSubmit={handleSubmit}>
                    <PageHeader
                        title={FormType === 'add' ? t('entry.wizard.new') : (entry.title || t('entry.wizard.edit'))}
                        meta={
                            FormType === 'edit' && id ? (
                                <>
                                    <CopyId value={id} label={t('administration.copy.publicationId')} />
                                    {stored && <OriginLabel origin={stored.origin} />}
                                </>
                            ) : undefined
                        }
                    />

                    {FormType === 'edit' && stored?.withdrawnAt && (
                        // IP-034: hidden from every list and search, no new loans; running loans continue.
                        <div role='status' className='mx-5 mb-4 flex flex-wrap items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/50 dark:bg-amber-500/10'>
                            <FiArchive size={18} className='mt-0.5 shrink-0 text-amber-700 dark:text-amber-400' />
                            <div className='min-w-0 flex-1 text-sm text-amber-900 dark:text-amber-100'>
                                <p className='font-semibold'>{t('entry.withdrawal.banner', { date: fmtDateTime(stored.withdrawnAt) ?? '' })}</p>
                                <p className='mt-0.5 text-xs'>{t('entry.withdrawal.bannerHint')}</p>
                                {stored.origin.startsWith('harvest:') && (
                                    <p className='mt-0.5 text-xs'>{t('entry.withdrawal.bannerHarvest')}</p>
                                )}
                            </div>
                            <button
                                type='button'
                                disabled={stored.isWithdrawing}
                                onClick={() => stored.onWithdraw(false)}
                                className='rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/60 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-500/20'
                            >
                                {stored.isWithdrawing ? '…' : t('entry.withdrawal.restore')}
                            </button>
                        </div>
                    )}

                    {FormType === 'edit' && (
                        // Primary tab is the publication; the AI view is deliberately quiet —
                        // most managers never need it.
                        <div role='tablist' aria-label={t('administration.extraction.viewsLabel')} className='mx-5 mb-4 flex items-end justify-between border-b border-zinc-200 dark:border-zinc-700'>
                            <button
                                type='button'
                                role='tab'
                                aria-selected={view === 'publication'}
                                onClick={() => setView('publication')}
                                className={twMerge(
                                    '-mb-px border-b-2 px-1 pb-2 text-sm font-semibold transition-colors',
                                    view === 'publication' ? 'border-primary text-secondary dark:text-secondaryLight' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                )}
                            >
                                {t('administration.extraction.tabPublication')}
                            </button>
                            <div className='flex items-end gap-4'>
                                {(
                                    [
                                        { id: 'jobs', icon: <FiActivity size={12} />, label: t('administration.jobs.entryTab'), hint: t('administration.jobs.entryTabHint') },
                                        { id: 'ai', icon: <FiCpu size={12} />, label: t('administration.extraction.tab'), hint: t('administration.extraction.tabHint') },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        type='button'
                                        role='tab'
                                        aria-selected={view === tab.id}
                                        onClick={() => setView(tab.id)}
                                        title={tab.hint}
                                        className={twMerge(
                                            '-mb-px inline-flex items-center gap-1 border-b-2 px-1 pb-2 text-xs transition-colors',
                                            view === tab.id ? 'border-primary font-semibold text-secondary dark:text-secondaryLight' : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                                        )}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showJobs && id && (
                        <div className='px-5 pb-10'>
                            <EntryJobsPanel entryId={id} title={entry.title} onOpenAi={() => setView('ai')} />
                        </div>
                    )}

                    {showAi && id && (
                        // Inside the entry <form>: Enter in the panel's search must not save the publication.
                        <div
                            className='px-5 pb-10'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
                            }}
                        >
                            <EntryExtractionPanel entryId={id} />
                        </div>
                    )}

                    <div className={twMerge('px-5 pb-28', view !== 'publication' && 'hidden')}>
                        {/* Prominent title — the primary thing an operator edits */}
                        <div className={cardClass}>
                            <label htmlFor='entry-title' className={sectionTitle}>
                                {t('entry.wizard.title')}
                                <span className='ml-0.5 text-redText dark:text-red'>*</span>
                            </label>
                            <input
                                id='entry-title'
                                value={entry.title ?? ''}
                                onChange={handleTitleChange}
                                onInvalid={(e) => {
                                    e.preventDefault();
                                    setTitleInvalid(true);
                                    e.currentTarget.focus();
                                }}
                                required
                                aria-invalid={titleInvalid || undefined}
                                aria-describedby={titleInvalid ? 'entry-title-error' : undefined}
                                placeholder={t('entry.wizard.titleNamespace')}
                                className={twMerge(
                                    'mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-lg font-medium text-zinc-800 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100',
                                    titleInvalid && 'border-redText dark:border-red'
                                )}
                            />
                            {titleInvalid && (
                                <p id='entry-title-error' role='alert' className='mt-1 text-sm text-redText dark:text-red'>
                                    {t('entry.wizard.requiredMessages.title')}
                                </p>
                            )}
                            {/* IP-034 Q2: imports tell editions with equal titles apart by it. */}
                            <label htmlFor='entry-edition' className='mt-3 block text-xs font-medium text-zinc-500 dark:text-zinc-400'>
                                {t('entry.wizard.edition')}
                            </label>
                            <input
                                id='entry-edition'
                                value={entry.edition ?? ''}
                                maxLength={255}
                                onChange={(e) => setEntry((prev) => ({ ...prev!, edition: e.target.value }))}
                                placeholder={t('entry.wizard.editionPlaceholder')}
                                className='mt-1 w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100'
                            />
                        </div>

                        {/* Two-column: main content + settings sidebar */}
                        <div className='mt-4 grid gap-4 lg:grid-cols-3'>
                            {/* Main column */}
                            <div className='flex flex-col gap-4 lg:col-span-2'>
                                <div className={cardClass}>
                                    <AuthorsPart entry={entry} setEntry={setEntry} />
                                </div>

                                <div className={`${cardClass} flex min-h-60 flex-col gap-2`}>
                                    <h2 className={sectionTitle}>{t('entry.wizard.summary')}</h2>
                                    <WYSIWYG value={entry.summary} onChange={handleSummaryChange} />
                                </div>

                                <div className={`${cardClass} flex flex-col gap-2`}>
                                    <h2 className={sectionTitle}>{t('entry.wizard.citation')}</h2>
                                    <ElviraTextarea
                                        onChange={handleCitationChange}
                                        className='min-h-32 flex-1 resize-none rounded-lg border border-zinc-300 bg-white p-2 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40'
                                        placeholder={t('entry.wizard.citation')}
                                        value={entry.citation ?? ''}
                                    />
                                </div>

                                <div className={`${cardClass} flex flex-col gap-2`}>
                                    <h2 className={sectionTitle}>
                                        {t('entry.wizard.files')}
                                        {/* A PDF is required when creating; on edit files are managed in place. */}
                                        {FormType === 'add' && <span className='ml-0.5 text-redText dark:text-red'>*</span>}
                                    </h2>
                                    {FormType === 'add' ? (
                                        <FileDropzone files={files} setFiles={setFiles} isLoading={isFilesLoading} setIsLoading={setIsFilesLoading} />
                                    ) : (
                                        <FileDropzone entryId={id!} catalogId={catalogId} isLoading={isFilesLoading} setIsLoading={setIsFilesLoading} />
                                    )}
                                </div>
                            </div>

                            {/* Settings sidebar */}
                            <div className='flex flex-col gap-4'>
                                <div className={cardClass}>
                                    <AdditionalDataPart
                                        entry={entry}
                                        setEntry={setEntry}
                                        stringImage={stringImage}
                                        setStringImage={setStringImage}
                                    />
                                </div>

                                <div className={cardClass}>
                                    <IdentifiersPart entry={entry} setEntry={setEntry} />
                                </div>

                                {/* Managers only: the panel renders nothing for readers (403) and unlinked books. */}
                                {FormType === 'edit' && id && <LinkedSystemsCard entryId={id} className={cardClass} />}

                                {FormType === 'edit' && stored && !stored.withdrawnAt && (
                                    <div className={`${cardClass} flex flex-col gap-2`}>
                                        <h2 className={sectionTitle}>{t('entry.withdrawal.title')}</h2>
                                        <p className='text-xs text-zinc-500 dark:text-zinc-400'>{t('entry.withdrawal.hint')}</p>
                                        <button
                                            type='button'
                                            disabled={stored.isWithdrawing}
                                            onClick={() => setConfirmWithdraw(true)}
                                            className='inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700'
                                        >
                                            <FiArchive size={14} />
                                            {t('entry.withdrawal.withdraw')}
                                        </button>
                                    </div>
                                )}

                                <div className={`${cardClass} flex flex-col gap-4`}>
                                    <FeedsPart entry={entry} setEntry={setEntry} />
                                    <CategoriesPart entry={entry} setEntry={setEntry} />
                                </div>

                                <div className={cardClass}>
                                    <ConfigPart entry={entry} setEntry={setEntry} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky save bar */}
                    <div className={twMerge('sticky bottom-0 z-10 mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 bg-lightGray/90 px-5 py-3 backdrop-blur dark:border-zinc-700 dark:bg-darkGray/90', view !== 'publication' && 'hidden')}>
                        <Button type='submit' disabled={isFilesLoading} className='flex items-center gap-2'>
                            <BiSave size={18} />
                            {FormType === 'add' ? t('entry.wizard.upload') : t('entry.wizard.edit')}
                        </Button>
                    </div>
                </form>
            )}

            {stored && (
                <ConfirmDialog
                    open={confirmWithdraw}
                    title={t('entry.withdrawal.confirmTitle')}
                    message={t('entry.withdrawal.confirmBody', { title: entry?.title ?? '' })}
                    confirmLabel={t('entry.withdrawal.withdraw')}
                    cancelLabel={t('administration.usersPage.cancel')}
                    destructive
                    loading={stored.isWithdrawing}
                    onConfirm={async () => {
                        await stored.onWithdraw(true);
                        setConfirmWithdraw(false);
                    }}
                    onCancel={() => setConfirmWithdraw(false)}
                />
            )}
        </div>
    );
}

/** The linked-systems panel in a card, only when the book is linked somewhere. */
function LinkedSystemsCard({ entryId, className }: { entryId: string; className: string }) {
    const { data: sources = [] } = useEntrySync(entryId);
    if (!sources.length) return null;
    return (
        <div className={className}>
            <EntryLinkedSystems entryId={entryId} />
        </div>
    );
}