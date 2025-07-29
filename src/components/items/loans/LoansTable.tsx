import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import ElviraTable, { ElviraTableFetchFunction } from '../../table/ElviraTable';
import { ILicense } from '../../../utils/interfaces/license';
import { ActionButton, BubbleText } from '../../table/Cells';
import { formatDate } from 'date-fns';
import useDownloadLicense from '../../../hooks/api/licenses/useDownloadLicense';
import { toast } from 'react-toastify';
import { FaDownload } from 'react-icons/fa';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';


function Title({ entryId }: { entryId: string }) {
    const getEntryDetail = useGetEntryDetail();
    const [title, setTitle] = useState<string>('Loading...');

    function getTitle(entryId: string): Promise<string> {
        return getEntryDetail(entryId).then((entry) => {
            return entry.title;
        }).catch(() => {
            return 'Unknown Entry';
        });
    }

    useEffect(() => {
        getTitle(entryId).then(setTitle);
    }, [entryId]);

    return <span>{title}</span>;
}

function translateState(state: string, t: any): string {
    switch (state) {
        case 'ready':
            return t('license.loansPage.table.states.ready');
        case 'active':
            return t('license.loansPage.table.states.active');
        case 'returned':
            return t('license.loansPage.table.states.returned');
        case 'expired':
            return t('license.loansPage.table.states.expired');
        case 'revoked':
            return t('license.loansPage.table.states.revoked');
        case 'cancelled':
            return t('license.loansPage.table.states.cancelled');
        default:
            return state;
    }
}

function stateStyle(state: string, t: any): React.CSSProperties {
    switch (state) {
        case 'ready':
            return { color: 'white', backgroundColor: 'green' };
        case 'active':
            return { color: 'white', backgroundColor: 'blue' };
        case 'returned':
            return { color: 'white', backgroundColor: 'gray' };
        case 'expired':
            return { color: 'white', backgroundColor: 'red' };
        case 'revoked':
            return { color: 'white', backgroundColor: 'orange' };
        case 'cancelled':
            return { color: 'white', backgroundColor: 'purple' };
        default:
            return {};
    }
}

export default function LoansTable({ }) {
    const { t } = useTranslation();
    const getUserLoans = useGetLicenses();
    const downloadLcpLicense = useDownloadLicense();

    const [items, setItems] = useState<ILicense[]>([]);
    const [data, setData] = useState<Array<Record<string, string | JSX.Element>>>([]);
    const [metadata, setMetadata] = useState<{ page: number, pages: number, limit: number, total: number }>({
        page: 1,
        limit: 10,
        pages: 1, // undefined
        total: 1, // undefined
    });

    const [searchParams, setSearchParams] = useSearchParams();

    const fetchEntries: ElviraTableFetchFunction = async ({ page, limit, sortBy }) => {
        getUserLoans({
            page,
            limit,
            sortBy
        }).then(({ items: data, metadata }) => {
            // setItems(data);
            setItems([
                {
                    id: 'e0b6bede-d678-4b64-9415-e7243a0489f7',
                    entry_id: 'e0b6bede-d678-4b64-9415-e7243a0489f7',
                    user_id: 'user-1',
                    state: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    starts_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                }
            ]);
            setMetadata(metadata);
        });
    };

    useEffect(() => {
        fetchEntries({ page: metadata.page, limit: metadata.limit, sortBy: '' });
    }, [searchParams]);


    useEffect(() => {
        setData(items.map((item) => ({
            entry_id: item.entry_id,
            title: <Title entryId={item.entry_id} />,
            state: <BubbleText text={translateState(item.state, t)} style={stateStyle(item.state, t)} />,
            starts_at: formatDate(item.starts_at, 'dd.MM.yyyy'),
            ends_at: formatDate(item.expires_at, 'dd.MM.yyyy'),
            actions: <ActionButton onClick={()=>{
                downloadLcpLicense(item.lcp_license_id || item.id).catch((error) => {
                    toast.error(t('notifications.license.download.error', { error: error.message }));
                });
            }} icon={<FaDownload />} />
        })));
    }, [items])

    return (<>
        <ElviraTable title={t('license.loansPage.table.title', { x: metadata.total })} header={[
            { label: t('license.loansPage.table.entry'), selector: 'title', onClick(row){
                setSearchParams((prev)=>{
                    console.log(row);
                    prev.set("entry-detail-id", row.entry_id);
                    return prev;
                })
            }, width: '500px'},
            { label: t('license.loansPage.table.state'), selector: 'state' },
            { label: t('license.loansPage.table.starts_at'), selector: 'starts_at' },
            { label: t('license.loansPage.table.ends_at'), selector: 'ends_at' },
            { label: t('license.loansPage.table.actions'), selector: 'actions', align: 'center' }

        ]} data={data} metadata={metadata} fetchFunction={fetchEntries} rowsPerPageOptions={[5, 10, 25, 50]} />
    </>);

}
