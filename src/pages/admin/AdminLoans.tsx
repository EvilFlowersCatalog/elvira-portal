
import { useTranslation } from 'react-i18next';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import { useEffect, useState } from 'react';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import ToolsContainer from '../../components/tools/ToolsContainer';
import ElviraTable, { ElviraTableFetchFunction } from '../../components/table/ElviraTable';
import { useSearchParams } from 'react-router-dom';
import { Metadata } from '../../utils/interfaces/general/general';
import { ActionButton, BubbleText } from '../../components/table/Cells';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import { ILicense, InterfaceState } from '../../utils/interfaces/license';
import { stateStyle, Title, translateState } from '../../components/items/loans/LoansTable';
import { formatDate } from 'date-fns/format';
import EntryDetail from '../../components/items/entry/details/EntryDetail';

import { Menu, MenuItem } from '@mui/material';
import { TFunction } from 'i18next';
import useUpdateLiceseState from '../../hooks/api/licenses/useUpdateLicense';

interface StateSelectorProps {
    item: ILicense;
    t: TFunction;
    onStateChange: (newState: InterfaceState) => void;
}

function StateSelector({ item, t, onStateChange }: StateSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleStateSelect = (newState: InterfaceState) => {
        onStateChange(newState);
        handleClose();
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <BubbleText
                className='cursor-pointer'
                text={translateState(item.state, t)}
                style={stateStyle(item.state, t)}
                onClick={handleOpen}
            />

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{
                    '.dark & .MuiPaper-root': {
                        backgroundColor: '#222',
                        color: 'white',
                        "& .MuiMenuItem-root:hover": {
                            backgroundColor: '#333',
                        }
                    },
                }}
            >
                {['ready', 'active', 'returned', 'expired', 'revoked', 'cancelled'].map((state) => (
                    <MenuItem key={state} selected={state === item.state} onClick={() => handleStateSelect(state as InterfaceState)}>
                        {translateState(state, t)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}


const AdminLoans = () => {
    const { t } = useTranslation();
    const getLoans = useGetLicenses();
    const updateLoan = useUpdateLiceseState();
    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState<any>([]);
    const [items, setItems] = useState<ILicense[]>([]);
    const [metadata, setMetadata] = useState<Metadata>({
        page: 1,
        limit: 10,
        pages: 1,
        total: 0,
    });

    const fetchLoans: ElviraTableFetchFunction = async ({ page, limit, sortBy }) => {
        const { items, metadata } = await getLoans({
            page,
            limit,
            sortBy
        });

        setItems(items);
        setMetadata(metadata);
    };

    useEffect(() => {
        fetchLoans({ page: metadata.page, limit: metadata.limit, sortBy: '' });
    }, [searchParams]);


    useEffect(() => {
        setData(items.map((item) => ({
            entry_id: item.entry_id,
            title: <Title entryId={item.entry_id} />,
            state: <StateSelector item={item} t={t} onStateChange={(newState: InterfaceState) => {
               setItems((prevItems) => prevItems.map((prevItem) => 
                    prevItem.id === item.id ? { ...prevItem, state: newState as typeof prevItem.state } : prevItem
                ));
                updateLoan(item.id, newState, 'P1Y'); 
             }} />,
            starts_at: formatDate(item.starts_at, 'dd.MM.yyyy'),
            ends_at: formatDate(item.expires_at, 'dd.MM.yyyy'),
        })));
    }, [items]);

    return (
        <div className='overflow-auto pb-10'>
            <Breadcrumb />
            <H1>{t('administration.loansPage.title')}</H1>
            <ToolsContainer param={'name'} advancedSearch={false} enableSort={false} />
            <EntryDetail />
            <ElviraTable title={t('administration.loansPage.tableTitle', { x: metadata.total })}
                header={[
                    {
                        label: t('administration.loansPage.table.entry'), selector: 'title', onClick(row) {
                            setSearchParams((prev) => {
                                prev.set("entry-detail-id", row.entry_id);
                                return prev;
                            })
                        }, width: '500px'
                    },
                    { label: t('administration.loansPage.table.state'), selector: 'state' },
                    { label: t('administration.loansPage.table.starts_at'), selector: 'starts_at' },
                    { label: t('administration.loansPage.table.ends_at'), selector: 'ends_at' },
                ]}
                data={data}
                metadata={metadata}
                fetchFunction={fetchLoans}
                rowsPerPageOptions={[5, 10, 25, 50]}
            />
        </div>
    );
};

export default AdminLoans;