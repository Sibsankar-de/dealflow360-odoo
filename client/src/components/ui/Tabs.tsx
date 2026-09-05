"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  defaultActiveTab?: string;
  onChange?: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
  tabListClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs = [],
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onChange,
  children,
  className,
  tabListClassName,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    defaultActiveTab || (tabs[0]?.id ?? "")
  );

  const activeId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (id: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(id);
    }
    onChange?.(id);
  };

  const activeContent = tabs.find((t) => t.id === activeId)?.content;

  return (
    <div className={clsx("w-full flex flex-col gap-4", className)}>
      <div
        role="tablist"
        className={clsx(
          "flex items-center gap-1 border-b border-border overflow-x-auto",
          tabListClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-brand-600 text-brand-600 font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border",
                tab.disabled && "opacity-50 cursor-not-allowed hover:border-transparent"
              )}
            >
              {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="ml-1">{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {activeContent && (
        <div role="tabpanel" className="w-full text-text-primary">
          {activeContent}
        </div>
      )}

      {children && <div role="tabpanel" className="w-full text-text-primary">{children}</div>}
    </div>
  );
};

export default Tabs;
