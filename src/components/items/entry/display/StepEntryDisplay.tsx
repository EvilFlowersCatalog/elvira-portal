import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { IEntry } from "../../../../utils/interfaces/entry";
import EntryBoxLoading from "../EntryBoxLoading";
import EntryItem from "./EntryItem";
import EntriesWrapper from "./EntriesWrapper";

interface IEntryDisplayParams {
    isLoading: boolean;
    entries: IEntry[];
}

const ITEM_WIDTH = 160;
const ITEM_GAP = 16;
const OVERSCAN = 2;

export default function EntryDisplay({
    isLoading,
    entries
}: IEntryDisplayParams) {
    return <EntriesWrapper limitRows={true} className="px-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {isLoading ? Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} fixedSize />
        )) : entries.map((entry, index) => (
            <div className="flex w-full items-center gap-5">
                <p className="text-4xl">{index+1}</p>
                <EntryItem key={entry.id} entry={entry} />
            </div>
        ))}
    </EntriesWrapper>;
}