import { IEntry } from "../../../../utils/interfaces/entry";
import EntryBoxLoading from "../EntryBoxLoading";
import EntriesWrapper from "./EntriesWrapper";
import EntryItem from "./EntryItem";

interface IThemedEntryDisplayParams {
    title: string;
    color: string;
    isLoading: boolean;
    entries: IEntry[];
    limitRows?: boolean;
}

export default function ThemedEntryDisplay({
    title,
    color,
    isLoading,
    entries,
    limitRows = false
}: IThemedEntryDisplayParams) {
    return (
        <div
            className="rounded-[5px] py-4 overflow-hidden"
            style={{
                borderLeft: `10px solid ${color}`,
                backgroundColor: `color-mix(in srgb, ${color} 50%, transparent)`,
            }}
        >
            <h2 className="text-lg font-bold text-secondary dark:text-secondaryLight px-4 mb-4">{title}</h2>
            <EntriesWrapper limitRows={limitRows} className="px-4">
                {isLoading
                    ? Array.from({ length: 30 }).map((_, index) => (
                        <EntryBoxLoading key={index} fixedSize />
                    ))
                    : entries.map((entry) => (
                        <EntryItem key={entry.id} entry={entry} />
                    ))}
            </EntriesWrapper>
        </div>
    );
}
