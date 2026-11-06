import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { ReaderContainer } from './components/Reader/ReaderContainer';
import { InspectorContainer } from './components/Inspector/InspectorContainer';
import { SearchModal } from './components/Search/SearchModal';
import { KnowledgeGraph } from './components/Graph/KnowledgeGraph';
import { ReadingPlanModal } from './components/ReadingPlan/ReadingPlanModal';
import { ImportTranslationModal } from './components/Translations/ImportTranslationModal';
import { SettingsModal, FontFamilyType, LineSpacingType } from './components/Settings/SettingsModal';

import type { 
  Translation, Book, Verse, Highlight, Bookmark, Note, CrossReference 
} from './types/bible';

export const App: React.FC = () => {
  const { i18n } = useTranslation();

  // --- Translations & Books ---
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [primaryTrans, setPrimaryTrans] = useState<string>('KJV');
  const [secondaryTrans, setSecondaryTrans] = useState<string>('SVV');
  const [isParallel, setIsParallel] = useState<boolean>(true);

  // --- Study & Cross-Reference Translation ---
  const [studyTrans, setStudyTrans] = useState<string>(() => {
    return localStorage.getItem('berean_study_trans') || (localStorage.getItem('berean_lang') === 'nl' ? 'SVV' : 'KJV');
  });

  // --- Reading Position ---
  const [currentBookId, setCurrentBookId] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // --- Verses Data ---
  const [primaryVerses, setPrimaryVerses] = useState<Verse[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<Verse[]>([]);
  const [crossRefsCounts, setCrossRefsCounts] = useState<Record<number, number>>({});
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);

  // --- User Study Data ---
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // --- UI Panels & Modals ---
  const [activeSidebarTab, setActiveSidebarTab] = useState<'books' | 'bookmarks' | 'notes'>('books');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [isPlansOpen, setIsPlansOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // --- Typography Preferences ---
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('berean_font_size') || '18', 10);
  });
  const [fontFamily, setFontFamily] = useState<FontFamilyType>(() => {
    return (localStorage.getItem('berean_font_family') as FontFamilyType) || 'serif';
  });
  const [lineSpacing, setLineSpacing] = useState<LineSpacingType>(() => {
    return (localStorage.getItem('berean_line_spacing') as LineSpacingType) || 'relaxed';
  });

  useEffect(() => {
    localStorage.setItem('berean_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('berean_font_family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('berean_line_spacing', lineSpacing);
  }, [lineSpacing]);

  useEffect(() => {
    localStorage.setItem('berean_study_trans', studyTrans);
  }, [studyTrans]);

  // 1. Initial Load: Metadata & User Data
  useEffect(() => {
    const init = async () => {
      try {
        const [tr, bk, bm, nt] = await Promise.all([
          window.api.getTranslations(),
          window.api.getBooks(),
          window.api.getBookmarks(studyTrans, i18n.language),
          window.api.getNotes(i18n.language)
        ]);
        setTranslations(tr);
        setBooks(bk);
        setBookmarks(bm);
        setNotes(nt);
      } catch (e) {
        console.error('Initialization error:', e);
      }
    };
    init();
  }, []);

  // Refresh bookmarks & notes when study translation or UI language changes
  useEffect(() => {
    window.api.getBookmarks(studyTrans, i18n.language).then(setBookmarks).catch(console.error);
    window.api.getNotes(i18n.language).then(setNotes).catch(console.error);
  }, [studyTrans, i18n.language]);

  // 2. Load Verses for Current Chapter
  const loadChapter = useCallback(async (bookId: number, chapter: number) => {
    try {
      const [pVerses, sVerses, hls] = await Promise.all([
        window.api.getChapterVerses(primaryTrans, bookId, chapter),
        isParallel ? window.api.getChapterVerses(secondaryTrans, bookId, chapter) : Promise.resolve([]),
        window.api.getHighlights(bookId, chapter)
      ]);

      setPrimaryVerses(pVerses);
      setSecondaryVerses(sVerses);
      setHighlights(hls);

      // Pre-fetch cross reference counts for badge indicators
      const counts: Record<number, number> = {};
      await Promise.all(
        pVerses.slice(0, 40).map(async (v) => {
          const refs = await window.api.getCrossReferences(bookId, chapter, v.verse, 10, studyTrans, i18n.language);
          if (refs.length > 0) {
            counts[v.verse] = refs.length;
          }
        })
      );
      setCrossRefsCounts(counts);

      // Default select first verse if none selected
      if (pVerses.length > 0) {
        setSelectedVerse(pVerses[0]);
      }
    } catch (e) {
      console.error('Error loading chapter:', e);
    }
  }, [primaryTrans, secondaryTrans, isParallel, studyTrans, i18n.language]);

  useEffect(() => {
    loadChapter(currentBookId, currentChapter);
  }, [currentBookId, currentChapter, primaryTrans, secondaryTrans, isParallel, loadChapter]);

  // 3. Load Cross References for Selected Verse using chosen study translation
  useEffect(() => {
    if (!selectedVerse) {
      setCrossReferences([]);
      return;
    }
    const fetchXrefs = async () => {
      try {
        const refs = await window.api.getCrossReferences(
          selectedVerse.book_id,
          selectedVerse.chapter,
          selectedVerse.verse,
          40,
          studyTrans,
          i18n.language
        );
        setCrossReferences(refs);
      } catch (e) {
        console.error('Failed to get cross references:', e);
      }
    };
    fetchXrefs();
  }, [selectedVerse?.book_id, selectedVerse?.chapter, selectedVerse?.verse, studyTrans, i18n.language]);

  // 4. Navigation Handlers
  const handleSelectChapter = (bookId: number, chapter: number) => {
    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
  };

  const currentBook = books.find((b) => b.id === currentBookId) || null;

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else if (currentBookId > 1) {
      const prevBook = books.find((b) => b.id === currentBookId - 1);
      if (prevBook) {
        setCurrentBookId(prevBook.id);
        setCurrentChapter(prevBook.chapters_count);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentBook && currentChapter < currentBook.chapters_count) {
      setCurrentChapter(currentChapter + 1);
    } else if (currentBookId < books.length) {
      setCurrentBookId(currentBookId + 1);
      setCurrentChapter(1);
    }
  };

  // 5. Study Actions (Highlight, Bookmark, Note)
  const handleSetHighlight = async (verse: Verse, color: string | null) => {
    const existing = highlights.find(h => h.verse === verse.verse);
    if (!color && existing) {
      await window.api.deleteHighlight(existing.id);
      setHighlights(highlights.filter(h => h.id !== existing.id));
    } else if (color) {
      const newHl: Highlight = {
        id: `hl_${verse.book_id}_${verse.chapter}_${verse.verse}`,
        book_id: verse.book_id,
        chapter: verse.chapter,
        verse: verse.verse,
        color,
        created_at: new Date().toISOString()
      };
      await window.api.saveHighlight(newHl);
      setHighlights([...highlights.filter(h => h.verse !== verse.verse), newHl]);
    }
  };

  const handleToggleBookmark = async (verse: Verse) => {
    const existing = bookmarks.find(b => b.book_id === verse.book_id && b.chapter === verse.chapter && b.verse === verse.verse);
    if (existing) {
      await window.api.deleteBookmark(existing.id);
      setBookmarks(bookmarks.filter(b => b.id !== existing.id));
    } else {
      const newBm: Bookmark = {
        id: `bm_${verse.book_id}_${verse.chapter}_${verse.verse}`,
        book_id: verse.book_id,
        chapter: verse.chapter,
        verse: verse.verse,
        created_at: new Date().toISOString()
      };
      await window.api.saveBookmark(newBm);
      const updated = await window.api.getBookmarks(studyTrans, i18n.language);
      setBookmarks(updated);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    await window.api.deleteBookmark(id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const handleSaveNote = async (note: Note, linkedVerses?: { book_id: number; chapter: number; verse: number }[]) => {
    await window.api.saveNote(note, linkedVerses);
    const updated = await window.api.getNotes(i18n.language);
    setNotes(updated);
  };

  const handleJumpToPassage = (bookId: number, chapter: number, verse?: number) => {
    setCurrentBookId(bookId);
    setCurrentChapter(chapter);
    if (verse) {
      // Find and select verse after load
      setTimeout(() => {
        setPrimaryVerses((curr) => {
          const match = curr.find(v => v.verse === verse);
          if (match) setSelectedVerse(match);
          return curr;
        });
      }, 100);
    }
  };

  // Keyboard Shortcuts: Ctrl+K (Search), Ctrl+G (Graph)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setIsGraphOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-workstation-bg text-workstation-text select-none">
      {/* Top Header Bar */}
      <TopBar
        translations={translations}
        primaryTrans={primaryTrans}
        secondaryTrans={secondaryTrans}
        isParallel={isParallel}
        onSelectPrimaryTrans={setPrimaryTrans}
        onSelectSecondaryTrans={setSecondaryTrans}
        onToggleParallel={() => setIsParallel(!isParallel)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleGraph={() => setIsGraphOpen(!isGraphOpen)}
        isGraphOpen={isGraphOpen}
        onOpenPlans={() => setIsPlansOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeSidebarTab={activeSidebarTab}
        onSelectSidebarTab={setActiveSidebarTab}
      />

      {/* Main Workstation Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigator Sidebar */}
        <Sidebar
          books={books}
          currentBookId={currentBookId}
          currentChapter={currentChapter}
          onSelectChapter={handleSelectChapter}
          bookmarks={bookmarks}
          onDeleteBookmark={handleDeleteBookmark}
          notes={notes}
          activeTab={activeSidebarTab}
          onSelectNote={(note) => {
            if (note.linked_verses && note.linked_verses.length > 0) {
              const lv = note.linked_verses[0];
              handleJumpToPassage(lv.book_id, lv.chapter, lv.verse);
              setIsInspectorOpen(true);
            }
          }}
        />

        {/* Center Parallel Scripture Reader */}
        <ReaderContainer
          currentBook={currentBook}
          currentChapter={currentChapter}
          primaryTrans={primaryTrans}
          secondaryTrans={secondaryTrans}
          isParallel={isParallel}
          primaryVerses={primaryVerses}
          secondaryVerses={secondaryVerses}
          selectedVerse={selectedVerse}
          onSelectVerse={(v) => {
            setSelectedVerse(v);
            setIsInspectorOpen(true);
          }}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          highlights={highlights}
          onSetHighlight={handleSetHighlight}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          fontSize={fontSize}
          setFontSize={setFontSize}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          lineSpacing={lineSpacing}
          crossRefsCounts={crossRefsCounts}
        />

        {/* Right Study Inspector */}
        {isInspectorOpen && (
          <InspectorContainer
            selectedVerse={selectedVerse}
            currentBook={currentBook}
            crossReferences={crossReferences}
            notes={notes}
            studyTrans={studyTrans}
            onSelectStudyTrans={setStudyTrans}
            translations={translations}
            fontFamily={fontFamily}
            onSaveNote={handleSaveNote}
            onJumpToPassage={handleJumpToPassage}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>

      {/* Modals & Overlays */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        translations={translations}
        activeTranslation={primaryTrans}
        onSelectResult={handleJumpToPassage}
      />

      <KnowledgeGraph
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        selectedVerse={selectedVerse}
        currentBook={currentBook}
        studyTrans={studyTrans}
        onJumpToPassage={handleJumpToPassage}
      />

      <ReadingPlanModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        onLoadReading={handleJumpToPassage}
      />

      <ImportTranslationModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        translations={translations}
        onTranslationsUpdated={async () => {
          const tr = await window.api.getTranslations();
          setTranslations(tr);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        translations={translations}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineSpacing={lineSpacing}
        setLineSpacing={setLineSpacing}
        studyTrans={studyTrans}
        setStudyTrans={setStudyTrans}
        primaryTrans={primaryTrans}
        setPrimaryTrans={setPrimaryTrans}
        secondaryTrans={secondaryTrans}
        setSecondaryTrans={setSecondaryTrans}
        onOpenImport={() => setIsImportOpen(true)}
      />
    </div>
  );
};
export default App;
