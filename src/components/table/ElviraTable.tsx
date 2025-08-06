import { Box, ClickAwayListener, Drawer, Grow, Menu, MenuItem, MenuList, Paper, PopoverPaper, Popper, Select, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TableSortLabel } from "@mui/material";
import { useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";

interface ElviraTableHeader {
    label: string;
    selector: string;
    width?: string;
    onClick?: (row: any) => void;
    align?: 'left' | 'center' | 'right';
    hidden?: boolean
    disableSort?: boolean;
    disableHide?: boolean;
}

interface ElviraTableProps {
    title: string;
    header: ElviraTableHeader[];
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
    const [activeHeader, setActiveHeader] = useState<ElviraTableHeader[]>(header);
    const [hiddenHeader, setHiddenHeader] = useState<ElviraTableHeader[]>(header.filter(col => col.hidden));
    const drawerHeaderRef = useRef<HTMLDivElement>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [headerContextMenu, setHeaderContextMenu] = useState<{
        mouseX: number; mouseY: number, options: {
            colId: string;
            isHidable: boolean;
        }
    } | null>(null);

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

    function getVisibleHeader() {
        return activeHeader.filter(col => !col.hidden);
    }

    function hideHeader(colId: string, hide: boolean) {
        setActiveHeader((prev) => {
            var index = prev.findIndex((col) => col.selector === colId);
            if (index !== -1) {
                prev[index].hidden = hide;
            }
            return [...prev];
        });
    }

    function handleContextMenu(event: React.MouseEvent<HTMLSpanElement>, options: any) {
        event.preventDefault();
        setHeaderContextMenu(
            headerContextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                    options
                } : null,
        );
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            setTimeout(() => {
                selection.addRange(range);
            });
        }
    }

    function getPagination(span: number) {
        if (!metadata) return null;

        return <TablePagination
            colSpan={span}
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
            page={metadata.page - 1}
            rowsPerPage={metadata.limit}
            onPageChange={(e, newPage: number) => {
                fetchFunction?.({ page: newPage + 1, limit: metadata.limit, sortBy: getOrderByLabel() });
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
                <Menu
                    open={headerContextMenu !== null}
                    onClose={() => setHeaderContextMenu(null)}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        headerContextMenu !== null
                            ? { top: headerContextMenu.mouseY, left: headerContextMenu.mouseX }
                            : undefined
                    }
                >
                    <MenuItem disabled={headerContextMenu?.options.isHidable == true} onClick={() => {
                        hideHeader(headerContextMenu!.options.colId, true);
                        setHiddenHeader((prev) => [...prev, header.find((col) => col.selector === headerContextMenu!.options.colId)!]);
                        setHeaderContextMenu(null)
                    }}>Hide</MenuItem>
                </Menu>
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
                                {getPagination(getVisibleHeader().length - 1)}
                            </TableRow>
                        </TableHead>
                        <TableHead className="bg-gray/10 dark:bg-black/70">
                            <TableRow>
                                {getVisibleHeader().map((col, index) => (
                                    <TableCell colSpan={getVisibleHeader().length == 1 ? 2 : 1} className="relative" key={index} width={col.width} align={col.align}>
                                        {!col.disableSort ? (
                                            <TableSortLabel
                                                disabled={col.disableSort}
                                                sx={{ '.dark & .MuiSvgIcon-root': { color: 'white' } }}
                                                active={sortBy?.selector === col.selector}
                                                direction={sortBy?.selector === col.selector ? sortBy.order : 'asc'}
                                                onClick={() => handleSort(col)}>
                                                <span className='dark:text-white whitespace-nowrap pointer'
                                                    style={{
                                                        paddingRight: index == getVisibleHeader().length - 1 && hiddenHeader.length > 0 ? '2rem' : '0',
                                                    }}
                                                    onContextMenu={(e) => handleContextMenu(e, {
                                                        colId: col.selector,
                                                        isHidable: col.disableHide
                                                    })}
                                                >{col.label}</span>
                                            </TableSortLabel>) : <span className='dark:text-white whitespace-nowrap pointer'
                                                style={{
                                                    paddingRight: index == getVisibleHeader().length - 1 && hiddenHeader.length > 0 ? '2rem' : '0',
                                                }}
                                                onContextMenu={(e) => handleContextMenu(e, {
                                                    colId: col.selector,
                                                    isHidable: col.disableHide
                                                })}>
                                            <span className='dark:text-white whitespace-nowrap pointer'>{col.label}</span>
                                        </span>
                                        }
                                        {index == getVisibleHeader().length - 1 && hiddenHeader.length > 0 ? <div>
                                            <p
                                                ref={drawerHeaderRef}
                                                aria-controls={isDrawerOpen ? 'composition-menu' : undefined}
                                                aria-expanded={isDrawerOpen ? 'true' : undefined}
                                                aria-haspopup="true"
                                                className="absolute top-0 right-0 px-4 h-full flex justify-center items-center">
                                                <FiPlus size={18} className="cursor-pointer dark:text-white" onClick={() => {
                                                    setIsDrawerOpen(true);
                                                }} />
                                            </p>
                                            <Popper
                                                open={isDrawerOpen}
                                                anchorEl={drawerHeaderRef.current}
                                                placement="bottom-end"
                                                transition
                                                disablePortal
                                            >
                                                {({ TransitionProps, placement }) => (
                                                    <Grow
                                                        {...TransitionProps}
                                                        style={{
                                                            transformOrigin:
                                                                placement === 'bottom-start' ? 'left top' : 'left bottom',
                                                        }}
                                                    >
                                                        <Paper>
                                                            <ClickAwayListener onClickAway={() => { setIsDrawerOpen(false) }}>
                                                                <MenuList>
                                                                    {hiddenHeader.map((item, index) => (
                                                                        <MenuItem key={index} onClick={() => {
                                                                            hideHeader(item.selector, false);
                                                                            setHiddenHeader((prev) => prev.filter((i) => i !== item));
                                                                            setIsDrawerOpen(false);
                                                                        }}>
                                                                            {item.label}
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </ClickAwayListener>
                                                        </Paper>
                                                    </Grow>
                                                )}
                                            </Popper>
                                        </div> : null}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    {getVisibleHeader().map((col, colIndex) => (
                                        <TableCell colSpan={getVisibleHeader().length == 1 ? 2 : 1} className={`dark:text-white ${col.onClick && 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800'}`} key={colIndex} style={{ width: col.width }}
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
                                {getPagination(Math.max(getVisibleHeader().length, 2))}
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Paper >
        </Box >
    );
}