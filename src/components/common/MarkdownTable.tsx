import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { twMerge } from 'tailwind-merge';

/**
 * A table region's extracted Markdown as a real table (admin extraction, assistant figure cards). The Markdown is
 * extractor output, never trusted HTML: react-markdown renders it without raw HTML.
 */
export const MarkdownTable = ({ markdown, className }: { markdown: string; className?: string }) => (
  <div className={twMerge('overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: (props) => <table className="w-full border-collapse text-xs" {...props} />,
        thead: (props) => <thead className="bg-zinc-50 dark:bg-zinc-900/40" {...props} />,
        th: (props) => (
          <th className="border-b border-zinc-200 px-2 py-1.5 text-left font-semibold dark:border-zinc-700" {...props} />
        ),
        td: (props) => <td className="border-b border-zinc-100 px-2 py-1 align-top dark:border-zinc-700/60" {...props} />,
        p: (props) => <p className="px-2 py-1 text-xs" {...props} />,
        // Extractor output may carry links or images; a table cell shows them as plain text.
        a: ({ children }) => <>{children}</>,
        img: ({ alt }) => <>{alt}</>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);
