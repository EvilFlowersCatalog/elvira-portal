import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TableSortLabel } from "@mui/material";
import { useState } from "react";

interface ElviraTableProps {
    title: string;
    header: {
        label: string;
        selector: string;
        width?: string;
        onClick?: (row: any) => void;
        align?: 'left' | 'center' | 'right';
        disableSort?: boolean;
    }[];
    toolBar?: JSX.Element[];
    data: Array<Record<string, string | JSX.Element>>;
    metadata: {
        page: number;
        limit: number;
        pages: number;
        total: number;
    };
    fetchFunction?: ElviraTableFetchFunction;
    rowsPerPageOptions?: number[];
}

export interface ElviraTableFetchFunction {
    (params: { page: number; limit: number, sortBy: string }): Promise<void>;
}

type Order = 'asc' | 'desc';

export default function ElviraTable({ title, header, data, metadata, fetchFunction, rowsPerPageOptions, toolBar }: ElviraTableProps) {
    var [sortBy, setSortBy] = useState<{ selector: string, order: Order }>({
        selector: '',
        order: 'asc',
    });

    function getOrderByLabel() {
        return sortBy.order === 'desc' ? `-${sortBy.selector}` : sortBy.selector;
    }

    function handleSort(col: { selector: string }) {
        var newOrder: Order = sortBy.selector === col.selector && sortBy.order === 'asc' ? 'desc' : 'asc';
        var orderBy = newOrder == 'desc' ? `-${col.selector}` : col.selector;
        fetchFunction?.({ page: metadata.page, limit: metadata.limit, sortBy: orderBy });
        setSortBy({ selector: col.selector, order: newOrder });
    }

    function getPagination(span:number) {
        if (!metadata) return null;

        return <TablePagination
            colSpan={ span }
            className='dark:text-white'
            sx={{
                '.dark & .MuiButtonBase-root.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.5)',
                },
                ".dark & .MuiSelect-icon": {
                    color: 'white',
                },
            }}
            rowsPerPageOptions={rowsPerPageOptions || [metadata.limit]}
            count={metadata.total}
            page={metadata.page-1}
            rowsPerPage={metadata.limit}
            onPageChange={(e, newPage: number) => {
                fetchFunction?.({ page: newPage+1, limit: metadata.limit, sortBy: getOrderByLabel() });
            }}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                fetchFunction?.({ page: 1, limit: parseInt(e.target.value, 10), sortBy: getOrderByLabel() });
            }}
        />
    }

    return (
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
                            <TableRow className="bg-gray/10 dark:bg-black/70">
                                <TableCell colSpan={1} className="p-0">
                                    <div className="flex items-center pr-4 py-2">
                                        <h2 className="dark:text-white mr-4 text-nowrap">{title}</h2>
                                        <div className="flex">
                                            {toolBar?.map((item, index) => (
                                                <span key={index} className="mr-2 flex">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </TableCell>
                                {getPagination(header.length - 1)}
                            </TableRow>
                        </TableHead>
                        <TableHead className="bg-gray/10 dark:bg-black/70">
                            <TableRow>
                                {header.map((col, index) => (
                                    <TableCell key={index} width={col.width} align={col.align}>
                                        <TableSortLabel
                                            disabled={col.disableSort}
                                            sx={{ '.dark & .MuiSvgIcon-root': { color: 'white' } }}
                                            active={sortBy?.selector === col.selector}
                                            direction={sortBy?.selector === col.selector ? sortBy.order : 'asc'}
                                            onClick={() => handleSort(col)}>
                                            <h3 className='dark:text-white'>{col.label}</h3>
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    {header.map((col, colIndex) => (
                                        <TableCell className={`dark:text-white ${col.onClick && 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800'}`} key={colIndex} style={{ width: col.width }}
                                            onClick={() => {
                                                col.onClick?.(row);
                                            }}
                                            align={col.align}
                                        >
                                            {row[col.selector]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>

                        <TableFooter className='bg-gray/10 dark:bg-black/70'>
                            <TableRow>
                                {getPagination(header.length)}
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Paper >
        </Box >
    );
}