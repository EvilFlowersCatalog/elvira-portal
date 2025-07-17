import { MdAdd, MdDelete } from 'react-icons/md';
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

export default function AdminEntriesTable({ }) {
    const navigate = useNavigate();
    const { umamiTrack, stuBorder, stuBg } = useAppContext();
    const getEntries = useGetEntries();
    const { t } = useTranslation();

    const [page, setPage] = useState<number>(0);
    const [maxPage, setMaxPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);
    const [items, setItems] = useState<any[]>([]);
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
            fetchEntries();
        }
    };

    function fetchEntries() {
        getEntries({
            page: page == 0 ? 1 : page,
            limit: rowsPerPage,
            title: searchParams.get('title') ?? '',
            feedId: searchParams.get('feed-id') ?? '',
            categoryId: searchParams.get('category-id') ?? '',
            authors: searchParams.get('author') ?? '',
            publishedAtGte: searchParams.get('publishedAtGte') ?? '',
            publishedAtLte: searchParams.get('publishedAtLte') ?? '',
            orderBy: searchParams.get('order-by') ?? '',
            query: searchParams.get('query') ?? '',
        }).then(({ items: data, metadata }) => {
            setMaxPage(metadata.pages);
            setItems(data);
        });
    }

    useEffect(() => {
        fetchEntries();
    }, [page, rowsPerPage, searchParams]);

    function getPagination() {
        return <TablePagination
            className='dark:text-white'
            sx={{
                '.dark & .MuiButtonBase-root.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.5)',
                },
                ".dark & .MuiSelect-icon": {
                    color: 'white',
                },
            }}
            rowsPerPageOptions={[10, 25, 50]}
            count={maxPage * rowsPerPage}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage: number) => {
                setPage(newPage);
            }}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
            }}
        />
    }

    return (
        <div>
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
            <Box className='p-4'>
                <Paper sx={{
                    "background": 'white',
                    ".dark &": {
                        "background": "#27272A",
                        "borderColor": 'red',
                    }
                }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                {getPagination()}
                            </TableHead>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={'800px'}>
                                        <h2 className='dark:text-white'>{t('administration.entriesPage.detail')}</h2>
                                    </TableCell>
                                    <TableCell>
                                        <h2 className='dark:text-white'>{t('administration.entriesPage.feeds')}</h2>
                                    </TableCell>
                                    <TableCell>
                                        <h2 className='dark:text-white'>{t('administration.entriesPage.categories')}</h2>
                                    </TableCell>
                                    <TableCell align='right' width={24}>
                                        <MdAdd className='cursor-pointer dark:text-white' size={24} onClick={() => {
                                            umamiTrack('Add Entry Button');
                                            navigate(NAVIGATION_PATHS.adminAddEntries);
                                        }} />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((entry: IEntry, index) => <>
                                    <TableRow key={entry.id}>
                                        <TableCell className='cursor-pointer' onClick={() => {
                                            umamiTrack('Edit Entry Button', { entryId: entry.id });
                                            navigate(NAVIGATION_PATHS.adminEditEntries + entry.id);
                                        }}>
                                            <h3 className='text-[16px] dark:text-white'>{entry.title}</h3>
                                            {entry.authors.length > 0 &&
                                                <p className='text-sm text-gray/50 dark:text-white/50'>{entry.authors[0].name} {entry.authors[0].surname}</p>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex gap-2'>
                                                {entry.feeds?.map((feed) => (
                                                    <p key={feed.id} className='px-2 py-1 bg-primary rounded-lg text-sm text-white cursor-pointer'
                                                        onClick={() => {
                                                            searchParams.set('feed-id', feed.id);
                                                            setSearchParams(searchParams);
                                                        }}
                                                    >{feed.title}</p>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex gap-2'>
                                                {entry.categories?.map((category) => (
                                                    <p key={category.id} className='px-2 py-1 bg-secondary rounded-lg text-sm text-white cursor-pointer'
                                                        onClick={() => {
                                                            searchParams.set('category-id', category.id);
                                                            setSearchParams(searchParams);
                                                        }}
                                                    >{category.term}</p>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <MdDelete size={24} className='cursor-pointer text-red/70' onClick={() => {
                                                umamiTrack('Delete Entry Button', { entryId: entry.id });
                                                setDeleteMenuEntry(entry);
                                            }} />
                                        </TableCell>
                                    </TableRow>
                                </>)}
                            </TableBody>
                            <TableFooter>
                                {getPagination()}
                            </TableFooter>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </div>
    );
}
