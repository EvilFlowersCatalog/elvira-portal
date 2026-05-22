import HelpLayout from './HelpLayout';

export interface LoremSection {
  id: string;
  label: string;
  /** Number of lorem ipsum paragraphs to render under the heading. */
  paragraphs?: number;
}

interface HelpLoremArticleProps {
  title: string;
  /** Heading shown above the section list (also used as the TOC group label). */
  heading: string;
  sections: LoremSection[];
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

/**
 * Placeholder help article built on {@link HelpLayout}. Renders a single
 * heading followed by lorem ipsum sections — used for help pages whose real
 * content has not been written yet.
 */
const HelpLoremArticle = ({ title, heading, sections }: HelpLoremArticleProps) => {
  return (
    <HelpLayout
      title={title}
      toc={[{ heading, items: sections.map(({ id, label }) => ({ id, label })) }]}
    >
      <h2 className="text-xl font-bold text-secondary mb-4">{heading}</h2>

      {sections.map((section, sectionIndex) => (
        <div key={section.id}>
          <h3
            id={section.id}
            className="text-base font-semibold text-secondary mb-2"
          >
            {section.label}
          </h3>
          {Array.from({ length: section.paragraphs ?? 2 }).map((_, i) => (
            <p
              key={i}
              className={`text-sm text-gray-600 leading-relaxed ${
                i === (section.paragraphs ?? 2) - 1 &&
                sectionIndex === sections.length - 1
                  ? ''
                  : 'mb-3'
              }`}
            >
              {LOREM}
            </p>
          ))}
        </div>
      ))}
    </HelpLayout>
  );
};

export default HelpLoremArticle;
