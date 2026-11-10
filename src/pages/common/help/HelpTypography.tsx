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
