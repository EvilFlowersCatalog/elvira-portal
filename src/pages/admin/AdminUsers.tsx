
import { useTranslation } from 'react-i18next';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import { useEffect, useState } from 'react';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import ToolsContainer from '../../components/tools/ToolsContainer';
import OpenFiltersButton from '../../components/buttons/OpenFiltersButton';
import ElviraTable, { ElviraTableFetchFunction } from '../../components/table/ElviraTable';
import { useSearchParams } from 'react-router-dom';
import { IUser } from '../../utils/interfaces/user';
import { Metadata } from '../../utils/interfaces/general/general';
import { BubbleText } from '../../components/table/Cells';

const AdminEntries = () => {
    const { t } = useTranslation();
    const getUsers = useGetUsers();
    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState<any>([]);
    const [items, setItems] = useState<IUser[]>([]);
    const [metadata, setMetadata] = useState<Metadata>({
        page: 1,
        limit: 10,
        pages: 1,
        total: 0,
    });

    const fetchUsers: ElviraTableFetchFunction = async ({ page, limit, sortBy }) => {
        const { items, metadata } = await getUsers({
            page,
            limit,
            sortBy
        });

        setItems(items);
        setMetadata(metadata);
    };

    useEffect(() => {
        fetchUsers({ page: metadata.page, limit: metadata.limit, sortBy: '' });
    }, [searchParams]);


    useEffect(() => {
        setData(items.map((item) => ({
            id: item.id,
            username: <span> {item.is_superuser? <strong>{item.username}</strong> : item.username}</span>,
            name: item.name,
            surname: item.surname,
            is_active: <BubbleText className={`cursor-default select-none bg-${item.is_active ? 'green' : 'red'}`} text={item.is_active ? t('administration.usersPage.active') : t('administration.usersPage.inactive')} />,
            last_login: item.last_login ? new Date(item.last_login).toLocaleString() : '',
            created_at: item.created_at ? new Date(item.created_at).toLocaleString() : '',
            updated_at: item.updated_at ? new Date(item.updated_at).toLocaleString() : '',
        })));
    }, [items]);

    return (
        <div className='overflow-auto pb-10'>
            <Breadcrumb />
            <H1>{t('administration.usersPage.title')}</H1>
            <ToolsContainer param={'name'} advancedSearch={false} enableSort={false} />
            <ElviraTable title={t('administration.usersPage.tableTitle', { x: metadata.total })}
                header={[
                    { label: t('administration.usersPage.username'), selector: 'username', disableHide: true },
                    { label: t('administration.usersPage.name'), selector: 'name' },
                    { label: t('administration.usersPage.surname'), selector: 'surname' },
                    { label: t('administration.usersPage.isActive'), selector: 'is_active' },
                    { label: t('administration.usersPage.lastLogin'), selector: 'last_login', hidden: true },
                    { label: t('administration.usersPage.createdAt'), selector: 'created_at', hidden: true },
                    { label: t('administration.usersPage.updatedAt'), selector: 'updated_at', hidden: true },
                ]}
                data={data}
                metadata={metadata}
                fetchFunction={fetchUsers}
                rowsPerPageOptions={[5, 10, 25, 50]}
            />
        </div>
    );
};

export default AdminEntries;