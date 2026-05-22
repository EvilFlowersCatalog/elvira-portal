import { FiSearch } from 'react-icons/fi';
import { RiAiGenerate } from 'react-icons/ri';
import Breadcrumb from '../../../components/buttons/Breadcrumb';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';

export interface TocSection {
  heading: string;
  items: { label: string; id: string }[];
}

interface HelpLayoutProps {
  title: string;
  toc: TocSection[];
  children: React.ReactNode;
}

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const HelpLayout = ({ title, toc, children }: HelpLayoutProps) => {
  const { specialNavigation } = useAppContext();

  return (
    <div className="h-screen overflow-auto">
      <Breadcrumb />

      {/* Hero header */}
      <div className="relative bg-primaryLight overflow-hidden flex flex-col items-center justify-end pb-6 pt-10" style={{ minHeight: 160 }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <h1 className="relative text-3xl font-extrabold text-secondary text-center mb-6 leading-tight">
          {title}
        </h1>
        <div className="relative w-full max-w-2xl mx-auto px-4">
          <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-2 gap-3">
            <FiSearch size={18} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 font-light"
              placeholder="Hľadať v dokumentácii..."
            />
            <button
              className="flex items-center gap-1.5 bg-primaryLight text-primary text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
              onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.aiChatHistory)}
            >
              <RiAiGenerate size={14} />
              AI Asistent
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto flex gap-6 items-start">
        {/* Main article */}
        <div className="flex-1 bg-white rounded-lg p-6 min-w-0">
          {children}
        </div>

        {/* Sticky TOC */}
        <div className="w-56 shrink-0 sticky top-0">
          <div className="rounded-lg p-4">
            {toc.map((section) => (
              <div key={section.heading} className="mb-6 last:mb-0">
                <p className="text-xs font-bold text-secondary mb-3">{section.heading}</p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item.id} className="text-xs text-gray-600 flex items-baseline gap-1.5">
                      <span className="shrink-0">•</span>
                      <button
                        className="text-left hover:text-primary transition-colors cursor-pointer"
                        onClick={() => scrollTo(item.id)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpLayout;
