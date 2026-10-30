import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, ChevronRight, ChevronDown, Bookmark, Trash2, 
  ExternalLink, Search, FileText 
} from 'lucide-react';
import type { Book, Bookmark as BookmarkType, Note } from '../types/bible';

interface SidebarProps {
  books: Book[];
  currentBookId: number;
  currentChapter: number;
  onSelectChapter: (bookId: number, chapter: number) => void;
  bookmarks: BookmarkType[];
  onDeleteBookmark: (id: string) => void;
  notes: Note[];
  activeTab: 'books' | 'bookmarks' | 'notes';
  onSelectNote: (note: Note) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  books,
  currentBookId,
  currentChapter,
  onSelectChapter,
  bookmarks,
  onDeleteBookmark,
  notes,
  activeTab,
  onSelectNote
}) => {
  const { t, i18n } = useTranslation();
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedBookId, setExpandedBookId] = useState<number | null>(currentBookId);

  const isNl = i18n.language === 'nl';

  const getBookName = (book: Book) => (isNl ? book.name_nl : book.name_en);

  const filteredBooks = books.filter((b) => {
    const name = getBookName(b).toLowerCase();
    const q = filterQuery.toLowerCase();
    return name.includes(q) || b.abbr_en.toLowerCase().includes(q) || b.abbr_nl.toLowerCase().includes(q);
  });

  const otBooks = filteredBooks.filter((b) => b.testament === 'OT');
  const ntBooks = filteredBooks.filter((b) => b.testament === 'NT');

  return (
    <aside className="w-72 bg-workstation-sidebar border-r border-workstation-border flex flex-col h-full flex-shrink-0 select-none overflow-hidden">
      {/* Tab: BIBLE BOOKS */}
      {activeTab === 'books' && (
        <div className="flex flex-col h-full">
          {/* Search/Filter Bar */}
          <div className="p-3 border-b border-workstation-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-workstation-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('nav.filter_books')}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-workstation-bg border border-workstation-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-workstation-muted focus:outline-none focus:border-workstation-accent"
              />
            </div>
          </div>

          {/* Books Tree List */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {/* Old Testament */}
            {otBooks.length > 0 && (
              <div>
                <div className="px-2 pb-1.5 text-[11px] font-bold text-workstation-muted uppercase tracking-wider">
                  {t('nav.old_testament')}
                </div>
                <div className="space-y-0.5">
                  {otBooks.map((b) => renderBookItem(b))}
                </div>
              </div>
            )}

            {/* New Testament */}
            {ntBooks.length > 0 && (
              <div>
                <div className="px-2 pb-1.5 text-[11px] font-bold text-workstation-accent uppercase tracking-wider">
                  {t('nav.new_testament')}
                </div>
                <div className="space-y-0.5">
                  {ntBooks.map((b) => renderBookItem(b))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-workstation-border flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {t('app.bookmarks')} ({bookmarks.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {bookmarks.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-workstation-muted">
                No bookmarks saved yet. Click the bookmark icon on any verse while reading!
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-2.5 rounded-lg bg-workstation-panel hover:bg-workstation-hover border border-workstation-border group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onSelectChapter(bm.book_id, bm.chapter)}
                      className="text-xs font-semibold text-workstation-accent hover:underline flex items-center gap-1.5 text-left"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-workstation-gold text-workstation-gold" />
                      <span>{bm.book_name} {bm.chapter}:{bm.verse}</span>
                    </button>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="opacity-0 group-hover:opacity-100 text-workstation-muted hover:text-red-400 p-1 rounded transition-opacity"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {bm.verse_text && (
                    <p className="text-[11px] text-workstation-muted mt-1 line-clamp-2 italic">
                      "{bm.verse_text}"
                    </p>
                  )}
                  {bm.label && (
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[10px] bg-workstation-bg border border-workstation-border rounded text-workstation-muted">
                      {bm.label}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: NOTES */}
      {activeTab === 'notes' && (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-workstation-border flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {t('app.notes')} ({notes.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {notes.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-workstation-muted">
                No personal notes created yet. Select any verse in the reader to write notes in the Inspector panel.
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onSelectNote(n)}
                  className="p-2.5 rounded-lg bg-workstation-panel hover:bg-workstation-hover border border-workstation-border cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <FileText className="w-3.5 h-3.5 text-workstation-accent" />
                    <span className="truncate">{n.title || 'Untitled Note'}</span>
                  </div>
                  <p className="text-[11px] text-workstation-muted mt-1 line-clamp-2 font-mono">
                    {n.content_markdown}
                  </p>
                  {n.linked_verses && n.linked_verses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {n.linked_verses.map((lv, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectChapter(lv.book_id, lv.chapter);
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-workstation-active hover:bg-workstation-accent/20 text-workstation-accent border border-workstation-border rounded flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>{lv.book_name} {lv.chapter}:{lv.verse}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );

  function renderBookItem(book: Book) {
    const isExpanded = expandedBookId === book.id;
    const isCurrentBook = currentBookId === book.id;

    return (
      <div key={book.id} className="rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isCurrentBook
              ? 'bg-workstation-active text-workstation-accent'
              : 'text-workstation-text hover:bg-workstation-hover'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-workstation-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-workstation-muted" />
            )}
            <span className="truncate">{getBookName(book)}</span>
          </div>
          <span className="text-[10px] text-workstation-muted px-1.5 py-0.2 rounded bg-workstation-bg">
            {book.chapters_count}
          </span>
        </button>

        {/* Chapters Grid */}
        {isExpanded && (
          <div className="p-2 grid grid-cols-5 gap-1 bg-workstation-bg/50 border border-workstation-border/50 rounded-b-lg my-1">
            {Array.from({ length: book.chapters_count }, (_, i) => i + 1).map((ch) => {
              const isSelected = isCurrentBook && currentChapter === ch;
              return (
                <button
                  key={ch}
                  onClick={() => onSelectChapter(book.id, ch)}
                  className={`h-7 flex items-center justify-center text-xs font-medium rounded transition-colors ${
                    isSelected
                      ? 'bg-workstation-accent text-slate-950 font-bold shadow-sm'
                      : 'text-workstation-muted hover:text-white hover:bg-workstation-hover'
                  }`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
};
