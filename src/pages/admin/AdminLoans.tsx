
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import ToolsContainer from '../../components/tools/ToolsContainer';
import ElviraTable, { ElviraTableFetchFunction } from '../../components/table/ElviraTable';
import { useSearchParams } from 'react-router-dom';
import { Metadata } from '../../utils/interfaces/general/general';
import { BubbleText } from '../../components/table/Cells';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import { ILicense, InterfaceAction, LICENSE_ACTION } from '../../utils/interfaces/license';
import { stateStyle, translateState } from '../../components/items/loans/LoansTable';
import { formatDate } from 'date-fns/format';
import EntryDetail from '../../components/items/entry/details/EntryDetail';

import { Menu, MenuItem } from '@mui/material';
import { TFunction } from 'i18next';
import { toast } from 'react-toastify';
import useUpdateLicenseState from '../../hooks/api/licenses/useUpdateLicense';
import useGetUserDetails from '../../hooks/api/users/useGetUserDetails';

interface StateSelectorProps {
    item: ILicense;
    t: TFunction;
    onActionSelect: (action: InterfaceAction) => void;
}

function UserName({ userId }: { userId: string }) {
    const getUser = useGetUserDetails();
    const [userName, setUserName] = useState<string>('Loading...');

    useEffect(() => {
        getUser(userId).then((user) => {
            setUserName(`${user.name} ${user.surname}`);
        }).catch(() => {
            setUserName('Unknown User');
        });
    }, [userId, getUser]);
    return <span>{userName}</span>;
}


function StateSelector({ item, t, onActionSelect }: StateSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleActionSelect = (action: InterfaceAction) => {
        onActionSelect(action);
        handleClose();
    };

    const renewDisabled = item.renewals_remaining === 0;
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
                {Object.values(LICENSE_ACTION).map((action) => (
                    <MenuItem
                        key={action}
                        disabled={action === LICENSE_ACTION.renewed && renewDisabled}
                        title={action === LICENSE_ACTION.renewed && renewDisabled ? t('license.renew.capReached', { defaultValue: 'Renewal limit reached' }) : undefined}
                        onClick={() => handleActionSelect(action)}
                    >
                        {translateState(action, t)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}


const AdminLoans = () => {
    const { t } = useTranslation();
    const getLoans = useGetLicenses();
    const updateLoan = useUpdateLicenseState();
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
            sortBy,
            user_mode: 'all',
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
            title: item.entry?.title || 'Unknown Entry',
            user: <UserName userId={item.user_id} />,
            state: <StateSelector item={item} t={t} onActionSelect={(action: InterfaceAction) => {
                const requested_end =
                    action === LICENSE_ACTION.renewed
                        ? new Date(Date.now() + 7 * 86_400_000).toISOString()
                        : undefined;
                updateLoan(item.id, action, requested_end)
                    .then((updated) => {
                        setItems((prevItems) => prevItems.map((prevItem) =>
                            prevItem.id === item.id ? { ...prevItem, ...updated } : prevItem
                        ));
                    })
                    .catch((e: any) => {
                        const detail = e?.response?.data?.detail;
                        toast.error(detail || t('notifications.license.edit.error'));
                    });
            }} />,
            starts_at: formatDate(item.starts_at, 'dd.MM.yyyy'),
            ends_at: formatDate(item.expires_at, 'dd.MM.yyyy'),
        })));
    }, [items]);

    return (
        <div className='overflow-auto pb-10'>
            <Breadcrumb />
            <H1>{t('administration.loansPage.title')}</H1>
            <ToolsContainer param={'name'} advancedSearch={false} enableSort={false} enableSuggestions={false} />
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
                    { label: t('administration.loansPage.table.user'), selector: 'user' },
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