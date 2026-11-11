import { IEntry } from "../../../../utils/interfaces/entry";
import EntryBoxLoading from "../EntryBoxLoading";
import EntriesWrapper from "./EntriesWrapper";
import EntryItem from "./EntryItem";

interface IEntryDisplayParams {
    isLoading: boolean;
    entries: IEntry[];
    limitRows?: boolean;
    /** How many leading covers are above the fold (eager + high priority); the rest lazy-load. */
    priorityCount?: number;
}

export default function EntryDisplay({
    isLoading,
    entries,
    limitRows = false,
    priorityCount = 0
}: IEntryDisplayParams) {
    return <EntriesWrapper limitRows={limitRows} className="px-0">
        {isLoading ? Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} fixedSize />
        )) : entries.map((entry, index) => (
            <EntryItem key={entry.id} entry={entry} priority={index < priorityCount} />
        ))}
    </EntriesWrapper>;
}