import { IEntry } from "../../../../utils/interfaces/entry";
import EntryBoxLoading from "../EntryBoxLoading";
import EntriesWrapper from "./EntriesWrapper";
import EntryItem from "./EntryItem";

interface IEntryDisplayParams {
    isLoading: boolean;
    entries: IEntry[];
    type: 'popular' | 'lastAdded';
    limitRows?: boolean;
}

export default function EntryDisplay({
    isLoading,
    entries,
    limitRows = false
}: IEntryDisplayParams) {
    return <EntriesWrapper limitRows={limitRows} className="px-0">
        {isLoading ? Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} fixedSize />
        )) : entries.map((entry, index) => (
            <EntryItem key={entry.id} entry={entry} />
        ))}
    </EntriesWrapper>;
}