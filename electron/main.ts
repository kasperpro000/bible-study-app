import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { BibleDatabaseService } from './db/database';

let mainWindow: BrowserWindow | null = null;
let dbService: BibleDatabaseService | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f141c',
    title: 'Berean - Bible Study Workstation',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Load content

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  dbService = new BibleDatabaseService();

  ipcMain.handle('db:getTranslations', () => dbService!.getTranslations());
  ipcMain.handle('db:importTranslation', (_event, metadata, filePath) => 
    dbService!.importTranslation(metadata, filePath)
  );
  ipcMain.handle('db:deleteTranslation', (_event, id) => 
    dbService!.deleteTranslation(id)
  );
  ipcMain.handle('dialog:openBibleFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Bible Translation File',
      properties: ['openFile'],
      filters: [
        { name: 'Bible Files (*.csv, *.json, *.txt)', extensions: ['csv', 'json', 'txt'] },
        { name: 'CSV Files (*.csv)', extensions: ['csv'] },
        { name: 'JSON Files (*.json)', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
  ipcMain.handle('db:getBooks', () => dbService!.getBooks());
  ipcMain.handle('db:getChapterVerses', (_event, translationId, bookId, chapter) => 
    dbService!.getChapterVerses(translationId, bookId, chapter)
  );
  ipcMain.handle('db:getVerse', (_event, translationId, bookId, chapter, verse) => 
    dbService!.getVerse(translationId, bookId, chapter, verse)
  );
  ipcMain.handle('db:searchVerses', (_event, query, translationId, limit, offset, lang) => 
    dbService!.searchVerses(query, translationId, limit, offset, lang)
  );
  ipcMain.handle('db:getCrossReferences', (_event, bookId, chapter, verse, limit, translationId, lang) => 
    dbService!.getCrossReferences(bookId, chapter, verse, limit, translationId, lang)
  );

  ipcMain.handle('db:getHighlights', (_event, bookId, chapter) => 
    dbService!.getHighlights(bookId, chapter)
  );
  ipcMain.handle('db:getAllHighlights', () => 
    dbService!.getAllHighlights()
  );
  ipcMain.handle('db:saveHighlight', (_event, hl) => 
    dbService!.saveHighlight(hl)
  );
  ipcMain.handle('db:deleteHighlight', (_event, id) => 
    dbService!.deleteHighlight(id)
  );

  ipcMain.handle('db:getBookmarks', (_event, translationId, lang) => 
    dbService!.getBookmarks(translationId, lang)
  );
  ipcMain.handle('db:saveBookmark', (_event, bm) => 
    dbService!.saveBookmark(bm)
  );
  ipcMain.handle('db:deleteBookmark', (_event, id) => 
    dbService!.deleteBookmark(id)
  );

  ipcMain.handle('db:getNotes', (_event, lang) => 
    dbService!.getNotes(lang)
  );
  ipcMain.handle('db:saveNote', (_event, note, linkedVerses) => 
    dbService!.saveNote(note, linkedVerses)
  );
  ipcMain.handle('db:deleteNote', (_event, id) => 
    dbService!.deleteNote(id)
  );

  ipcMain.handle('db:getReadingPlans', () => 
    dbService!.getReadingPlans()
  );
  ipcMain.handle('db:getReadingPlanDays', (_event, planId, lang) => 
    dbService!.getReadingPlanDays(planId, lang)
  );
  ipcMain.handle('db:toggleReadingPlanDay', (_event, planId, dayNumber) => 
    dbService!.toggleReadingPlanDay(planId, dayNumber)
  );

  ipcMain.handle('db:getKnowledgeGraphData', (_event, focus) => 
    dbService!.getKnowledgeGraphData(focus)
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
