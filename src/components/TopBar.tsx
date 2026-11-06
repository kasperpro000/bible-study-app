import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Columns2, Square, Network, Calendar, Globe, 
  WifiOff, BookOpen, Bookmark, FileText, CheckCircle2, Plus, FolderPlus, Settings 
} from 'lucide-react';
import type { Translation } from '../types/bible';

interface TopBarProps {
  translations: Translation[];
  primaryTrans: string;
  secondaryTrans: string;
  isParallel: boolean;
  onSelectPrimaryTrans: (id: string) => void;
  onSelectSecondaryTrans: (id: string) => void;
  onToggleParallel: () => void;
  onOpenSearch: () => void;
  onToggleGraph: () => void;
  isGraphOpen: boolean;
  onOpenPlans: () => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  activeSidebarTab: 'books' | 'bookmarks' | 'notes';
  onSelectSidebarTab: (tab: 'books' | 'bookmarks' | 'notes') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  translations,
  primaryTrans,
  secondaryTrans,
  isParallel,
  onSelectPrimaryTrans,
  onSelectSecondaryTrans,
  onToggleParallel,
  onOpenSearch,
  onToggleGraph,
  isGraphOpen,
  onOpenPlans,
  onOpenImport,
  onOpenSettings,
  activeSidebarTab,
  onSelectSidebarTab
}) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'nl' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('berean_lang', nextLang);
  };

  return (
    <header className="h-14 bg-workstation-panel border-b border-workstation-border flex items-center justify-between px-4 select-none flex-shrink-0 z-30">
      {/* Brand & Workspace Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-workstation-accent font-semibold tracking-wide">
          <div className="w-8 h-8 rounded-lg bg-workstation-accent/10 border border-workstation-accent/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-workstation-accent" />
          </div>
          <span className="text-white text-base font-bold hidden sm:inline">Berean</span>
        </div>

        {/* Sidebar View Switchers */}
        <div className="flex items-center bg-workstation-bg p-0.5 rounded-lg border border-workstation-border">
          <button
            onClick={() => onSelectSidebarTab('books')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeSidebarTab === 'books'
                ? 'bg-workstation-active text-workstation-accent shadow-sm'
                : 'text-workstation-muted hover:text-white'
            }`}
            title="Scriptures Explorer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bible</span>
          </button>
          <button
            onClick={() => onSelectSidebarTab('bookmarks')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeSidebarTab === 'bookmarks'
                ? 'bg-workstation-active text-workstation-accent shadow-sm'
                : 'text-workstation-muted hover:text-white'
            }`}
            title={t('app.bookmarks')}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t('app.bookmarks')}</span>
          </button>
          <button
            onClick={() => onSelectSidebarTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeSidebarTab === 'notes'
                ? 'bg-workstation-active text-workstation-accent shadow-sm'
                : 'text-workstation-muted hover:text-white'
            }`}
            title={t('app.notes')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('app.notes')}</span>
          </button>
        </div>
      </div>

      {/* Global Quick Search Button */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-workstation-bg hover:bg-workstation-hover text-workstation-muted hover:text-workstation-text rounded-lg border border-workstation-border text-xs transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-workstation-muted group-hover:text-workstation-accent" />
            <span className="truncate">{t('app.search_placeholder')}</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-workstation-panel border border-workstation-border rounded text-workstation-muted">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Action Controls & Utilities */}
      <div className="flex items-center gap-2.5">
        {/* Translation Selectors */}
        <div className="flex items-center gap-1.5 bg-workstation-bg p-1 rounded-lg border border-workstation-border">
          <select
            value={primaryTrans}
            onChange={(e) => onSelectPrimaryTrans(e.target.value)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer px-1 py-0.5"
          >
            {translations.map((t) => (
              <option key={t.id} value={t.id} className="bg-workstation-panel text-white">
                {t.id} ({t.language.toUpperCase()})
              </option>
            ))}
          </select>

          {isParallel && (
            <>
              <span className="text-workstation-muted text-xs">/</span>
              <select
                value={secondaryTrans}
                onChange={(e) => onSelectSecondaryTrans(e.target.value)}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer px-1 py-0.5"
              >
                {translations.map((t) => (
                  <option key={t.id} value={t.id} className="bg-workstation-panel text-white">
                    {t.id} ({t.language.toUpperCase()})
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Toggle Parallel */}
          <button
            onClick={onToggleParallel}
            className={`p-1 rounded hover:bg-workstation-hover transition-colors ${
              isParallel ? 'text-workstation-accent' : 'text-workstation-muted'
            }`}
            title={isParallel ? t('app.single_view') : t('app.parallel_view')}
          >
            {isParallel ? <Columns2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>

          <div className="w-[1px] h-3.5 bg-workstation-border mx-0.5" />

          {/* Manage & Import Translations Button */}
          <button
            onClick={onOpenImport}
            className="p-1 rounded text-workstation-muted hover:text-workstation-accent hover:bg-workstation-hover transition-colors"
            title="Import & Manage Translations"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Knowledge Graph Button */}
        <button
          onClick={onToggleGraph}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isGraphOpen
              ? 'bg-workstation-accent/15 border-workstation-accent text-workstation-accent shadow-sm'
              : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white hover:bg-workstation-hover'
          }`}
          title={t('app.knowledge_graph')}
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t('app.knowledge_graph')}</span>
        </button>

        {/* Reading Plans Button */}
        <button
          onClick={onOpenPlans}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white rounded-lg text-xs font-medium transition-colors"
          title={t('app.reading_plans')}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{t('app.reading_plans')}</span>
        </button>

        {/* Language Toggle (EN / NL) */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-text rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
          title="Switch Language (English / Nederlands)"
        >
          <Globe className="w-3.5 h-3.5 text-workstation-accent" />
          <span>{i18n.language}</span>
        </button>

        {/* Settings Menu Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white rounded-lg text-xs transition-colors"
          title={t('app.settings')}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Offline Status Badge */}
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-400 font-medium"
          title="Fully offline with local SQLite storage"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden xl:inline">{t('app.offline_badge')}</span>
        </div>
      </div>
    </header>
  );
};
