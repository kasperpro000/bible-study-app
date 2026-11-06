import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Network, FileText, Sparkles, ExternalLink, Save, 
  Trash2, X, ChevronRight, Eye, Edit3, BookOpen 
} from 'lucide-react';
import { marked } from 'marked';
import type { Verse, CrossReference, Note, Book, Translation } from '../../types/bible';

interface InspectorContainerProps {
  selectedVerse: Verse | null;
  currentBook: Book | null;
  crossReferences: CrossReference[];
  notes: Note[];
  studyTrans?: string;
  onSelectStudyTrans?: (transId: string) => void;
  translations?: Translation[];
  fontFamily?: 'serif' | 'sans' | 'mono';
  onSaveNote: (note: Note, linkedVerses?: { book_id: number; chapter: number; verse: number }[]) => void;
  onJumpToPassage: (bookId: number, chapter: number, verse?: number) => void;
  onClose: () => void;
}

export const InspectorContainer: React.FC<InspectorContainerProps> = ({
  selectedVerse,
  currentBook,
  crossReferences,
  notes,
  studyTrans = 'KJV',
  onSelectStudyTrans,
  translations = [],
  fontFamily = 'serif',
  onSaveNote,
  onJumpToPassage,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'xrefs' | 'notes'>('xrefs');
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Find existing note linked to selected verse
  useEffect(() => {
    if (!selectedVerse) return;
    const existing = notes.find(n => 
      n.linked_verses?.some(lv => 
        lv.book_id === selectedVerse.book_id && 
        lv.chapter === selectedVerse.chapter && 
        lv.verse === selectedVerse.verse
      )
    );

    if (existing) {
      setNoteTitle(existing.title);
      setNoteContent(existing.content_markdown);
    } else {
      const bookName = currentBook ? (i18n.language === 'nl' ? currentBook.name_nl : currentBook.name_en) : 'Verse';
      setNoteTitle(`Study Note: ${bookName} ${selectedVerse.chapter}:${selectedVerse.verse}`);
      setNoteContent('');
    }
  }, [selectedVerse?.book_id, selectedVerse?.chapter, selectedVerse?.verse]);

  const handleSave = () => {
    if (!selectedVerse) return;
    const noteId = `note_${selectedVerse.book_id}_${selectedVerse.chapter}_${selectedVerse.verse}`;
    const newNote: Note = {
      id: noteId,
      title: noteTitle,
      content_markdown: noteContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onSaveNote(newNote, [{
      book_id: selectedVerse.book_id,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse
    }]);
  };

  const bookName = currentBook ? (i18n.language === 'nl' ? currentBook.name_nl : currentBook.name_en) : '';

  return (
    <aside className="w-80 bg-workstation-sidebar border-l border-workstation-border flex flex-col h-full flex-shrink-0 select-none overflow-hidden">
      {/* Inspector Header */}
      <div className="h-12 border-b border-workstation-border px-3.5 flex items-center justify-between bg-workstation-panel/70 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-workstation-accent" />
          <span className="text-xs font-bold text-white tracking-wide">
            {selectedVerse 
              ? `${bookName} ${selectedVerse.chapter}:${selectedVerse.verse}`
              : t('inspector.title')
            }
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-workstation-muted hover:text-white p-1 rounded hover:bg-workstation-hover"
          title="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-workstation-border bg-workstation-bg p-1 gap-1 flex-shrink-0">
        <button
          onClick={() => setActiveTab('xrefs')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'xrefs'
              ? 'bg-workstation-active text-workstation-accent shadow-sm'
              : 'text-workstation-muted hover:text-white'
          }`}
        >
          <Network className="w-3 h-3" />
          <span>{t('inspector.cross_references')} ({crossReferences.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-workstation-active text-workstation-accent shadow-sm'
              : 'text-workstation-muted hover:text-white'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>{t('inspector.notes')}</span>
        </button>
      </div>

      {/* Selected Verse Banner */}
      {selectedVerse && (
        <div className="p-3 bg-workstation-panel/40 border-b border-workstation-border/60">
          <p className={`text-xs text-slate-300 italic line-clamp-3 ${
            fontFamily === 'serif' ? 'scripture-serif' : fontFamily === 'mono' ? 'scripture-mono' : 'scripture-sans'
          }`}>
            "{selectedVerse.text}"
          </p>
        </div>
      )}

      {/* Tab Body: CROSS REFERENCES */}
      {activeTab === 'xrefs' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Version Switcher for Cross References */}
          <div className="px-3 py-1.5 bg-workstation-bg/90 border-b border-workstation-border flex items-center justify-between text-[11px] text-workstation-muted flex-shrink-0">
            <span className="font-medium text-slate-300 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-workstation-accent" />
              <span>Version:</span>
            </span>
            {translations.length > 0 && onSelectStudyTrans ? (
              <select
                value={studyTrans}
                onChange={(e) => onSelectStudyTrans(e.target.value)}
                className="bg-workstation-panel border border-workstation-border text-white text-[11px] font-semibold rounded px-1.5 py-0.5 focus:outline-none focus:border-workstation-accent cursor-pointer"
                title="Change version for cross-reference text"
              >
                {translations.map((tr) => (
                  <option key={tr.id} value={tr.id} className="bg-workstation-panel text-white">
                    {tr.id} ({tr.language.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-workstation-accent font-semibold">{studyTrans}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {crossReferences.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-workstation-muted">
                {selectedVerse ? t('inspector.no_cross_refs') : 'Click any verse to inspect cross-references.'}
              </div>
            ) : (
              crossReferences.map((xr) => (
                <div
                  key={xr.id}
                  onClick={() => onJumpToPassage(xr.to_book_id, xr.to_chapter, xr.to_verse)}
                  className="p-2.5 rounded-lg bg-workstation-panel hover:bg-workstation-hover border border-workstation-border cursor-pointer group transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-workstation-accent group-hover:underline">
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3 text-workstation-muted group-hover:text-workstation-accent" />
                      <span>{xr.to_book_name} {xr.to_chapter}:{xr.to_verse}</span>
                    </div>
                    <span className="text-[10px] text-workstation-muted font-mono bg-workstation-bg px-1.5 py-0.5 rounded border border-workstation-border">
                      {xr.votes} votes
                    </span>
                  </div>

                  {xr.to_verse_text && (
                    <p className={`text-[11px] text-slate-300 mt-1 line-clamp-2 ${
                      fontFamily === 'serif' ? 'scripture-serif' : fontFamily === 'mono' ? 'scripture-mono' : 'scripture-sans'
                    }`}>
                      {xr.to_verse_text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Body: VERSE STUDY NOTES */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-workstation-muted uppercase">
              Markdown Editor
            </span>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="text-[11px] text-workstation-accent hover:underline flex items-center gap-1"
            >
              {isPreview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>
          </div>

          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note Title..."
            className="w-full bg-workstation-bg border border-workstation-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-workstation-muted focus:outline-none focus:border-workstation-accent mb-2"
          />

          {isPreview ? (
            <div 
              className="flex-1 bg-workstation-bg border border-workstation-border rounded-lg p-3 text-xs text-slate-200 overflow-y-auto prose prose-invert prose-xs"
              dangerouslySetInnerHTML={{ __html: marked.parse(noteContent || '*No content yet.*') as string }}
            />
          ) : (
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('inspector.note_placeholder')}
              className="flex-1 w-full bg-workstation-bg border border-workstation-border rounded-lg p-2.5 text-xs text-white placeholder-workstation-muted focus:outline-none focus:border-workstation-accent resize-none font-mono"
            />
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-workstation-accent hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('inspector.save_note')}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
