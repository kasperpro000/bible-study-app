import { contextBridge, ipcRenderer } from 'electron';
import type { 
  Translation, Book, Verse, CrossReference, Highlight, 
  Bookmark, Note, ReadingPlan, ReadingPlanDay, SearchResult, GraphData 
} from '../src/types/bible';

const api = {
  getTranslations: (): Promise<Translation[]> => ipcRenderer.invoke('db:getTranslations'),
  getBooks: (): Promise<Book[]> => ipcRenderer.invoke('db:getBooks'),
  getChapterVerses: (translationId: string, bookId: number, chapter: number): Promise<Verse[]> => 
    ipcRenderer.invoke('db:getChapterVerses', translationId, bookId, chapter),
  getVerse: (translationId: string, bookId: number, chapter: number, verse: number): Promise<Verse | undefined> =>
    ipcRenderer.invoke('db:getVerse', translationId, bookId, chapter, verse),
  searchVerses: (query: string, translationId: string, limit?: number, offset?: number): Promise<SearchResult[]> =>
    ipcRenderer.invoke('db:searchVerses', query, translationId, limit, offset),
  getCrossReferences: (bookId: number, chapter: number, verse: number, limit?: number): Promise<CrossReference[]> =>
    ipcRenderer.invoke('db:getCrossReferences', bookId, chapter, verse, limit),
  
  getHighlights: (bookId: number, chapter: number): Promise<Highlight[]> =>
    ipcRenderer.invoke('db:getHighlights', bookId, chapter),
  getAllHighlights: (): Promise<Highlight[]> =>
    ipcRenderer.invoke('db:getAllHighlights'),
  saveHighlight: (hl: Highlight): Promise<void> =>
    ipcRenderer.invoke('db:saveHighlight', hl),
  deleteHighlight: (id: string): Promise<void> =>
    ipcRenderer.invoke('db:deleteHighlight', id),

  getBookmarks: (): Promise<Bookmark[]> =>
    ipcRenderer.invoke('db:getBookmarks'),
  saveBookmark: (bm: Bookmark): Promise<void> =>
    ipcRenderer.invoke('db:saveBookmark', bm),
  deleteBookmark: (id: string): Promise<void> =>
    ipcRenderer.invoke('db:deleteBookmark', id),

  getNotes: (): Promise<Note[]> =>
    ipcRenderer.invoke('db:getNotes'),
  saveNote: (note: Note, linkedVerses?: { book_id: number; chapter: number; verse: number }[]): Promise<void> =>
    ipcRenderer.invoke('db:saveNote', note, linkedVerses),
  deleteNote: (id: string): Promise<void> =>
    ipcRenderer.invoke('db:deleteNote', id),

  getReadingPlans: (): Promise<ReadingPlan[]> =>
    ipcRenderer.invoke('db:getReadingPlans'),
  getReadingPlanDays: (planId: string): Promise<ReadingPlanDay[]> =>
    ipcRenderer.invoke('db:getReadingPlanDays', planId),
  toggleReadingPlanDay: (planId: string, dayNumber: number): Promise<boolean> =>
    ipcRenderer.invoke('db:toggleReadingPlanDay', planId, dayNumber),

  getKnowledgeGraphData: (focus?: { bookId?: number; chapter?: number; verse?: number }): Promise<GraphData> =>
    ipcRenderer.invoke('db:getKnowledgeGraphData', focus),

  openBibleFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openBibleFile'),
  importTranslation: (
    metadata: { id: string; name: string; language: string; abbreviation?: string; description?: string },
    filePath: string
  ): Promise<{ success: boolean; versesCount: number; error?: string }> =>
    ipcRenderer.invoke('db:importTranslation', metadata, filePath),
  deleteTranslation: (id: string): Promise<void> =>
    ipcRenderer.invoke('db:deleteTranslation', id)
};

export type BibleApi = typeof api;

contextBridge.exposeInMainWorld('api', api);
