import React from "react";
import { IEntryDetail } from "../../../../utils/interfaces/entry";

type Feed = {
    id: string | number;
    title: string;
};

type Author = {
    name: string;
    surname: string;
};

type DetailHeaderProps = {
    entry: IEntryDetail;
    handleParamClick?: (param: string, value: string) => void;
    umamiTrack?: (event: string, data: Record<string, any>) => void;
    feedsDisabled?: boolean;
};

export function DetailHeader({
    entry,
    handleParamClick,
    umamiTrack,
    feedsDisabled
}: DetailHeaderProps) {
    const handleFeedClick = (feed: Feed) => {
        umamiTrack?.("Entry Detail Feed Button Param", {
            feedId: feed.id,
            entryId: entry.id,
        });
        handleParamClick?.("feed-id", feed.id.toString());
    };

    return (
        <div className="w-full">
            {/* Feeds */}
            {entry.feeds.length > 0 && !feedsDisabled && (
                <div className="mb-6 flex gap-2 w-full flex-wrap">
                    {entry.feeds.map((feed, index) => (
                        <button
                            key={index}
                            className="cursor-pointer font-semibold px-2 py-1 text-md bg-primaryLight text-primary rounded-lg"
                            onClick={() => handleFeedClick(feed)}
                        >
                            {feed.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Title */}
            <h3 className="w-full text-secondary dark:text-secondaryLight text-xl font-bold mb-3">
                {entry.title}
            </h3>

            {/* Authors */}
            {entry.authors.length > 0 && (
                <div>
                    <span className="text-darkGray dark:text-lightGray text-center font-light text-xl">
                        {entry.authors[0].name} {entry.authors[0].surname}
                    </span>
                    {entry.authors.length > 1 && (
                        <div className="flex text-zinc-500 flex-wrap gap-x-1">
                            {entry.authors.slice(1).map((author, index, arr) => (
                                <span key={index}>
                                    {author.name} {author.surname}
                                    {index < arr.length - 1 && <span>,</span>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
