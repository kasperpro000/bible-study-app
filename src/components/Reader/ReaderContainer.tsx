import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Type, Minus, Plus } from 'lucide-react';
import { VerseItem } from './VerseItem';
import type { Book, Verse, Highlight, Bookmark } from '../../types/bible';

interface ReaderContainerProps {
  currentBook: Book | null;
  currentChapter: number;
  primaryTrans: string;
  secondaryTrans: string;
  isParallel: boolean;
  primaryVerses: Verse[];
  secondaryVerses: Verse[];
  selectedVerse: Verse | null;
  onSelectVerse: (verse: Verse) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  highlights: Highlight[];
  onSetHighlight: (verse: Verse, color: string | null) => void;
  bookmarks: Bookmark[];
  onToggleBookmark: (verse: Verse) => void;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  fontFamily: 'serif' | 'sans' | 'mono';
  setFontFamily: React.Dispatch<React.SetStateAction<'serif' | 'sans' | 'mono'>>;
  lineSpacing?: 'compact' | 'normal' | 'relaxed';
  crossRefsCounts: Record<number, number>;
}

export const ReaderContainer: React.FC<ReaderContainerProps> = ({
  currentBook,
  currentChapter,
  primaryTrans,
  secondaryTrans,
  isParallel,
  primaryVerses,
  secondaryVerses,
  selectedVerse,
  onSelectVerse,
  onPrevChapter,
  onNextChapter,
  highlights,
  onSetHighlight,
  bookmarks,
  onToggleBookmark,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineSpacing = 'relaxed',
  crossRefsCounts
}) => {
  const { t, i18n } = useTranslation();
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const bookName = currentBook
    ? (i18n.language === 'nl' ? currentBook.name_nl : currentBook.name_en)
    : '';

  // Synchronized scrolling for parallel view
  const handleScroll = (source: 'left' | 'right') => {
    if (!isParallel || !leftColRef.current || !rightColRef.current) return;
    const from = source === 'left' ? leftColRef.current : rightColRef.current;
    const to = source === 'left' ? rightColRef.current : leftColRef.current;
    to.scrollTop = from.scrollTop;
  };

  // Scroll to top when chapter changes
  useEffect(() => {
    if (leftColRef.current) leftColRef.current.scrollTop = 0;
    if (rightColRef.current) rightColRef.current.scrollTop = 0;
  }, [currentBook?.id, currentChapter]);

  const highlightMap = new Map<number, Highlight>();
  highlights.forEach(h => highlightMap.set(h.verse, h));

  const bookmarkMap = new Map<number, Bookmark>();
  bookmarks.forEach(b => {
    if (currentBook && b.book_id === currentBook.id && b.chapter === currentChapter) {
      bookmarkMap.set(b.verse, b);
    }
  });

  return (
    <main className="flex-1 flex flex-col h-full bg-workstation-bg overflow-hidden">
      {/* Chapter Reader Header */}
      <div className="h-12 bg-workstation-panel/70 border-b border-workstation-border flex items-center justify-between px-6 select-none flex-shrink-0 z-20">
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevChapter}
            className="p-1.5 rounded-lg bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white transition-colors"
            title={t('nav.prev_chapter')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-bold text-white tracking-wide">
              {bookName} {currentChapter}
            </h1>
            <span className="text-xs text-workstation-muted uppercase font-mono">
              {primaryTrans} {isParallel ? `// ${secondaryTrans}` : ''}
            </span>
          </div>

          <button
            onClick={onNextChapter}
            className="p-1.5 rounded-lg bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-muted hover:text-white transition-colors"
            title={t('nav.next_chapter')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Reader Typography Customizer */}
        <div className="flex items-center gap-3">
          {/* Font Family Switcher */}
          <div className="flex items-center bg-workstation-bg rounded-lg border border-workstation-border p-0.5 text-xs">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-1 rounded font-serif ${
                fontFamily === 'serif' ? 'bg-workstation-active text-workstation-accent font-semibold' : 'text-workstation-muted'
              }`}
              title="Serif font"
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-1 rounded font-sans ${
                fontFamily === 'sans' ? 'bg-workstation-active text-workstation-accent font-semibold' : 'text-workstation-muted'
              }`}
              title="Sans-serif font"
            >
              Sans
            </button>
            <button
              onClick={() => setFontFamily('mono')}
              className={`px-2 py-1 rounded font-mono ${
                fontFamily === 'mono' ? 'bg-workstation-active text-workstation-accent font-semibold' : 'text-workstation-muted'
              }`}
              title="Monospace font"
            >
              Mono
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-workstation-bg rounded-lg border border-workstation-border p-0.5">
            <button
              onClick={() => setFontSize(s => Math.max(14, s - 1))}
              className="p-1 rounded text-workstation-muted hover:text-white hover:bg-workstation-hover"
              title="Decrease font size"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-1.5 text-workstation-muted select-none">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(s => Math.min(28, s + 1))}
              className="p-1 rounded text-workstation-muted hover:text-white hover:bg-workstation-hover"
              title="Increase font size"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scripture Viewport Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Translation Column */}
        <div
          ref={leftColRef}
          onScroll={() => handleScroll('left')}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-1.5 border-r border-workstation-border/50"
        >
          {primaryVerses.map((verse) => (
            <VerseItem
              key={verse.id}
              verse={verse}
              isSelected={selectedVerse?.verse === verse.verse && selectedVerse?.translation_id === verse.translation_id}
              highlight={highlightMap.get(verse.verse)}
              crossRefsCount={crossRefsCounts[verse.verse] || 0}
              isBookmarked={bookmarkMap.has(verse.verse)}
              fontSize={fontSize}
              fontFamily={fontFamily}
              lineSpacing={lineSpacing}
              onSelectVerse={onSelectVerse}
              onSetHighlight={onSetHighlight}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>

        {/* Secondary Translation Column (Parallel View) */}
        {isParallel && (
          <div
            ref={rightColRef}
            onScroll={() => handleScroll('right')}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-1.5 bg-workstation-panel/30"
          >
            {secondaryVerses.map((verse) => (
              <VerseItem
                key={verse.id}
                verse={verse}
                isSelected={selectedVerse?.verse === verse.verse && selectedVerse?.translation_id === verse.translation_id}
                highlight={highlightMap.get(verse.verse)}
                crossRefsCount={crossRefsCounts[verse.verse] || 0}
                isBookmarked={bookmarkMap.has(verse.verse)}
                fontSize={fontSize}
                fontFamily={fontFamily}
                lineSpacing={lineSpacing}
                onSelectVerse={onSelectVerse}
                onSetHighlight={onSetHighlight}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
