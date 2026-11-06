import React from 'react';
import { Bookmark, FileText, Highlighter, Plus, Sparkles } from 'lucide-react';
import type { Verse, Highlight } from '../../types/bible';

interface VerseItemProps {
  verse: Verse;
  isSelected: boolean;
  highlight?: Highlight;
  crossRefsCount?: number;
  isBookmarked: boolean;
  fontSize: number;
  fontFamily: 'serif' | 'sans' | 'mono';
  lineSpacing?: 'compact' | 'normal' | 'relaxed';
  onSelectVerse: (verse: Verse) => void;
  onSetHighlight: (verse: Verse, color: string | null) => void;
  onToggleBookmark: (verse: Verse) => void;
}

const HIGHLIGHT_PALETTE = [
  { name: 'yellow', bg: 'bg-amber-400/25', border: 'border-l-amber-400', badge: 'bg-amber-400' },
  { name: 'blue', bg: 'bg-sky-400/25', border: 'border-l-sky-400', badge: 'bg-sky-400' },
  { name: 'green', bg: 'bg-emerald-400/25', border: 'border-l-emerald-400', badge: 'bg-emerald-400' },
  { name: 'rose', bg: 'bg-rose-400/25', border: 'border-l-rose-400', badge: 'bg-rose-400' },
];

export const VerseItem: React.FC<VerseItemProps> = ({
  verse,
  isSelected,
  highlight,
  crossRefsCount = 0,
  isBookmarked,
  fontSize,
  fontFamily,
  lineSpacing = 'relaxed',
  onSelectVerse,
  onSetHighlight,
  onToggleBookmark,
}) => {
  const currentPalette = highlight ? HIGHLIGHT_PALETTE.find(p => p.name === highlight.color) : null;

  const isHebrew = (verse.translation_id === 'ORIG' || verse.translation_id === 'WLC') && verse.book_id <= 39;
  const isGreek = (verse.translation_id === 'ORIG' || verse.translation_id === 'TR') && verse.book_id >= 40 || verse.translation_id === 'GRE';
  const isAramaic = verse.translation_id === 'PESH';
  const isRTL = isHebrew || isAramaic;

  const fontClass = isHebrew
    ? 'scripture-hebrew'
    : isAramaic
    ? 'scripture-aramaic'
    : isGreek
    ? 'scripture-greek'
    : fontFamily === 'serif'
    ? 'scripture-serif'
    : fontFamily === 'mono'
    ? 'scripture-mono'
    : 'scripture-sans';

  const getLineHeightMultiplier = () => {
    switch (lineSpacing) {
      case 'compact': return 1.4;
      case 'normal': return 1.6;
      case 'relaxed': return 1.85;
      default: return 1.65;
    }
  };

  return (
    <div
      onClick={() => onSelectVerse(verse)}
      className={`group relative flex items-start gap-3 px-4 py-2 rounded-lg transition-all cursor-pointer border-l-2 select-text ${
        isSelected
          ? 'bg-workstation-active/80 border-l-workstation-accent shadow-sm'
          : currentPalette
          ? `${currentPalette.bg} ${currentPalette.border}`
          : 'border-l-transparent hover:bg-workstation-hover/50'
      }`}
    >
      {/* Verse Number */}
      <span className="w-7 text-right flex-shrink-0 text-xs font-mono font-medium text-workstation-muted/70 group-hover:text-workstation-accent pt-1 select-none">
        {verse.verse}
      </span>

      {/* Verse Text Body */}
      <div className="flex-1">
        <p
          dir={isRTL ? 'rtl' : 'ltr'}
          style={{ 
            fontSize: `${isHebrew ? fontSize + 2 : fontSize}px`, 
            lineHeight: `${(isHebrew ? fontSize + 2 : fontSize) * getLineHeightMultiplier()}px` 
          }}
          className={`${fontClass} ${isRTL ? 'text-right' : ''} ${isSelected ? 'text-white' : 'text-slate-200'} tracking-normal`}
        >
          {verse.text}
        </p>

        {/* Badges: Cross References and Bookmark status */}
        <div className="flex items-center gap-2 mt-1 select-none">
          {crossRefsCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-workstation-panel border border-workstation-border text-workstation-accent font-medium hover:bg-workstation-accent/15 transition-colors">
              {crossRefsCount} refs
            </span>
          )}
          {isBookmarked && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-workstation-gold/15 border border-workstation-gold/30 text-workstation-gold font-medium flex items-center gap-1">
              <Bookmark className="w-2.5 h-2.5 fill-workstation-gold" /> Bookmarked
            </span>
          )}
        </div>
      </div>

      {/* Hover Floating Action Bar */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-2 flex items-center gap-1 bg-workstation-bg border border-workstation-border p-1 rounded-lg shadow-lg select-none z-10"
      >
        {/* Highlight Colors */}
        {HIGHLIGHT_PALETTE.map((p) => (
          <button
            key={p.name}
            onClick={() => onSetHighlight(verse, highlight?.color === p.name ? null : p.name)}
            className={`w-4 h-4 rounded-full ${p.badge} hover:scale-125 transition-transform ${
              highlight?.color === p.name ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
            }`}
            title={`Highlight ${p.name}`}
          />
        ))}

        {highlight && (
          <button
            onClick={() => onSetHighlight(verse, null)}
            className="text-[10px] text-workstation-muted hover:text-red-400 px-1 font-mono"
            title="Clear highlight"
          >
            ✕
          </button>
        )}

        <div className="w-[1px] h-3 bg-workstation-border mx-0.5" />

        {/* Bookmark Action */}
        <button
          onClick={() => onToggleBookmark(verse)}
          className={`p-1 rounded hover:bg-workstation-hover transition-colors ${
            isBookmarked ? 'text-workstation-gold' : 'text-workstation-muted hover:text-white'
          }`}
          title="Toggle Bookmark"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-workstation-gold' : ''}`} />
        </button>

        {/* Note Action */}
        <button
          onClick={() => onSelectVerse(verse)}
          className="p-1 rounded text-workstation-muted hover:text-workstation-accent hover:bg-workstation-hover transition-colors"
          title="Open Notes in Inspector"
        >
          <FileText className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
