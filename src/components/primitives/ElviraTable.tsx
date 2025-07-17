import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow } from "@mui/material";
import { useState } from "react";

interface ElviraTableProps {
    title: string;
    header: {
        label: string;
        selector: string;
        width?: string;
    }[];
    data: any[];
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
    (params: { page: number; limit: number, sortBy?: string }): Promise<void>;
}

export default function ElviraTable({ title, header, data, metadata, fetchFunction, rowsPerPageOptions }: ElviraTableProps) {
    function getPagination() {
        if(!metadata) return null;

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
            rowsPerPageOptions={rowsPerPageOptions || [metadata.limit]}
            count={metadata.total}
            page={metadata.page}
            rowsPerPage={metadata.limit}
            onPageChange={(e, newPage: number) => {
                fetchFunction?.({ page: newPage, limit: metadata.limit });
            }}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                fetchFunction?.({ page: 0, limit: parseInt(e.target.value, 10) });
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
                            <TableCell width="200px">
                                <h2 className='dark:text-white'>{title}</h2>
                            </TableCell>
                            {getPagination()}
                        </TableHead>

                        <TableHead>
                            <TableRow>
                                {header.map((col, index) => (
                                    <TableCell key={index} width={col.width}>
                                        <h3 className='dark:text-white'>{col.label}</h3>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    {header.map((col, colIndex) => (
                                        <TableCell className="dark:text-white" key={colIndex} style={{ width: col.width }}>
                                            {row[col.selector]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>

                        <TableFooter>
                            {getPagination()}
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}