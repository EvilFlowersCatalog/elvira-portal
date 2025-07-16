import { Button } from "@mui/material";
import Breadcrumb from "../../../components/buttons/Breadcrumb";
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

interface IAdminEntryFormProps {
    FormType: "add" | "edit";
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    entry: IEntryNewForm | null;
    setEntry: React.Dispatch<React.SetStateAction<IEntryNewForm | null>>;
    stringImage: string;
    setStringImage: React.Dispatch<React.SetStateAction<string>>;
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

    return (
        <>
            <div className='flex flex-col w-full h-full overflow-auto'>
                <Breadcrumb />
                {entry === null || isLoading ? (
                    <PageLoading />
                ) : (
                    <form
                        className='flex flex-col flex-1 p-4 pt-0 gap-4'
                        onSubmit={handleSubmit}
                    >
                        <div className='flex flex-col gap-4'>

                            {/* First row */}
                            <div className='flex flex-col bg-slate-200 dark:bg-gray p-4 rounded-md gap-4'>
                                {/* Identifiers */}
                                <IdentifiersPart entry={entry} setEntry={setEntry} />

                                {/* Configs */}
                                <ConfigPart entry={entry} setEntry={setEntry} />
                            </div>

                            {/* Second row */}
                            <AdditionalDataPart
                                entry={entry}
                                setEntry={setEntry}
                                stringImage={stringImage}
                                setStringImage={setStringImage}
                            />

                            {/* Third row */}
                            <div className='flex flex-col gap-4'>
                                {/* Authors */}
                                <AuthorsPart entry={entry} setEntry={setEntry} />

                                <div className='grid lg:grid-cols-2 gap-4'>
                                    {/* Feeds */}
                                    <FeedsPart entry={entry} setEntry={setEntry} />

                                    {/* Categories */}
                                    <CategoriesPart entry={entry} setEntry={setEntry} />
                                </div>
                            </div>
                            {/* FILES */}
                            {FormType === 'add' ?
                                <FileDropzone
                                    files={files}
                                    setFiles={setFiles}
                                    isLoading={isFilesLoading}
                                    setIsLoading={setIsFilesLoading} />
                                : <FileDropzone
                                    entryId={id!}
                                    isLoading={isFilesLoading}
                                    setIsLoading={setIsFilesLoading}
                                />}
                            {/* SUMMARY */}
                            <div className='flex flex-col flex-1 min-h-60 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                                <span>{t('entry.wizard.summary')}</span>
                                <WYSIWYG
                                    value={entry.summary}
                                    onChange={handleSummaryChange}
                                />
                            </div>
                            {/* CITATION */}
                            <div className='flex flex-col min-h-96 xl:min-h-0 flex-2 bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
                                <ElviraTextarea
                                    onChange={handleCitationChange}
                                    className='bg-white dark:bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                                    placeholder={t('entry.wizard.citation')}
                                    value={entry.citation ?? ''}
                                />
                            </div>
                        </div>
                        {!isFilesLoading && (
                            <div className='flex justify-center'>
                                {FormType === 'add' ?
                                    <Button type='submit'>{t('entry.wizard.upload')}</Button>
                                    : <Button type='submit'>{t('entry.wizard.edit')}</Button>}
                            </div>
                        )}
                    </form>
                )}
            </div>
        </>
    );
}