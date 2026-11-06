import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, Type, BookOpen, Globe, Sliders, RotateCcw, 
  Check, FolderPlus, Layers, Eye, Sparkles, BookMarked
} from 'lucide-react';
import type { Translation } from '../../types/bible';

export type FontFamilyType = 'serif' | 'sans' | 'mono';
export type LineSpacingType = 'compact' | 'normal' | 'relaxed';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translation[];
  fontFamily: FontFamilyType;
  setFontFamily: (family: FontFamilyType) => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  lineSpacing: LineSpacingType;
  setLineSpacing: (spacing: LineSpacingType) => void;
  studyTrans: string;
  setStudyTrans: (transId: string) => void;
  primaryTrans: string;
  setPrimaryTrans: (transId: string) => void;
  secondaryTrans: string;
  setSecondaryTrans: (transId: string) => void;
  onOpenImport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  translations,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineSpacing,
  setLineSpacing,
  studyTrans,
  setStudyTrans,
  primaryTrans,
  setPrimaryTrans,
  secondaryTrans,
  setSecondaryTrans,
  onOpenImport
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'typography' | 'bible' | 'general'>('typography');

  if (!isOpen) return null;

  const handleLanguageChange = (lang: 'en' | 'nl') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('berean_lang', lang);
  };

  const handleResetDefaults = () => {
    setFontSize(18);
    setFontFamily('serif');
    setLineSpacing('relaxed');
    const defaultStudy = i18n.language === 'nl' ? 'SVV' : 'KJV';
    setStudyTrans(defaultStudy);
  };

  const getLineHeightMultiplier = (spacing: LineSpacingType) => {
    switch (spacing) {
      case 'compact': return 1.4;
      case 'normal': return 1.6;
      case 'relaxed': return 1.85;
      default: return 1.65;
    }
  };

  const sampleVerses: Record<string, string> = {
    ORIG: 'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃ (Gen 1:1) // ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος. (Jn 1:1)',
    CANIS: 'In het begin was het Woord, en het Woord was bij God, en het Woord was God. Dit was in het begin bij God. Alles is door Hem geworden, en zonder Hem is niets geworden van wat geworden is.',
    BSB: 'In the beginning was the Word, and the Word was with God, and the Word was God. He was with God in the beginning. Through Him all things were made, and without Him nothing was made that has been made.',
    SVV: 'In den beginne was het Woord, en het Woord was bij God, en het Woord was God. Dit was in den beginne bij God. Alle dingen zijn door Hetzelve gemaakt, en zonder Hetzelve is geen ding gemaakt dat gemaakt is.',
    KJV: 'In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made.',
    VULG: 'In principio erat Verbum, et Verbum erat apud Deum, et Deus erat Verbum. Hoc erat in principio apud Deum. Omnia per ipsum facta sunt: et sine ipso factum est nihil, quod factum est.',
    WLC: 'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃ וְהָאָ֗רֶץ הָיְתָ֥ה תֹ֙הוּ֙ וָבֹ֔הוּ וְחֹ֖שֶׁךְ עַל־פְּנֵ֣י תְה֑וֹם וְר֣וּחַ אֱלֹהִ֔ים מְרַחֶ֖פֶת עַל־פְּנֵ֥י הַמָּֽיִם׃',
    TR: 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος. οὗτος ἦν ἐν ἀρχῇ πρὸς τὸν θεόν.',
    GRE: 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.',
    PESH: 'ܒ݁ܪܺܫܺܝܬ݂ ܐܺܝܬ݂ܰܘܗ݈ܝ ܗ݈ܘܳܐ ܡܶܠܬ݂ܳܐ ܘܗܽܘ ܡܶܠܬ݂ܳܐ ܐܺܝܬ݂ܰܘܗ݈ܝ ܗ݈ܘܳܐ ܠܘܳܬ݂ ܐܰܠܳܗܳܐ ܘܰܐܠܳܗܳܐ ܐܺܝܬ݂ܰܘܗ݈ܝ ܗ݈ܘܳܐ ܗܽܘ ܡܶܠܬ݂ܳܐ'
  };

  const previewVerse = sampleVerses[studyTrans] || sampleVerses[primaryTrans] || sampleVerses.BSB || sampleVerses.KJV;
  const currentStudyTranslation = translations.find(t => t.id === studyTrans);
  const isPreviewRTL = studyTrans === 'WLC' || studyTrans === 'PESH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-workstation-panel border border-workstation-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-workstation-border bg-workstation-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-workstation-accent/15 border border-workstation-accent/30 flex items-center justify-center text-workstation-accent">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {t('settings.title')}
              </h2>
              <p className="text-xs text-workstation-muted">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-workstation-muted hover:text-white rounded-lg hover:bg-workstation-hover transition-colors"
            title={t('settings.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-workstation-border bg-workstation-bg px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'typography'
                ? 'border-workstation-accent text-workstation-accent'
                : 'border-transparent text-workstation-muted hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{t('settings.tabs.appearance')}</span>
          </button>

          <button
            onClick={() => setActiveTab('bible')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'bible'
                ? 'border-workstation-accent text-workstation-accent'
                : 'border-transparent text-workstation-muted hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('settings.tabs.translations')}</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-workstation-accent text-workstation-accent'
                : 'border-transparent text-workstation-muted hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t('settings.tabs.general')}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TYPOGRAPHY & APPEARANCE */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* Font Family Selection */}
              <div>
                <div className="mb-2.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    {t('settings.typography.font_family')}
                  </label>
                  <p className="text-[11px] text-workstation-muted">
                    {t('settings.typography.font_family_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Serif */}
                  <button
                    type="button"
                    onClick={() => setFontFamily('serif')}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      fontFamily === 'serif'
                        ? 'bg-workstation-active border-workstation-accent text-white shadow-md'
                        : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white hover:bg-workstation-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold">Serif</span>
                      {fontFamily === 'serif' && <Check className="w-3.5 h-3.5 text-workstation-accent" />}
                    </div>
                    <span className="text-xl scripture-serif text-white/90">Aa Bb Gg</span>
                    <span className="text-[10px] text-workstation-muted mt-1">Crimson Pro / Georgia</span>
                  </button>

                  {/* Sans */}
                  <button
                    type="button"
                    onClick={() => setFontFamily('sans')}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      fontFamily === 'sans'
                        ? 'bg-workstation-active border-workstation-accent text-white shadow-md'
                        : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white hover:bg-workstation-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold">Sans-Serif</span>
                      {fontFamily === 'sans' && <Check className="w-3.5 h-3.5 text-workstation-accent" />}
                    </div>
                    <span className="text-xl scripture-sans text-white/90">Aa Bb Gg</span>
                    <span className="text-[10px] text-workstation-muted mt-1">Inter / Modern Clean</span>
                  </button>

                  {/* Monospace */}
                  <button
                    type="button"
                    onClick={() => setFontFamily('mono')}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      fontFamily === 'mono'
                        ? 'bg-workstation-active border-workstation-accent text-white shadow-md'
                        : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white hover:bg-workstation-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold">Monospace</span>
                      {fontFamily === 'mono' && <Check className="w-3.5 h-3.5 text-workstation-accent" />}
                    </div>
                    <span className="text-xl scripture-mono text-white/90">Aa Bb Gg</span>
                    <span className="text-[10px] text-workstation-muted mt-1">JetBrains / Tabular</span>
                  </button>
                </div>
              </div>

              {/* Font Size & Stepper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                      {t('settings.typography.font_size')}
                    </label>
                    <p className="text-[11px] text-workstation-muted">
                      {t('settings.typography.font_size_desc')}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-workstation-accent bg-workstation-accent/10 border border-workstation-accent/30 px-2 py-0.5 rounded">
                    {fontSize}px
                  </span>
                </div>

                <div className="flex items-center gap-4 bg-workstation-bg p-3 rounded-lg border border-workstation-border">
                  <span className="text-xs text-workstation-muted font-mono">14px</span>
                  <input
                    type="range"
                    min="14"
                    max="28"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-workstation-border rounded-lg"
                  />
                  <span className="text-xs text-workstation-muted font-mono">28px</span>

                  <div className="flex items-center gap-1 border-l border-workstation-border pl-3">
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.max(14, s - 1))}
                      className="px-2 py-1 bg-workstation-panel hover:bg-workstation-hover text-white rounded text-xs font-mono"
                      title="Decrease"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.min(28, s + 1))}
                      className="px-2 py-1 bg-workstation-panel hover:bg-workstation-hover text-white rounded text-xs font-mono"
                      title="Increase"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* Line Spacing */}
              <div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    {t('settings.typography.line_height')}
                  </label>
                  <p className="text-[11px] text-workstation-muted">
                    {t('settings.typography.line_height_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'relaxed'] as LineSpacingType[]).map((spacing) => (
                    <button
                      key={spacing}
                      type="button"
                      onClick={() => setLineSpacing(spacing)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        lineSpacing === spacing
                          ? 'bg-workstation-active border-workstation-accent text-workstation-accent font-semibold shadow-sm'
                          : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white'
                      }`}
                    >
                      {t(`settings.typography.${spacing}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-workstation-accent" />
                  <span>{t('settings.typography.preview')}</span>
                  <span className="text-[10px] text-workstation-muted">({studyTrans})</span>
                </div>
                <div className="p-4 rounded-xl bg-workstation-bg border border-workstation-border shadow-inner">
                  <p
                    dir={isPreviewRTL ? 'rtl' : 'ltr'}
                    style={{
                      fontSize: `${studyTrans === 'WLC' ? fontSize + 2 : fontSize}px`,
                      lineHeight: `${(studyTrans === 'WLC' ? fontSize + 2 : fontSize) * getLineHeightMultiplier(lineSpacing)}px`
                    }}
                    className={`${
                      studyTrans === 'WLC'
                        ? 'scripture-hebrew text-right'
                        : studyTrans === 'PESH'
                        ? 'scripture-aramaic text-right'
                        : ['TR', 'GRE'].includes(studyTrans)
                        ? 'scripture-greek'
                        : fontFamily === 'serif'
                        ? 'scripture-serif'
                        : fontFamily === 'mono'
                        ? 'scripture-mono'
                        : 'scripture-sans'
                    } text-slate-100 transition-all`}
                  >
                    {previewVerse}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIBLE VERSIONS & CROSS-REFERENCES */}
          {activeTab === 'bible' && (
            <div className="space-y-6">
              {/* Highlighted Box: Cross-Reference & Study Version */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-workstation-accent/15 via-workstation-panel to-workstation-bg border-2 border-workstation-accent/40 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-workstation-accent text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <Sparkles className="w-5 h-5 font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-extrabold text-white uppercase tracking-wider block">
                      {t('settings.bible_versions.study_version')}
                    </label>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {t('settings.bible_versions.study_version_desc')}
                    </p>

                    <div className="mt-3">
                      <select
                        value={studyTrans}
                        onChange={(e) => setStudyTrans(e.target.value)}
                        className="w-full bg-workstation-bg border-2 border-workstation-accent/70 text-white font-medium text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-workstation-accent shadow-sm cursor-pointer"
                      >
                        {translations.map((tr) => (
                          <option key={tr.id} value={tr.id} className="bg-workstation-panel text-white py-1">
                            {tr.id} — {tr.name} ({tr.language.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentStudyTranslation && (
                      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-300 bg-workstation-bg/60 px-2.5 py-1.5 rounded-md border border-workstation-border/50">
                        <BookMarked className="w-3.5 h-3.5 text-workstation-accent flex-shrink-0" />
                        <span className="truncate">
                          Active: <strong>{currentStudyTranslation.name}</strong> ({currentStudyTranslation.language.toUpperCase()}) — {currentStudyTranslation.verse_count?.toLocaleString() || 'Complete'} verses
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary & Secondary Reading Translations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-workstation-bg p-3.5 rounded-lg border border-workstation-border">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    {t('settings.bible_versions.primary_version')}
                  </label>
                  <p className="text-[10px] text-workstation-muted mb-2">
                    Default left reading column
                  </p>
                  <select
                    value={primaryTrans}
                    onChange={(e) => setPrimaryTrans(e.target.value)}
                    className="w-full bg-workstation-panel border border-workstation-border text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-workstation-accent cursor-pointer"
                  >
                    {translations.map((tr) => (
                      <option key={tr.id} value={tr.id} className="bg-workstation-panel text-white">
                        {tr.id} - {tr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-workstation-bg p-3.5 rounded-lg border border-workstation-border">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    {t('settings.bible_versions.secondary_version')}
                  </label>
                  <p className="text-[10px] text-workstation-muted mb-2">
                    Default right parallel column
                  </p>
                  <select
                    value={secondaryTrans}
                    onChange={(e) => setSecondaryTrans(e.target.value)}
                    className="w-full bg-workstation-panel border border-workstation-border text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-workstation-accent cursor-pointer"
                  >
                    {translations.map((tr) => (
                      <option key={tr.id} value={tr.id} className="bg-workstation-panel text-white">
                        {tr.id} - {tr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Installed Translations Overview */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Installed Bible Databases
                    </h3>
                    <p className="text-[11px] text-workstation-muted">
                      {t('settings.bible_versions.installed_count', { count: translations.length })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenImport();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-workstation-accent/15 hover:bg-workstation-accent/25 text-workstation-accent border border-workstation-accent/40 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{t('settings.bible_versions.manage_translations')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {translations.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-lg bg-workstation-bg border border-workstation-border flex items-center justify-between text-xs"
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{tr.id}</span>
                          <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-workstation-panel text-workstation-muted border border-workstation-border">
                            {tr.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-workstation-muted truncate mt-0.5">
                          {tr.name}
                        </p>
                      </div>
                      {tr.id === studyTrans && (
                        <span className="text-[9px] uppercase font-bold text-workstation-accent bg-workstation-accent/15 px-1.5 py-0.5 rounded border border-workstation-accent/30 flex-shrink-0">
                          Study
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL & LANGUAGE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Application Language */}
              <div>
                <div className="mb-2.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    {t('settings.language.app_language')}
                  </label>
                  <p className="text-[11px] text-workstation-muted">
                    {t('settings.language.app_language_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                      i18n.language === 'en'
                        ? 'bg-workstation-active border-workstation-accent text-white shadow-md'
                        : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">English</span>
                      <span className="text-[10px] text-workstation-muted">English UI and book names</span>
                    </div>
                    {i18n.language === 'en' && <Check className="w-4 h-4 text-workstation-accent" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLanguageChange('nl')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                      i18n.language === 'nl'
                        ? 'bg-workstation-active border-workstation-accent text-white shadow-md'
                        : 'bg-workstation-bg border-workstation-border text-workstation-muted hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Nederlands</span>
                      <span className="text-[10px] text-workstation-muted">Nederlandse UI en bijbelboeken</span>
                    </div>
                    {i18n.language === 'nl' && <Check className="w-4 h-4 text-workstation-accent" />}
                  </button>
                </div>
              </div>

              {/* System Info & Offline Guarantee */}
              <div className="p-4 rounded-xl bg-workstation-bg border border-workstation-border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Berean Offline Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Berean runs 100% locally on your machine with embedded SQLite databases, full-text FTS5 search, and zero network dependency. No telemetry, tracking, or cloud access is utilized.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-workstation-border bg-workstation-bg/50">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-workstation-muted hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('settings.reset_defaults')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-workstation-accent hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
