import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FolderPlus, Upload, X, Trash2, CheckCircle2, AlertCircle, 
  FileText, Database, HelpCircle, Loader2, Sparkles, Plus 
} from 'lucide-react';
import type { Translation } from '../../types/bible';

interface ImportTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translation[];
  onTranslationsUpdated: () => void;
}

export const ImportTranslationModal: React.FC<ImportTranslationModalProps> = ({
  isOpen,
  onClose,
  translations,
  onTranslationsUpdated
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'manage' | 'import'>('import');

  // Form State
  const [filePath, setFilePath] = useState('');
  const [transId, setTransId] = useState('');
  const [transName, setTransName] = useState('');
  const [transLang, setTransLang] = useState('en');
  const [transDesc, setTransDesc] = useState('');

  // Status State
  const [isImporting, setIsImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleBrowseFile = async () => {
    try {
      const selected = await window.api.openBibleFileDialog();
      if (selected) {
        setFilePath(selected);
        setResultMsg(null);

        // Auto-guess ID from filename if blank
        if (!transId) {
          const baseName = selected.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || '';
          setTransId(baseName.slice(0, 8).toUpperCase());
          setTransName(baseName);
        }
      }
    } catch (err: any) {
      console.error('File dialog error:', err);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath) {
      setResultMsg({ type: 'error', message: 'Please select a translation file first.' });
      return;
    }
    if (!transId.trim()) {
      setResultMsg({ type: 'error', message: 'Please enter a Translation Code (e.g. WEB, ASV, NBG).' });
      return;
    }
    if (!transName.trim()) {
      setResultMsg({ type: 'error', message: 'Please enter a Translation Name.' });
      return;
    }

    setIsImporting(true);
    setResultMsg(null);

    try {
      const res = await window.api.importTranslation(
        {
          id: transId.trim().toUpperCase(),
          name: transName.trim(),
          language: transLang,
          description: transDesc.trim() || undefined
        },
        filePath
      );

      if (res.success) {
        setResultMsg({
          type: 'success',
          message: `Successfully imported ${res.versesCount.toLocaleString()} verses into ${transId.toUpperCase()}! It is now ready to read.`
        });
        onTranslationsUpdated();
        // Reset form
        setFilePath('');
        setTransId('');
        setTransName('');
        setTransDesc('');
      } else {
        setResultMsg({
          type: 'error',
          message: res.error || 'Failed to parse and import Bible file.'
        });
      }
    } catch (err: any) {
      setResultMsg({ type: 'error', message: err.message || 'An unexpected error occurred during import.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to remove the "${id}" translation?`)) {
      try {
        await window.api.deleteTranslation(id);
        onTranslationsUpdated();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-workstation-panel border border-workstation-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-workstation-border px-6 flex items-center justify-between bg-workstation-bg flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-workstation-accent/10 border border-workstation-accent/30 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-workstation-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Manage & Import Translations
              </h2>
              <p className="text-[11px] text-workstation-muted">
                Add public domain or custom translations (CSV, JSON, TXT)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-workstation-muted hover:text-white p-1 rounded hover:bg-workstation-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-workstation-border bg-workstation-bg px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => { setActiveTab('import'); setResultMsg(null); }}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-workstation-accent text-workstation-accent'
                : 'border-transparent text-workstation-muted hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import New Translation</span>
          </button>
          <button
            onClick={() => { setActiveTab('manage'); setResultMsg(null); }}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-workstation-accent text-workstation-accent'
                : 'border-transparent text-workstation-muted hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Installed Translations ({translations.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-workstation-panel/40">
          {/* TAB 1: IMPORT NEW TRANSLATION */}
          {activeTab === 'import' && (
            <form onSubmit={handleImport} className="space-y-4">
              {resultMsg && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                    resultMsg.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  {resultMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{resultMsg.message}</span>
                </div>
              )}

              {/* File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Select Bible File (.csv, .json, .txt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={filePath}
                    placeholder="No file chosen yet..."
                    className="flex-1 bg-workstation-bg border border-workstation-border rounded-lg px-3 py-2 text-xs text-white placeholder-workstation-muted focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseFile}
                    className="px-3.5 py-2 bg-workstation-bg hover:bg-workstation-hover border border-workstation-border text-workstation-accent hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse...</span>
                  </button>
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Translation Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={transId}
                    onChange={(e) => setTransId(e.target.value.toUpperCase())}
                    placeholder="e.g. WEB, ASV"
                    className="w-full bg-workstation-bg border border-workstation-border rounded-lg px-3 py-2 text-xs text-white uppercase placeholder-workstation-muted focus:outline-none focus:border-workstation-accent font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Full Translation Name
                  </label>
                  <input
                    type="text"
                    required
                    value={transName}
                    onChange={(e) => setTransName(e.target.value)}
                    placeholder="e.g. World English Bible"
                    className="w-full bg-workstation-bg border border-workstation-border rounded-lg px-3 py-2 text-xs text-white placeholder-workstation-muted focus:outline-none focus:border-workstation-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Language
                  </label>
                  <select
                    value={transLang}
                    onChange={(e) => setTransLang(e.target.value)}
                    className="w-full bg-workstation-bg border border-workstation-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-workstation-accent"
                  >
                    <option value="en">English (en)</option>
                    <option value="nl">Nederlands / Dutch (nl)</option>
                    <option value="de">German / Deutsch (de)</option>
                    <option value="fr">French / Français (fr)</option>
                    <option value="la">Latin (la)</option>
                    <option value="other">Other Language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={transDesc}
                    onChange={(e) => setTransDesc(e.target.value)}
                    placeholder="e.g. 1901 Public domain revision"
                    className="w-full bg-workstation-bg border border-workstation-border rounded-lg px-3 py-2 text-xs text-white placeholder-workstation-muted focus:outline-none focus:border-workstation-accent"
                  />
                </div>
              </div>

              {/* Supported Format Guide Accordion */}
              <div className="p-3.5 bg-workstation-bg/80 border border-workstation-border rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-workstation-accent">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Supported File Formats:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-workstation-muted">
                  <div className="p-2 rounded bg-workstation-panel border border-workstation-border/50">
                    <span className="font-semibold text-white block mb-0.5">CSV Layout:</span>
                    <code className="text-amber-300 block font-mono">Book,Chapter,Verse,Text</code>
                    <span className="text-[10px] text-slate-400">Genesis,1,1,"In the beginning..."</span>
                  </div>
                  <div className="p-2 rounded bg-workstation-panel border border-workstation-border/50">
                    <span className="font-semibold text-white block mb-0.5">JSON Array Layout:</span>
                    <code className="text-amber-300 block font-mono">[&#123;"book":"Gen","chapter":1,"verse":1,"text":"..."&#125;]</code>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isImporting || !filePath}
                  className="px-5 py-2.5 bg-workstation-accent hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing & Indexing Verses...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Start Import</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INSTALLED TRANSLATIONS */}
          {activeTab === 'manage' && (
            <div className="space-y-2.5">
              {translations.map((tr) => {
                const isCore = tr.id === 'KJV' || tr.id === 'SVV';
                return (
                  <div
                    key={tr.id}
                    className="p-3.5 rounded-lg bg-workstation-bg border border-workstation-border flex items-center justify-between group hover:border-workstation-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-workstation-panel border border-workstation-border flex items-center justify-center font-mono font-bold text-xs text-workstation-accent">
                        {tr.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{tr.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-workstation-panel border border-workstation-border text-workstation-muted uppercase font-mono">
                            {tr.language}
                          </span>
                          {isCore && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-workstation-accent/10 border border-workstation-accent/30 text-workstation-accent font-semibold">
                              Built-in
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-workstation-muted mt-0.5">
                          {tr.description || 'Public Domain Bible'}
                          {tr.verse_count && ` • ${tr.verse_count.toLocaleString()} verses`}
                        </p>
                      </div>
                    </div>

                    {!isCore && (
                      <button
                        onClick={() => handleDelete(tr.id)}
                        className="text-workstation-muted hover:text-rose-400 p-2 rounded-lg hover:bg-workstation-hover transition-colors"
                        title="Delete Translation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
