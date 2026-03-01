import { useState } from 'react';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';

type SummaryTextProps = {
    html: string;
    readMoreText: string;
    readLessText: string;
};

export function SummaryText({ html, readMoreText, readLessText }: SummaryTextProps) {
    const [expanded, setExpanded] = useState(false);
    const isLong = html.length > 240;
    const visibleHtml = !expanded
        ? html.slice(0, 240) + (isLong ? '...' : '')
        : html;

    return (
        <div className="w-full text-left">
            <span
                className="text-gray-500 dark:text-white"
                dangerouslySetInnerHTML={{ __html: visibleHtml }}
            />
            {isLong && !expanded && (
                <button
                    className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                    onClick={() => setExpanded(true)}
                >
                    <RiAddLine size={24} />
                    {readMoreText}
                </button>
            )}
            {isLong && expanded && (
                <button
                    className="mt-3 text-primary dark:text-primaryLight flex gap-2 justify-center"
                    onClick={() => setExpanded(false)}
                >
                    <RiCloseLine size={24} />
                    {readLessText}
                </button>
            )}
        </div>
    );
}
