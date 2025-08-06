
import { useTranslation } from 'react-i18next';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import { useEffect, useState } from 'react';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import ToolsContainer from '../../components/tools/ToolsContainer';
import OpenFiltersButton from '../../components/buttons/OpenFiltersButton';
import ElviraTable, { ElviraTableFetchFunction } from '../../components/table/ElviraTable';
import { useSearchParams } from 'react-router-dom';
import { Metadata } from '../../utils/interfaces/general/general';
import { BubbleText } from '../../components/table/Cells';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import { ILicense } from '../../utils/interfaces/license';

const AdminLoans = () => {
    const { t } = useTranslation();
    const getLoans = useGetLicenses();
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
            id: item.id,
        })));
    }, [items]);

    return (
        <div className='overflow-auto pb-10'>
            <Breadcrumb />
            <H1>{t('administration.loansPage.title')}</H1>
            <ToolsContainer param={'name'} advancedSearch={false} enableSort={false} />
            <ElviraTable title={t('administration.loansPage.tableTitle', { x: metadata.total })}
                header={[
                    { label: t('administration.loansPage.id'), selector: 'id', disableHide: true },
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