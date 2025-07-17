import { BiTrash } from 'react-icons/bi';
import { ActionButton, BubbleText, SubText } from './Cells';
import ElviraTable, { ElviraTableFetchFunction } from './ElviraTable';
import { useState } from 'react';

export default function Test() {
    var API_DATA = [
        { name: 'Andrej', location: 'SK', id: 3 },
        { name: 'Peter', location: 'CZ', id: 6 },
        { name: 'Jana', location: 'SK', id: 9 },
        { name: 'Martin', location: 'CZ', id: 12 },
        { name: 'Lucia', location: 'US', id: 15 },
        { name: 'Tomas', location: 'EN', id: 18 },
        { name: 'Eva', location: 'EN', id: 21 },
        { name: 'Marek', location: 'US', id: 24 },
        { name: 'Zuzana', location: 'SK', id: 27 },
        { name: 'Filip', location: 'CZ', id: 30 }
    ]

    const [limit, setLimit] = useState(5);
    const [page, setPage] = useState(0);
    const [pagesCount, setPagesCount] = useState(2);
    const [data, setData] = useState(getData(API_DATA, 0, limit));

    function getData(data: any, start: number, end: number, sortBy?: string) {
        var sortedData = data.sort((a: any, b: any) => {
            if (sortBy) {
                const isAsc = sortBy[0] !== '-';
                const key = isAsc ? sortBy : sortBy.slice(1);
                if (a[key] < b[key]) return isAsc ? -1 : 1;
                if (a[key] > b[key]) return isAsc ? 1 : -1;
            }
            return 0;
        });
        sortedData = sortedData.slice(start, end);
        return sortedData.map((item: any, index: number) => ({
            name: <SubText text={item.name} subtext={`Subtext ${index + 1}`} />,
            location: <BubbleText text={item.location} className="bg-secondary" />,
            id: <ActionButton icon={<BiTrash size={20} />} onClick={() => console.log(`Delete ${item.name}`)} />,
        }));
    }

    const fetchFunction: ElviraTableFetchFunction = async ({ page, limit, sortBy }) => {
        console.log('sortBy', sortBy);
        setPage(page);
        setLimit(limit);
        setPagesCount(Math.ceil(API_DATA.length / limit));
        setData(getData(API_DATA, page * limit, (page + 1) * limit, sortBy));
    };

    return <ElviraTable title={"tabulka test"}
        header={[
            {
                label: 'Name', selector: 'name', width: '200px', onClick: (row) => {
                    console.log(row);
                }
            },
            { label: 'Column 2', selector: 'location', width: '200px' },
            { label: 'Column 3', selector: 'id', width: '200px', align: 'right', disableSort: true },
        ]}
        data={data}
        metadata={{
            page: page,
            limit: limit,
            pages: pagesCount,
            total: API_DATA.length,
        }}
        fetchFunction={fetchFunction}
        rowsPerPageOptions={[2, 5, 7]}
    ></ElviraTable>
}