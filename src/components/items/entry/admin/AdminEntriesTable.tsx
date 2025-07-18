import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../../utils/interfaces/general/general';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from '@mui/material';
import useGetEntries from '../../../../hooks/api/entries/useGetEntries';
import { useEffect, useState } from 'react';
import { IEntry } from '../../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import ConfirmationDialog from '../../../dialogs/ConfirmationDialog';
import useDeleteEntry from '../../../../hooks/api/entries/useDeleteEntry';
import { toast } from 'react-toastify';
import ElviraTable, { ElviraTableFetchFunction } from '../../../table/ElviraTable';
import { ActionButton, BubbleText, SubText } from '../../../table/Cells';
import { IoMdTrash } from 'react-icons/io';

export default function AdminEntriesTable({ }) {
    const navigate = useNavigate();
    const { umamiTrack, stuBorder, stuBg } = useAppContext();
    const getEntries = useGetEntries();
    const { t } = useTranslation();

    const [items, setItems] = useState<IEntry[]>([]);
    const [data, setData] = useState<Array<Record<string, string | JSX.Element>>>([]);
    const [metadata, setMetadata] = useState<{ page: number, pages: number, limit: number, total: number }>({
        page: 1,
        limit: 10,
        pages: 0, // undefined
        total: 0, // undefined
    });

    const [searchParams, setSearchParams] = useSearchParams();

    const [deleteMenuEntry, setDeleteMenuEntry] = useState<IEntry | null>(null);
    const deleteEntry = useDeleteEntry();

    // Handle delete button
    const handleDelete = async () => {
        try {
            // remove entry by id
            if (!deleteMenuEntry) return;
            await deleteEntry(deleteMenuEntry.id);
            toast.success(t('notifications.entry.remove.success')); // notify success
        } catch {
            toast.error(t('notifications.entry.remove.error')); // notify error
        } finally {
            setDeleteMenuEntry(null);
            fetchEntries({ page: metadata.page, limit: metadata.limit, sortBy: '' });
        }
    };

    const fetchEntries: ElviraTableFetchFunction = async ({ page, limit, sortBy }) => {
        getEntries({
            page: page,
            limit: limit,
            title: searchParams.get('title') ?? '',
            feedId: searchParams.get('feed-id') ?? '',
            categoryId: searchParams.get('category-id') ?? '',
            authors: searchParams.get('author') ?? '',
            publishedAtGte: searchParams.get('publishedAtGte') ?? '',
            publishedAtLte: searchParams.get('publishedAtLte') ?? '',
            orderBy: sortBy ?? '',
            query: searchParams.get('query') ?? '',
        }).then(({ items: data, metadata }) => {
            setItems(data);
            setMetadata(metadata);
        });
    };

    useEffect(() => {
        fetchEntries({ page: metadata.page, limit: metadata.limit, sortBy: '' });
    }, [searchParams]);

    useEffect(() => {
        setData(items.map((item) => ({
            id: item.id,
            title: <SubText text={item.title} subtext={`${item.authors[0]?.name} ${item.authors[0]?.name}`} />,
            feeds: <div className='flex flex-wrap gap-x-4 gap-y-2'>{item.feeds?.map(feed => (
                <BubbleText key={feed.id} text={feed.title} className='bg-blue-500' onClick={() => {
                    searchParams.set('feed-id', feed.id);
                    setSearchParams(searchParams);
                }} />
            ))}</div>,
            categories: <div className='flex flex-wrap gap-x-4 gap-y-2'>{item.categories?.map(category => (
                <BubbleText key={category.id} text={category.term} className='bg-secondary' onClick={() => {
                    searchParams.set('category-id', category.id);
                    setSearchParams(searchParams);
                }} />
            ))}</div>,
            actions: (
                <div className='flex justify-end gap-2'>
                    <ActionButton icon={<MdEdit size={24} />} onClick={() => {
                        umamiTrack('Edit Entry Button', { entryId: item.id });
                        navigate(NAVIGATION_PATHS.adminEditEntries + item.id);
                    }} />
                    <ActionButton icon={<IoMdTrash size={24} />} onClick={() => {
                        setDeleteMenuEntry(item)
                    }} />
                </div>
            ),
        })));
    }, [items])

    return (<>
        {deleteMenuEntry && (
            <ConfirmationDialog
                name={deleteMenuEntry.title}
                close={() => {
                    setDeleteMenuEntry(null);
                }}
                yes={handleDelete}
                type="entry"
            />
        )}
        <ElviraTable title={t('administration.entriesPage.tableTitle')} toolBar={[
            <MdAdd className='cursor-pointer dark:text-white' size={24} onClick={() => {
                umamiTrack('Add Entry Button');
                navigate(NAVIGATION_PATHS.adminAddEntries);
            }} />
        ]} header={[
            { label: t('administration.entriesPage.detail'), selector: 'title', width: '700px', onClick: (row) => {
                umamiTrack('Entry Detail Click', { entryId: row.id });
                navigate(NAVIGATION_PATHS.adminEditEntries + row.id);
            }},
            { label: t('administration.entriesPage.feeds'), selector: 'feeds', },
            { label: t('administration.entriesPage.categories'), selector: 'categories', },
            { label: t('administration.entriesPage.actions'), selector: 'actions', width: '75px', align: 'right', disableSort: true }
        ]} data={data} metadata={metadata} fetchFunction={fetchEntries} rowsPerPageOptions={[5, 10, 25, 50]} />
    </>);

}
