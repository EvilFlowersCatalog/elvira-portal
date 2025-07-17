import { BiTrash } from 'react-icons/bi';
import { ActionButton, BubbleText, SubText } from './Cells';
import ElviraTable, { ElviraTableFetchFunction } from './ElviraTable';
import { useState } from 'react';

export default function Test() {
    var API_DATA = [
        { col1: 'Data 1', col2: 'Data 2', col3: 'Data 3' },
        { col1: 'Data 4', col2: 'Data 5', col3: 'Data 6' },
        { col1: 'Data 7', col2: 'Data 8', col3: 'Data 9' },
        { col1: 'Data 10', col2: 'Data 11', col3: 'Data 12' },
        { col1: 'Data 13', col2: 'Data 14', col3: 'Data 15' },
        { col1: 'Data 16', col2: 'Data 17', col3: 'Data 18' },
        { col1: 'Data 19', col2: 'Data 20', col3: 'Data 21' },
        { col1: 'Data 22', col2: 'Data 23', col3: 'Data 24' },
        { col1: 'Data 25', col2: 'Data 26', col3: 'Data 27' },
        { col1: 'Data 28', col2: 'Data 29', col3: 'Data 30' }
    ]

    const [limit, setLimit] = useState(5);
    const [page, setPage] = useState(0);
    const [pagesCount, setPagesCount] = useState(2);
    const [data, setData] = useState(getData(API_DATA.slice(0, limit)));

    function getData(data: any) {
        return data.map((item: any, index: number) => ({
            col1: <SubText text={item.col1} subtext={`Subtext ${index + 1}`} />,
            col2: <BubbleText text={item.col2} className="bg-secondary" />,
            col3: <ActionButton icon={<BiTrash size={20} />} onClick={() => console.log(`Delete ${item.col1}`)} />,
        }));
    }

    const fetchFunction: ElviraTableFetchFunction = async ({ page, limit }) => {
        setPage(page);
        setLimit(limit);
        setPagesCount(Math.ceil(API_DATA.length / limit));
        setData(getData(API_DATA.slice(page * limit, (page + 1) * limit)));
    };

    return <ElviraTable title={"tabulka test"}
        header={[
            {
                label: 'Column 1', selector: 'col1', width: '200px', onClick: (row) => {
                    console.log(row);
                }
            },
            { label: 'Column 2', selector: 'col2', width: '200px' },
            { label: 'Column 3', selector: 'col3', width: '200px', align: 'right' },
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