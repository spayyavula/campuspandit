import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TabProps {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabsProps {
  tabs: TabProps[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tab: React.FC<TabProps & { active: boolean; onClick: () => void }> = ({
  label,
  icon: Icon,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm rounded-lg transition-colors ${
        active
          ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-xl">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          active={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        />
      ))}
    </div>
  );
};

export default Tabs;