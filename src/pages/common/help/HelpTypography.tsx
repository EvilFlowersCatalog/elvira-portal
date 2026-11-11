import { ReactNode } from 'react';

/** Shared typography for help articles rendered inside {@link HelpLayout}. */

export const HelpH2 = ({ children, first = false }: { children: ReactNode; first?: boolean }) => (
  <h2 className={`text-xl font-bold text-secondary dark:text-secondaryLight mb-4 ${first ? '' : 'mt-8'}`}>
    {children}
  </h2>
);

export const HelpH3 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h3 id={id} className="text-base font-semibold text-secondary dark:text-secondaryLight mb-2 mt-5 scroll-mt-4">
    {children}
  </h3>
);

export const HelpP = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-3">{children}</p>
);

export const HelpList = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

/** Numbered steps of a procedure. */
export const HelpSteps = ({ items }: { items: ReactNode[] }) => (
  <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ol>
);

/** Inline monospace for addresses, file names and menu paths the reader types or looks for. */
export const HelpCode = ({ children }: { children: ReactNode }) => (
  <code className="px-1.5 py-0.5 rounded bg-lightGray dark:bg-darkGray text-[13px] text-secondary dark:text-secondaryLight break-all">
    {children}
  </code>
);

/** A highlighted note: a tip, or a limitation worth stopping for. */
export const HelpNote = ({ children }: { children: ReactNode }) => (
  <div className="border-l-4 border-primary bg-primaryLight dark:bg-darkGray rounded-r-lg px-4 py-3 mb-4 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
    {children}
  </div>
);

/**
 * A screenshot with a caption. Pass `darkSrc` when a dark-theme variant exists;
 * it replaces the light one while the portal is in dark mode.
 */
export const HelpFigure = ({ src, darkSrc, alt, caption }: { src: string; darkSrc?: string; alt: string; caption?: ReactNode }) => (
  <figure className="mb-5">
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`w-full max-w-2xl rounded-lg border border-gray-200 dark:border-zinc-700 ${darkSrc ? 'dark:hidden' : ''}`}
    />
    {darkSrc && (
      <img
        src={darkSrc}
        alt={alt}
        loading="lazy"
        className="hidden dark:block w-full max-w-2xl rounded-lg border border-zinc-700"
      />
    )}
    {caption && <figcaption className="mt-2 text-xs text-gray-500 dark:text-zinc-500">{caption}</figcaption>}
  </figure>
);
