import { useState, createContext, useContext } from 'react';

type TabContextType = {
  activeTab: string | null;
  setActiveTab: React.Dispatch<React.SetStateAction<string | null>>;
};

const TabContext = createContext<TabContextType>({
  activeTab: null,
  setActiveTab: () => {},
});

type TabsComponentProps = {
  children: React.ReactNode;
  defaultTab?: string
};

export function TabsComponent({ defaultTab, children }: TabsComponentProps) {
  const [activeTab, setActiveTab] = useState<string | null>(defaultTab || null);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="mt-8">{children}</div>
    </TabContext.Provider>
  );
}

type TabsHeaderProps = {
  children: React.ReactNode;
};

export function TabsHeader({ children }: TabsHeaderProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-darkGray mb-4">
      {children}
    </div>
  );
}

type TabTitleProps = {
  id: string;
  children: React.ReactNode;
};

export function TabTitle({ id, children }: TabTitleProps) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 font-semibold focus:outline-none ${
        isActive
          ? 'border-b-2 border-primary dark:border-primaryLight text-primary dark:text-primaryLight'
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {children}
    </button>
  );
}

type TabsProps = {
  children: React.ReactNode;
};

export function Tabs({ children }: TabsProps) {
  return <div>{children}</div>;
}

type TabContentProps = {
  id: string;
  children: React.ReactNode;
};

export function TabContent({ id, children }: TabContentProps) {
  const { activeTab } = useContext(TabContext);
  return activeTab === id ? <div>{children}</div> : null;
}
