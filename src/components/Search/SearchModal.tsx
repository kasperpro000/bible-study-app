import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import type { SearchResult, Translation } from '../../types/bible';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translation[];
  activeTranslation: string;
  onSelectResult: (bookId: number, chapter: number, verse: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  translations,
  activeTranslation,
  onSelectResult
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedTrans, setSelectedTrans] = useState(activeTranslation);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedTrans(activeTranslation);
  }, [activeTranslation]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search debounced
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const hits = await window.api.searchVerses(query, selectedTrans, 60, 0);
        setResults(hits);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedTrans]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-workstation-panel border border-workstation-border rounded-xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-workstation-border flex items-center gap-3 bg-workstation-bg">
          <Search className="w-5 h-5 text-workstation-accent flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search verses (e.g. "in the beginning", faith, grace)...'
            className="flex-1 bg-transparent text-sm text-white placeholder-workstation-muted focus:outline-none"
          />

          {/* Translation Filter */}
          <select
            value={selectedTrans}
            onChange={(e) => setSelectedTrans(e.target.value)}
            className="bg-workstation-panel border border-workstation-border text-xs text-white rounded-md px-2 py-1 focus:outline-none cursor-pointer"
          >
            {translations.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.id}
              </option>
            ))}
          </select>

          {isLoading && <Loader2 className="w-4 h-4 text-workstation-accent animate-spin" />}

          <button
            onClick={onClose}
            className="text-workstation-muted hover:text-white p-1 rounded hover:bg-workstation-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {query.trim().length >= 2 && !isLoading && results.length === 0 && (
            <div className="text-center py-12 text-sm text-workstation-muted">
              {t('search.no_results')}
            </div>
          )}

          {results.map((res) => (
            <div
              key={`${res.translation_id}_${res.book_id}_${res.chapter}_${res.verse}`}
              onClick={() => {
                onSelectResult(res.book_id, res.chapter, res.verse);
                onClose();
              }}
              className="p-3 rounded-lg bg-workstation-bg hover:bg-workstation-hover border border-workstation-border/70 hover:border-workstation-accent/50 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-workstation-accent group-hover:underline">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-workstation-accent" />
                  <span>{res.book_name} {res.chapter}:{res.verse}</span>
                </div>
                <span className="text-[10px] text-workstation-muted font-mono bg-workstation-panel px-1.5 py-0.5 rounded border border-workstation-border">
                  {res.translation_id}
                </span>
              </div>

              {res.snippet ? (
                <p 
                  className="text-xs text-slate-300 mt-1.5 leading-relaxed scripture-serif"
                  dangerouslySetInnerHTML={{ __html: res.snippet }}
                />
              ) : (
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed scripture-serif">
                  {res.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-workstation-border bg-workstation-bg/50 flex items-center justify-between text-[11px] text-workstation-muted">
          <span>{results.length > 0 ? `${results.length} results found` : 'Type at least 2 characters'}</span>
          <span>Press <kbd className="px-1 py-0.5 bg-workstation-panel border border-workstation-border rounded text-[10px]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
