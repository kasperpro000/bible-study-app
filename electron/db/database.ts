import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import type { 
  Translation, Book, Verse, CrossReference, Highlight, 
  Bookmark, Note, ReadingPlan, ReadingPlanDay, SearchResult, GraphData, GraphNode, GraphEdge 
} from '../../src/types/bible';

export class BibleDatabaseService {
  private bibleDb: DatabaseType;
  private userDb: DatabaseType;

  constructor() {
    // 1. Locate bibles.db
    let biblesDbPath = path.resolve(process.cwd(), 'resources', 'bibles.db');
    if (!fs.existsSync(biblesDbPath)) {
      // Production path
      if (app && app.isPackaged) {
        biblesDbPath = path.join(process.resourcesPath, 'resources', 'bibles.db');
      }
    }

    if (!fs.existsSync(biblesDbPath)) {
      console.warn(`Warning: bibles.db not found at ${biblesDbPath}`);
    }

    this.bibleDb = new Database(biblesDbPath, { readonly: false });
    this.bibleDb.pragma('journal_mode = WAL');

    // 2. Locate / create userdata.db
    let userDataDir = process.cwd();
    if (app && app.getPath) {
      try {
        userDataDir = app.getPath('userData');
      } catch (e) {
        userDataDir = process.cwd();
      }
    }
    const userDbPath = path.join(userDataDir, 'userdata.db');
    this.userDb = new Database(userDbPath);
    this.userDb.pragma('journal_mode = WAL');
    this.initUserDb();
  }

  private initUserDb() {
    this.userDb.exec(`
      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        color TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_hl_loc ON highlights(book_id, chapter, verse);

      CREATE TABLE IF NOT EXISTS bookmark_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        folder_id TEXT,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        label TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content_markdown TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS note_verse_links (
        note_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        PRIMARY KEY(note_id, book_id, chapter, verse),
        FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reading_plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        duration_days INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reading_plan_days (
        plan_id TEXT NOT NULL,
        day_number INTEGER NOT NULL,
        readings_json TEXT NOT NULL,
        PRIMARY KEY(plan_id, day_number)
      );

      CREATE TABLE IF NOT EXISTS reading_plan_progress (
        plan_id TEXT NOT NULL,
        day_number INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(plan_id, day_number)
      );
    `);

    // Seed default reading plans if empty
    const count = this.userDb.prepare('SELECT count(*) as c FROM reading_plans').get() as { c: number };
    if (count.c === 0) {
      this.seedDefaultReadingPlans();
    }
  }

  private seedDefaultReadingPlans() {
    const insertPlan = this.userDb.prepare('INSERT INTO reading_plans (id, title, description, duration_days) VALUES (?, ?, ?, ?)');
    const insertDay = this.userDb.prepare('INSERT INTO reading_plan_days (plan_id, day_number, readings_json) VALUES (?, ?, ?)');

    // 1. Gospels in 30 Days
    insertPlan.run('gospels_30', 'The Four Gospels in 30 Days', 'Read Matthew, Mark, Luke, and John across one month.', 30);
    // Gospels chapters roughly 89 total (~3 chapters/day)
    let currentBook = 40; // Matthew
    let currentChapter = 1;
    const maxChapters: Record<number, number> = { 40: 28, 41: 16, 42: 24, 43: 21 };

    for (let day = 1; day <= 30; day++) {
      const readings = [];
      for (let ch = 0; ch < 3; ch++) {
        readings.push({ book_id: currentBook, chapter: currentChapter });
        currentChapter++;
        if (currentChapter > maxChapters[currentBook]) {
          if (currentBook < 43) {
            currentBook++;
            currentChapter = 1;
          } else {
            break;
          }
        }
      }
      insertDay.run('gospels_30', day, JSON.stringify(readings));
    }

    // 2. Wisdom Literature (Psalms & Proverbs in 60 Days)
    insertPlan.run('wisdom_60', 'Psalms & Proverbs in 60 Days', 'Daily journey through the songs of David and Solomon’s wisdom.', 60);
    for (let day = 1; day <= 60; day++) {
      const psChapter1 = ((day - 1) * 2 % 150) + 1;
      const psChapter2 = (day * 2 % 150) + 1;
      const provChapter = ((day - 1) % 31) + 1;
      const readings = [
        { book_id: 19, chapter: psChapter1 },
        { book_id: 19, chapter: psChapter2 },
        { book_id: 20, chapter: provChapter }
      ];
      insertDay.run('wisdom_60', day, JSON.stringify(readings));
    }
  }

  // --- Bible Retrieval & Translation Management APIs ---

  getTranslations(): Translation[] {
    return this.bibleDb.prepare(`
      SELECT t.*, (SELECT count(*) FROM verses v WHERE v.translation_id = t.id) as verse_count
      FROM translations t 
      ORDER BY t.id
    `).all() as Translation[];
  }

  resolveBookId(bookRaw: any): number | null {
    if (!bookRaw) return null;
    const str = String(bookRaw).toLowerCase().replace(/[^\w\sÀ-ÿ]/g, '').trim();
    if (!str) return null;

    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 66) {
      return num;
    }

    const BOOK_ALIASES: Record<string, number> = {
      'gen': 1, 'genesis': 1, 'ge': 1, 'gn': 1,
      'exo': 2, 'exod': 2, 'exodus': 2, 'ex': 2,
      'lev': 3, 'leviticus': 3, 'le': 3, 'lv': 3,
      'num': 4, 'numbers': 4, 'numeri': 4, 'nu': 4, 'nm': 4,
      'deu': 5, 'deut': 5, 'deuteronomy': 5, 'deuteronomium': 5, 'dt': 5,
      'jos': 6, 'josh': 6, 'joshua': 6, 'jozua': 6, 'joz': 6,
      'jdg': 7, 'judg': 7, 'judges': 7, 'rechters': 7, 'recht': 7, 'jg': 7,
      'rut': 8, 'ruth': 8, 'ru': 8,
      '1sa': 9, '1sam': 9, '1samuel': 9, '1 samuel': 9, 'i samuel': 9, '1 sam': 9, '1 samuël': 9,
      '2sa': 10, '2sam': 10, '2samuel': 10, '2 samuel': 10, 'ii samuel': 10, '2 sam': 10, '2 samuël': 10,
      '1ki': 11, '1kgs': 11, '1kings': 11, '1 kings': 11, 'i kings': 11, '1 koningen': 11, '1kon': 11, '1 kgs': 11,
      '2ki': 12, '2kgs': 12, '2kings': 12, '2 kings': 12, 'ii kings': 12, '2 koningen': 12, '2kon': 12, '2 kgs': 12,
      '1ch': 13, '1chr': 13, '1chronicles': 13, '1 chronicles': 13, 'i chronicles': 13, '1 kronieken': 13, '1kron': 13,
      '2ch': 14, '2chr': 14, '2chronicles': 14, '2 chronicles': 14, 'ii chronicles': 14, '2 kronieken': 14, '2kron': 14,
      'ezr': 15, 'ezra': 15,
      'neh': 16, 'nehemiah': 16, 'nehemia': 16,
      'est': 17, 'esth': 17, 'esther': 17, 'ester': 17,
      'job': 18, 'jb': 18,
      'ps': 19, 'psa': 19, 'psalm': 19, 'psalms': 19, 'psalmen': 19,
      'pro': 20, 'prov': 20, 'proverbs': 20, 'spreuken': 20, 'spr': 20, 'prv': 20,
      'ecc': 21, 'eccl': 21, 'ecclesiastes': 21, 'prediker': 21, 'pred': 21, 'qoh': 21,
      'sng': 22, 'song': 22, 'song of solomon': 22, 'hooglied': 22, 'hoogl': 22, 'canticles': 22, 'sos': 22,
      'isa': 23, 'isaiah': 23, 'jesaja': 23, 'jes': 23,
      'jer': 24, 'jeremiah': 24, 'jeremia': 24,
      'lam': 25, 'lamentations': 25, 'klaagliederen': 25, 'klaagl': 25,
      'ezk': 26, 'ezek': 26, 'ezekiel': 26, 'ezechiël': 26, 'ezech': 26,
      'dan': 27, 'daniel': 27, 'daniël': 27,
      'hos': 28, 'hosea': 28,
      'jol': 29, 'joel': 29, 'joël': 29,
      'amo': 30, 'amos': 30,
      'oba': 31, 'obad': 31, 'obadiah': 31, 'obadja': 31,
      'jon': 32, 'jonah': 32, 'jona': 32,
      'mic': 33, 'micah': 33, 'micha': 33, 'mich': 33,
      'nah': 34, 'nahum': 34,
      'hab': 35, 'habakkuk': 35, 'habakuk': 35,
      'zep': 36, 'zeph': 36, 'zephaniah': 36, 'sefanja': 36, 'sef': 36,
      'hag': 37, 'haggai': 37,
      'zec': 38, 'zech': 38, 'zechariah': 38, 'zacharia': 38, 'zach': 38,
      'mal': 39, 'malachi': 39, 'maleachi': 39,
      'mat': 40, 'matt': 40, 'matthew': 40, 'matteüs': 40, 'mattheus': 40, 'mt': 40,
      'mrk': 41, 'mark': 41, 'marcus': 41, 'marc': 41, 'mk': 41,
      'luk': 42, 'luke': 42, 'lucas': 42, 'luc': 42, 'lk': 42,
      'jhn': 43, 'john': 43, 'johannes': 43, 'joh': 43, 'jn': 43,
      'act': 44, 'acts': 44, 'handelingen': 44, 'hand': 44, 'ac': 44,
      'rom': 45, 'romans': 45, 'romeinen': 45, 'ro': 45,
      '1co': 46, '1cor': 46, '1corinthians': 46, '1 corinthians': 46, 'i corinthians': 46, '1 korintiërs': 46, '1kor': 46, '1 kor': 46,
      '2co': 47, '2cor': 47, '2corinthians': 47, '2 corinthians': 47, 'ii corinthians': 47, '2 korintiërs': 47, '2kor': 47, '2 kor': 47,
      'gal': 48, 'galatians': 48, 'galaten': 48, 'ga': 48,
      'eph': 49, 'ephesians': 49, 'efeziërs': 49, 'efez': 49,
      'php': 50, 'phil': 50, 'philippians': 50, 'filippenzen': 50, 'filip': 50,
      'col': 51, 'colossians': 51, 'kolossenzen': 51, 'kol': 51,
      '1th': 52, '1thess': 52, '1thessalonians': 52, '1 thessalonians': 52, 'i thessalonians': 52, '1 tessalonicenzen': 52, '1tess': 52,
      '2th': 53, '2thess': 53, '2thessalonians': 53, '2 thessalonians': 53, 'ii thessalonians': 53, '2 tessalonicenzen': 53, '2tess': 53,
      '1ti': 54, '1tim': 54, '1timothy': 54, '1 timothy': 54, 'i timothy': 54, '1 timoteüs': 54,
      '2ti': 55, '2tim': 55, '2timothy': 55, '2 timothy': 55, 'ii timothy': 55, '2 timoteüs': 55,
      'tit': 56, 'titus': 56,
      'phm': 57, 'phlm': 57, 'philemon': 57, 'filemon': 57, 'filem': 57,
      'heb': 58, 'hebrews': 58, 'hebreeën': 58, 'hebr': 58,
      'jas': 59, 'james': 59, 'jakobus': 59, 'jak': 59, 'jm': 59,
      '1pe': 60, '1pet': 60, '1peter': 60, '1 peter': 60, 'i peter': 60, '1 petrus': 60,
      '2pe': 61, '2pet': 61, '2peter': 61, '2 peter': 61, 'ii petrus': 61, '2 petrus': 61,
      '1jn': 62, '1john': 62, '1 john': 62, 'i john': 62, '1 johannes': 62, '1joh': 62,
      '2jn': 63, '2john': 63, '2 john': 63, 'ii john': 63, '2 johannes': 63, '2joh': 63,
      '3jn': 64, '3john': 64, '3 john': 64, 'iii john': 64, '3 johannes': 64, '3joh': 64,
      'jud': 65, 'jude': 65, 'judas': 65,
      'rev': 66, 'revelation': 66, 'openbaring': 66, 'openb': 66, 'apocalypse': 66
    };

    return BOOK_ALIASES[str] || null;
  }

  parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  importTranslation(
    metadata: { id: string; name: string; language: string; abbreviation?: string; description?: string },
    filePath: string
  ): { success: boolean; versesCount: number; error?: string } {
    if (!fs.existsSync(filePath)) {
      return { success: false, versesCount: 0, error: `File not found: ${filePath}` };
    }

    const ext = path.extname(filePath).toLowerCase();
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const parsedVerses: { bookId: number; chapter: number; verse: number; text: string }[] = [];

    const books = this.getBooks();
    const bookMap = new Map<number, Book>();
    books.forEach(b => bookMap.set(b.id, b));

    if (ext === '.json') {
      try {
        const jsonData = JSON.parse(rawContent);
        let list: any[] = [];
        if (Array.isArray(jsonData)) {
          list = jsonData;
        } else if (jsonData.verses && Array.isArray(jsonData.verses)) {
          list = jsonData.verses;
        } else if (jsonData.resultset && Array.isArray(jsonData.resultset.row)) {
          list = jsonData.resultset.row;
        }

        for (const item of list) {
          const bookVal = item.book || item.book_name || item.book_id || item.field?.[0] || item[0];
          const chVal = item.chapter || item.chapter_nr || item.field?.[1] || item[1];
          const vVal = item.verse || item.verse_nr || item.field?.[2] || item[2];
          const textVal = item.text || item.verse_text || item.field?.[3] || item[3];

          const bookId = this.resolveBookId(bookVal);
          const ch = parseInt(chVal, 10);
          const v = parseInt(vVal, 10);
          if (bookId && !isNaN(ch) && !isNaN(v) && textVal) {
            parsedVerses.push({ bookId, chapter: ch, verse: v, text: String(textVal).trim() });
          }
        }
      } catch (err: any) {
        return { success: false, versesCount: 0, error: `JSON Parse error: ${err.message}` };
      }
    } else {
      // CSV or plain text line-by-line
      const lines = rawContent.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        // Skip CSV header if present
        if (i === 0 && line.toLowerCase().includes('book') && line.toLowerCase().includes('verse')) continue;

        // Try CSV parse first
        const parts = this.parseCsvLine(line);
        if (parts.length >= 4) {
          const bookId = this.resolveBookId(parts[0]);
          const ch = parseInt(parts[1], 10);
          const v = parseInt(parts[2], 10);
          const text = parts.slice(3).join(',').trim();
          if (bookId && !isNaN(ch) && !isNaN(v) && text) {
            parsedVerses.push({ bookId, chapter: ch, verse: v, text });
            continue;
          }
        }

        // Try standard reference regex: e.g. "Genesis 1:1 In the beginning..." or "Gen 1:1 In the beginning..."
        const refMatch = line.match(/^((?:\d\s+)?[A-Za-zÀ-ÿ]+)\s+(\d+)[:.](\d+)\s+(.+)$/);
        if (refMatch) {
          const bookId = this.resolveBookId(refMatch[1]);
          const ch = parseInt(refMatch[2], 10);
          const v = parseInt(refMatch[3], 10);
          const text = refMatch[4].trim();
          if (bookId && !isNaN(ch) && !isNaN(v) && text) {
            parsedVerses.push({ bookId, chapter: ch, verse: v, text });
          }
        }
      }
    }

    if (parsedVerses.length === 0) {
      return { success: false, versesCount: 0, error: 'No valid verses could be recognized in the file. Ensure the file contains Book, Chapter, Verse, and Text.' };
    }

    // Insert into database inside transaction
    const transId = metadata.id.toUpperCase().trim();
    const transName = metadata.name.trim();
    const transLang = (metadata.language || 'en').toLowerCase().trim();
    const transAbbr = (metadata.abbreviation || transId).toUpperCase().trim();
    const transDesc = metadata.description || 'Custom Imported Translation';

    const insertTrans = this.bibleDb.prepare(`
      INSERT OR REPLACE INTO translations (id, name, language, abbreviation, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertVerse = this.bibleDb.prepare(`
      INSERT OR REPLACE INTO verses (translation_id, book_id, chapter, verse, text)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertFts = this.bibleDb.prepare(`
      INSERT INTO fts_verses (verse_id, translation_id, book_name_en, book_name_nl, chapter, verse, text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const cleanVerses = this.bibleDb.prepare('DELETE FROM verses WHERE translation_id = ?');
    const cleanFts = this.bibleDb.prepare('DELETE FROM fts_verses WHERE translation_id = ?');

    const tx = this.bibleDb.transaction(() => {
      insertTrans.run(transId, transName, transLang, transAbbr, transDesc);
      cleanVerses.run(transId);
      cleanFts.run(transId);

      for (const pv of parsedVerses) {
        const book = bookMap.get(pv.bookId);
        const bookEn = book ? book.name_en : `Book ${pv.bookId}`;
        const bookNl = book ? book.name_nl : `Boek ${pv.bookId}`;

        const info = insertVerse.run(transId, pv.bookId, pv.chapter, pv.verse, pv.text);
        insertFts.run(info.lastInsertRowid, transId, bookEn, bookNl, pv.chapter, pv.verse, pv.text);
      }
    });

    tx();
    return { success: true, versesCount: parsedVerses.length };
  }

  deleteTranslation(id: string) {
    if (id === 'KJV' || id === 'SVV') {
      throw new Error('Core translations (KJV and SVV) cannot be deleted.');
    }
    const tx = this.bibleDb.transaction(() => {
      this.bibleDb.prepare('DELETE FROM fts_verses WHERE translation_id = ?').run(id);
      this.bibleDb.prepare('DELETE FROM verses WHERE translation_id = ?').run(id);
      this.bibleDb.prepare('DELETE FROM translations WHERE id = ?').run(id);
    });
    tx();
  }

  getBooks(): Book[] {
    return this.bibleDb.prepare('SELECT * FROM books ORDER BY canonical_order').all() as Book[];
  }

  getChapterVerses(translationId: string, bookId: number, chapter: number): Verse[] {
    return this.bibleDb.prepare(`
      SELECT * FROM verses 
      WHERE translation_id = ? AND book_id = ? AND chapter = ? 
      ORDER BY verse
    `).all(translationId, bookId, chapter) as Verse[];
  }

  getVerse(translationId: string, bookId: number, chapter: number, verse: number): Verse | undefined {
    return this.bibleDb.prepare(`
      SELECT * FROM verses 
      WHERE translation_id = ? AND book_id = ? AND chapter = ? AND verse = ?
    `).get(translationId, bookId, chapter, verse) as Verse | undefined;
  }

  searchVerses(query: string, translationId: string = 'KJV', limit: number = 50, offset: number = 0): SearchResult[] {
    if (!query || query.trim().length === 0) return [];
    
    // Clean query for FTS5 syntax
    const sanitized = query.replace(/[^\w\s"']/gi, ' ').trim();
    if (!sanitized) return [];

    try {
      const ftsQuery = sanitized.includes('"') ? sanitized : sanitized.split(/\s+/).map(w => `${w}*`).join(' ');
      const rows = this.bibleDb.prepare(`
        SELECT 
          f.verse_id,
          f.translation_id,
          v.book_id,
          b.name_en as book_name_en,
          b.name_nl as book_name_nl,
          f.chapter,
          f.verse,
          f.text,
          snippet(fts_verses, 6, '<mark class="bg-amber-500/30 text-amber-200 px-0.5 rounded">', '</mark>', '...', 24) as snippet
        FROM fts_verses f
        JOIN verses v ON f.verse_id = v.id
        JOIN books b ON v.book_id = b.id
        WHERE fts_verses MATCH ? AND f.translation_id = ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `).all(ftsQuery, translationId, limit, offset) as any[];

      return rows.map(r => ({
        verse_id: r.verse_id,
        translation_id: r.translation_id,
        book_id: r.book_id,
        book_name: translationId === 'SVV' ? r.book_name_nl : r.book_name_en,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        snippet: r.snippet
      }));
    } catch (e) {
      console.error('FTS Search error:', e);
      return [];
    }
  }

  getCrossReferences(bookId: number, chapter: number, verse: number, limit: number = 30): CrossReference[] {
    const rows = this.bibleDb.prepare(`
      SELECT 
        x.id,
        x.from_book_id, x.from_chapter, x.from_verse,
        x.to_book_id, x.to_chapter, x.to_verse,
        x.votes,
        b.name_en as to_book_name_en,
        b.name_nl as to_book_name_nl,
        v_en.text as to_verse_text_en,
        v_nl.text as to_verse_text_nl
      FROM cross_references x
      JOIN books b ON x.to_book_id = b.id
      LEFT JOIN verses v_en ON (v_en.translation_id = 'KJV' AND v_en.book_id = x.to_book_id AND v_en.chapter = x.to_chapter AND v_en.verse = x.to_verse)
      LEFT JOIN verses v_nl ON (v_nl.translation_id = 'SVV' AND v_nl.book_id = x.to_book_id AND v_nl.chapter = x.to_chapter AND v_nl.verse = x.to_verse)
      WHERE x.from_book_id = ? AND x.from_chapter = ? AND x.from_verse = ?
      ORDER BY x.votes DESC
      LIMIT ?
    `).all(bookId, chapter, verse, limit) as any[];

    return rows.map(r => ({
      id: r.id,
      from_book_id: r.from_book_id,
      from_chapter: r.from_chapter,
      from_verse: r.from_verse,
      to_book_id: r.to_book_id,
      to_chapter: r.to_chapter,
      to_verse: r.to_verse,
      votes: r.votes,
      to_book_name: r.to_book_name_en,
      to_verse_text: r.to_verse_text_en || r.to_verse_text_nl
    }));
  }

  // --- Highlights & Bookmarks ---

  getHighlights(bookId: number, chapter: number): Highlight[] {
    return this.userDb.prepare(`
      SELECT * FROM highlights WHERE book_id = ? AND chapter = ?
    `).all(bookId, chapter) as Highlight[];
  }

  getAllHighlights(): Highlight[] {
    return this.userDb.prepare(`SELECT * FROM highlights ORDER BY created_at DESC`).all() as Highlight[];
  }

  saveHighlight(hl: Highlight) {
    this.userDb.prepare(`
      INSERT OR REPLACE INTO highlights (id, book_id, chapter, verse, color, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hl.id, hl.book_id, hl.chapter, hl.verse, hl.color, hl.category || null);
  }

  deleteHighlight(id: string) {
    this.userDb.prepare('DELETE FROM highlights WHERE id = ?').run(id);
  }

  getBookmarks(): Bookmark[] {
    const rows = this.userDb.prepare(`
      SELECT * FROM bookmarks ORDER BY created_at DESC
    `).all() as Bookmark[];

    // Enrich with book name
    return rows.map(bm => {
      const book = this.bibleDb.prepare('SELECT name_en, name_nl FROM books WHERE id = ?').get(bm.book_id) as any;
      const verse = this.bibleDb.prepare('SELECT text FROM verses WHERE translation_id = ? AND book_id = ? AND chapter = ? AND verse = ?')
        .get('KJV', bm.book_id, bm.chapter, bm.verse) as any;
      return {
        ...bm,
        book_name: book ? book.name_en : `Book ${bm.book_id}`,
        verse_text: verse ? verse.text : ''
      };
    });
  }

  saveBookmark(bm: Bookmark) {
    this.userDb.prepare(`
      INSERT OR REPLACE INTO bookmarks (id, folder_id, book_id, chapter, verse, label)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(bm.id, bm.folder_id || null, bm.book_id, bm.chapter, bm.verse, bm.label || null);
  }

  deleteBookmark(id: string) {
    this.userDb.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  }

  // --- Notes ---

  getNotes(): Note[] {
    const notes = this.userDb.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as Note[];
    const linksStmt = this.userDb.prepare('SELECT book_id, chapter, verse FROM note_verse_links WHERE note_id = ?');

    return notes.map(n => {
      const links = linksStmt.all(n.id) as any[];
      return {
        ...n,
        linked_verses: links.map(l => {
          const b = this.bibleDb.prepare('SELECT name_en FROM books WHERE id = ?').get(l.book_id) as any;
          return {
            book_id: l.book_id,
            chapter: l.chapter,
            verse: l.verse,
            book_name: b ? b.name_en : `Book ${l.book_id}`
          };
        })
      };
    });
  }

  saveNote(note: Note, linkedVerses?: { book_id: number; chapter: number; verse: number }[]) {
    const tx = this.userDb.transaction(() => {
      this.userDb.prepare(`
        INSERT OR REPLACE INTO notes (id, title, content_markdown, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(note.id, note.title, note.content_markdown);

      if (linkedVerses) {
        this.userDb.prepare('DELETE FROM note_verse_links WHERE note_id = ?').run(note.id);
        const insertLink = this.userDb.prepare(`
          INSERT INTO note_verse_links (note_id, book_id, chapter, verse) VALUES (?, ?, ?, ?)
        `);
        linkedVerses.forEach(lv => {
          insertLink.run(note.id, lv.book_id, lv.chapter, lv.verse);
        });
      }
    });
    tx();
  }

  deleteNote(id: string) {
    this.userDb.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }

  // --- Reading Plans ---

  getReadingPlans(): ReadingPlan[] {
    const plans = this.userDb.prepare('SELECT * FROM reading_plans').all() as any[];
    return plans.map(p => {
      const completed = this.userDb.prepare('SELECT count(*) as c FROM reading_plan_progress WHERE plan_id = ?').get(p.id) as any;
      const doneCount = completed ? completed.c : 0;
      return {
        ...p,
        current_day: Math.min(doneCount + 1, p.duration_days),
        progress_percent: Math.round((doneCount / p.duration_days) * 100)
      };
    });
  }

  getReadingPlanDays(planId: string): ReadingPlanDay[] {
    const rows = this.userDb.prepare(`
      SELECT d.plan_id, d.day_number, d.readings_json,
             (CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed
      FROM reading_plan_days d
      LEFT JOIN reading_plan_progress p ON (p.plan_id = d.plan_id AND p.day_number = d.day_number)
      WHERE d.plan_id = ?
      ORDER BY d.day_number
    `).all(planId) as any[];

    return rows.map(r => {
      let readings = [];
      try {
        readings = JSON.parse(r.readings_json);
      } catch (e) {
        readings = [];
      }
      return {
        plan_id: r.plan_id,
        day_number: r.day_number,
        completed: Boolean(r.completed),
        readings: readings.map((rd: any) => {
          const b = this.bibleDb.prepare('SELECT name_en, name_nl FROM books WHERE id = ?').get(rd.book_id) as any;
          return {
            ...rd,
            book_name: b ? b.name_en : `Book ${rd.book_id}`
          };
        })
      };
    });
  }

  toggleReadingPlanDay(planId: string, dayNumber: number): boolean {
    const existing = this.userDb.prepare('SELECT 1 FROM reading_plan_progress WHERE plan_id = ? AND day_number = ?').get(planId, dayNumber);
    if (existing) {
      this.userDb.prepare('DELETE FROM reading_plan_progress WHERE plan_id = ? AND day_number = ?').run(planId, dayNumber);
      return false;
    } else {
      this.userDb.prepare('INSERT INTO reading_plan_progress (plan_id, day_number) VALUES (?, ?)').run(planId, dayNumber);
      return true;
    }
  }

  // --- Knowledge Graph Engine ---

  getKnowledgeGraphData(focus?: { bookId?: number; chapter?: number; verse?: number }): GraphData {
    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Helper to add nodes safely
    const addNode = (node: GraphNode) => {
      if (!nodesMap.has(node.id)) {
        nodesMap.set(node.id, node);
      }
    };

    // 1. If focused on a specific verse
    if (focus && focus.bookId && focus.chapter && focus.verse) {
      const centerId = `v_${focus.bookId}_${focus.chapter}_${focus.verse}`;
      const centerBook = this.bibleDb.prepare('SELECT name_en FROM books WHERE id = ?').get(focus.bookId) as any;
      const centerVerse = this.bibleDb.prepare('SELECT text FROM verses WHERE translation_id = ? AND book_id = ? AND chapter = ? AND verse = ?')
        .get('KJV', focus.bookId, focus.chapter, focus.verse) as any;

      addNode({
        id: centerId,
        name: `${centerBook ? centerBook.name_en : 'Book'} ${focus.chapter}:${focus.verse}`,
        type: 'verse',
        color: '#38bdf8', // radiant cyan
        val: 12,
        details: centerVerse ? centerVerse.text : '',
        passage: { book_id: focus.bookId, chapter: focus.chapter, verse: focus.verse }
      });

      // Get cross-references for this verse
      const xrefs = this.getCrossReferences(focus.bookId, focus.chapter, focus.verse, 25);
      xrefs.forEach(xr => {
        const targetId = `v_${xr.to_book_id}_${xr.to_chapter}_${xr.to_verse}`;
        addNode({
          id: targetId,
          name: `${xr.to_book_name} ${xr.to_chapter}:${xr.to_verse}`,
          type: 'verse',
          color: '#818cf8', // indigo
          val: 6,
          details: xr.to_verse_text,
          passage: { book_id: xr.to_book_id, chapter: xr.to_chapter, verse: xr.to_verse }
        });
        edges.push({
          source: centerId,
          target: targetId,
          type: 'cross_ref',
          label: `${xr.votes} votes`,
          weight: xr.votes
        });
      });

      // Find any linked entities (themes, figures, places)
      const linkedEntities = this.bibleDb.prepare(`
        SELECT e.*, gev.role 
        FROM graph_entities e
        JOIN graph_entity_verses gev ON e.id = gev.entity_id
        WHERE gev.book_id = ? AND gev.chapter = ? AND gev.verse = ?
      `).all(focus.bookId, focus.chapter, focus.verse) as any[];

      linkedEntities.forEach(ent => {
        addNode({
          id: `ent_${ent.id}`,
          name: ent.name_en,
          type: ent.type,
          color: ent.type === 'figure' ? '#f59e0b' : (ent.type === 'theme' ? '#10b981' : '#ec4899'),
          val: 9,
          details: ent.description_en
        });
        edges.push({
          source: centerId,
          target: `ent_${ent.id}`,
          type: 'entity_link',
          label: ent.role
        });
      });

      // Find personal notes linked to this verse
      const linkedNotes = this.userDb.prepare(`
        SELECT n.* FROM notes n
        JOIN note_verse_links l ON n.id = l.note_id
        WHERE l.book_id = ? AND l.chapter = ? AND l.verse = ?
      `).all(focus.bookId, focus.chapter, focus.verse) as Note[];

      linkedNotes.forEach(note => {
        addNode({
          id: `note_${note.id}`,
          name: note.title,
          type: 'note',
          color: '#fb7185',
          val: 8,
          details: note.content_markdown
        });
        edges.push({
          source: centerId,
          target: `note_${note.id}`,
          type: 'note_link'
        });
      });

    } else {
      // Macro overview graph: Canonical Books + Top Biblical Themes & Figures
      const books = this.getBooks();
      books.forEach(b => {
        addNode({
          id: `b_${b.id}`,
          name: b.name_en,
          type: 'book',
          color: b.testament === 'OT' ? '#f97316' : '#06b6d4',
          val: 5 + Math.round(b.chapters_count / 10),
          details: `${b.testament === 'OT' ? 'Old' : 'New'} Testament, ${b.chapters_count} Chapters`
        });
      });

      // Link successive books
      for (let i = 0; i < books.length - 1; i++) {
        edges.push({
          source: `b_${books[i].id}`,
          target: `b_${books[i + 1].id}`,
          type: 'entity_link'
        });
      }

      // Add entities and connect them to their primary books
      const entities = this.bibleDb.prepare('SELECT * FROM graph_entities').all() as any[];
      const entityLinks = this.bibleDb.prepare('SELECT DISTINCT entity_id, book_id FROM graph_entity_verses').all() as any[];

      entities.forEach(ent => {
        addNode({
          id: `ent_${ent.id}`,
          name: ent.name_en,
          type: ent.type,
          color: ent.type === 'figure' ? '#f59e0b' : (ent.type === 'theme' ? '#10b981' : '#ec4899'),
          val: 8,
          details: ent.description_en
        });
      });

      entityLinks.forEach(el => {
        edges.push({
          source: `ent_${el.entity_id}`,
          target: `b_${el.book_id}`,
          type: 'theme_link'
        });
      });
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links: edges
    };
  }
}
