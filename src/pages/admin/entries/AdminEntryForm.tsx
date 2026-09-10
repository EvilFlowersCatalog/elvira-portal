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
import { PageHeader } from "../../../components/admin";

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
}: IAdminEntryFormProps) {
    const { t } = useTranslation();
    const { 'entry-id': id } = useParams();
    const [isFilesLoading, setIsFilesLoading] = useState<boolean>(false);

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
                    />

                    <div className='px-5 pb-28'>
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
                                required
                                placeholder={t('entry.wizard.titleNamespace')}
                                className='mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-lg font-medium text-zinc-800 outline-none focus:border-primary dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-100'
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
                                    <h2 className={sectionTitle}>{t('entry.wizard.files')}</h2>
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
                    <div className='sticky bottom-0 z-10 mt-auto flex items-center justify-end gap-3 border-t border-zinc-200 bg-lightGray/90 px-5 py-3 backdrop-blur dark:border-zinc-700 dark:bg-darkGray/90'>
                        <Button type='submit' disabled={isFilesLoading} className='flex items-center gap-2'>
                            <BiSave size={18} />
                            {FormType === 'add' ? t('entry.wizard.upload') : t('entry.wizard.edit')}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}