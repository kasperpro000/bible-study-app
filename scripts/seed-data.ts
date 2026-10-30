import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const RESOURCES_DIR = path.resolve(process.cwd(), 'resources');
if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}

const DB_PATH = path.join(RESOURCES_DIR, 'bibles.db');
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('--- Initializing bibles.db Schema ---');

db.exec(`
CREATE TABLE translations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    description TEXT,
    license TEXT DEFAULT 'Public Domain'
);

CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    canonical_order INTEGER NOT NULL,
    testament TEXT CHECK(testament IN ('OT', 'NT')),
    abbr_en TEXT NOT NULL,
    abbr_nl TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_nl TEXT NOT NULL,
    chapters_count INTEGER DEFAULT 0
);

CREATE TABLE verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    translation_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY(translation_id) REFERENCES translations(id),
    FOREIGN KEY(book_id) REFERENCES books(id),
    UNIQUE(translation_id, book_id, chapter, verse)
);

CREATE INDEX idx_verses_lookup ON verses(translation_id, book_id, chapter, verse);
CREATE INDEX idx_verses_book_ch ON verses(translation_id, book_id, chapter);

CREATE VIRTUAL TABLE fts_verses USING fts5(
    verse_id UNINDEXED,
    translation_id,
    book_name_en,
    book_name_nl,
    chapter UNINDEXED,
    verse UNINDEXED,
    text,
    tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE cross_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_book_id INTEGER NOT NULL,
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book_id INTEGER NOT NULL,
    to_chapter INTEGER NOT NULL,
    to_verse INTEGER NOT NULL,
    votes INTEGER DEFAULT 1
);

CREATE INDEX idx_xref_from ON cross_references(from_book_id, from_chapter, from_verse);
CREATE INDEX idx_xref_to ON cross_references(to_book_id, to_chapter, to_verse);

CREATE TABLE graph_entities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'figure', 'place', 'theme', 'event'
    name_en TEXT NOT NULL,
    name_nl TEXT NOT NULL,
    description_en TEXT,
    description_nl TEXT
);

CREATE TABLE graph_entity_verses (
    entity_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    role TEXT,
    PRIMARY KEY(entity_id, book_id, chapter, verse),
    FOREIGN KEY(entity_id) REFERENCES graph_entities(id)
);

CREATE INDEX idx_entity_verses ON graph_entity_verses(book_id, chapter, verse);
`);

console.log('--- Seeding Metadata & Translations ---');

const insertTranslation = db.prepare(`
  INSERT INTO translations (id, name, language, abbreviation, description) VALUES (?, ?, ?, ?, ?)
`);

insertTranslation.run('KJV', 'King James Version (1769)', 'en', 'KJV', 'Authorized King James Version Bible');
insertTranslation.run('SVV', 'Statenvertaling (1637/1888)', 'nl', 'SVV', 'Nederlandse Statenvertaling Jongbloed-editie');

// Canonical 66 Books specification
const CANONICAL_BOOKS = [
  { id: 1, test: 'OT', en: 'Genesis', nl: 'Genesis', abbrEn: 'Gen', abbrNl: 'Gen', xref: 'Gen' },
  { id: 2, test: 'OT', en: 'Exodus', nl: 'Exodus', abbrEn: 'Exo', abbrNl: 'Exo', xref: 'Exod' },
  { id: 3, test: 'OT', en: 'Leviticus', nl: 'Leviticus', abbrEn: 'Lev', abbrNl: 'Lev', xref: 'Lev' },
  { id: 4, test: 'OT', en: 'Numbers', nl: 'Numeri', abbrEn: 'Num', abbrNl: 'Num', xref: 'Num' },
  { id: 5, test: 'OT', en: 'Deuteronomy', nl: 'Deuteronomium', abbrEn: 'Deu', abbrNl: 'Deu', xref: 'Deut' },
  { id: 6, test: 'OT', en: 'Joshua', nl: 'Jozua', abbrEn: 'Jos', abbrNl: 'Joz', xref: 'Josh' },
  { id: 7, test: 'OT', en: 'Judges', nl: 'Rechters', abbrEn: 'Jdg', abbrNl: 'Recht', xref: 'Judg' },
  { id: 8, test: 'OT', en: 'Ruth', nl: 'Ruth', abbrEn: 'Rut', abbrNl: 'Rut', xref: 'Ruth' },
  { id: 9, test: 'OT', en: 'I Samuel', nl: '1 Samuel', abbrEn: '1Sa', abbrNl: '1Sam', xref: '1Sam' },
  { id: 10, test: 'OT', en: 'II Samuel', nl: '2 Samuel', abbrEn: '2Sa', abbrNl: '2Sam', xref: '2Sam' },
  { id: 11, test: 'OT', en: 'I Kings', nl: '1 Koningen', abbrEn: '1Ki', abbrNl: '1Kon', xref: '1Kgs' },
  { id: 12, test: 'OT', en: 'II Kings', nl: '2 Koningen', abbrEn: '2Ki', abbrNl: '2Kon', xref: '2Kgs' },
  { id: 13, test: 'OT', en: 'I Chronicles', nl: '1 Kronieken', abbrEn: '1Ch', abbrNl: '1Kron', xref: '1Chr' },
  { id: 14, test: 'OT', en: 'II Chronicles', nl: '2 Kronieken', abbrEn: '2Ch', abbrNl: '2Kron', xref: '2Chr' },
  { id: 15, test: 'OT', en: 'Ezra', nl: 'Ezra', abbrEn: 'Ezr', abbrNl: 'Ezr', xref: 'Ezra' },
  { id: 16, test: 'OT', en: 'Nehemiah', nl: 'Nehemia', abbrEn: 'Neh', abbrNl: 'Neh', xref: 'Neh' },
  { id: 17, test: 'OT', en: 'Esther', nl: 'Ester', abbrEn: 'Est', abbrNl: 'Est', xref: 'Esth' },
  { id: 18, test: 'OT', en: 'Job', nl: 'Job', abbrEn: 'Job', abbrNl: 'Job', xref: 'Job' },
  { id: 19, test: 'OT', en: 'Psalms', nl: 'Psalmen', abbrEn: 'Psa', abbrNl: 'Ps', xref: 'Ps' },
  { id: 20, test: 'OT', en: 'Proverbs', nl: 'Spreuken', abbrEn: 'Pro', abbrNl: 'Spr', xref: 'Prov' },
  { id: 21, test: 'OT', en: 'Ecclesiastes', nl: 'Prediker', abbrEn: 'Ecc', abbrNl: 'Pred', xref: 'Eccl' },
  { id: 22, test: 'OT', en: 'Song of Solomon', nl: 'Hooglied', abbrEn: 'Sng', abbrNl: 'Hoogl', xref: 'Song' },
  { id: 23, test: 'OT', en: 'Isaiah', nl: 'Jesaja', abbrEn: 'Isa', abbrNl: 'Jes', xref: 'Isa' },
  { id: 24, test: 'OT', en: 'Jeremiah', nl: 'Jeremia', abbrEn: 'Jer', abbrNl: 'Jer', xref: 'Jer' },
  { id: 25, test: 'OT', en: 'Lamentations', nl: 'Klaagliederen', abbrEn: 'Lam', abbrNl: 'Klaagl', xref: 'Lam' },
  { id: 26, test: 'OT', en: 'Ezekiel', nl: 'Ezechiël', abbrEn: 'Ezk', abbrNl: 'Ezech', xref: 'Ezek' },
  { id: 27, test: 'OT', en: 'Daniel', nl: 'Daniël', abbrEn: 'Dan', abbrNl: 'Dan', xref: 'Dan' },
  { id: 28, test: 'OT', en: 'Hosea', nl: 'Hosea', abbrEn: 'Hos', abbrNl: 'Hos', xref: 'Hos' },
  { id: 29, test: 'OT', en: 'Joel', nl: 'Joël', abbrEn: 'Jol', abbrNl: 'Joël', xref: 'Joel' },
  { id: 30, test: 'OT', en: 'Amos', nl: 'Amos', abbrEn: 'Amo', abbrNl: 'Amos', xref: 'Amos' },
  { id: 31, test: 'OT', en: 'Obadiah', nl: 'Obadja', abbrEn: 'Oba', abbrNl: 'Obad', xref: 'Obad' },
  { id: 32, test: 'OT', en: 'Jonah', nl: 'Jona', abbrEn: 'Jon', abbrNl: 'Jona', xref: 'Jonah' },
  { id: 33, test: 'OT', en: 'Micah', nl: 'Micha', abbrEn: 'Mic', abbrNl: 'Mich', xref: 'Mic' },
  { id: 34, test: 'OT', en: 'Nahum', nl: 'Nahum', abbrEn: 'Nah', abbrNl: 'Nah', xref: 'Nah' },
  { id: 35, test: 'OT', en: 'Habakkuk', nl: 'Habakuk', abbrEn: 'Hab', abbrNl: 'Hab', xref: 'Hab' },
  { id: 36, test: 'OT', en: 'Zephaniah', nl: 'Sefanja', abbrEn: 'Zep', abbrNl: 'Sef', xref: 'Zeph' },
  { id: 37, test: 'OT', en: 'Haggai', nl: 'Haggai', abbrEn: 'Hag', abbrNl: 'Hag', xref: 'Hag' },
  { id: 38, test: 'OT', en: 'Zechariah', nl: 'Zacharia', abbrEn: 'Zec', abbrNl: 'Zach', xref: 'Zech' },
  { id: 39, test: 'OT', en: 'Malachi', nl: 'Maleachi', abbrEn: 'Mal', abbrNl: 'Mal', xref: 'Mal' },
  { id: 40, test: 'NT', en: 'Matthew', nl: 'Matteüs', abbrEn: 'Mat', abbrNl: 'Mat', xref: 'Matt' },
  { id: 41, test: 'NT', en: 'Mark', nl: 'Marcus', abbrEn: 'Mrk', abbrNl: 'Marc', xref: 'Mark' },
  { id: 42, test: 'NT', en: 'Luke', nl: 'Lucas', abbrEn: 'Luk', abbrNl: 'Luc', xref: 'Luke' },
  { id: 43, test: 'NT', en: 'John', nl: 'Johannes', abbrEn: 'Jhn', abbrNl: 'Joh', xref: 'John' },
  { id: 44, test: 'NT', en: 'Acts', nl: 'Handelingen', abbrEn: 'Act', abbrNl: 'Hand', xref: 'Acts' },
  { id: 45, test: 'NT', en: 'Romans', nl: 'Romeinen', abbrEn: 'Rom', abbrNl: 'Rom', xref: 'Rom' },
  { id: 46, test: 'NT', en: 'I Corinthians', nl: '1 Korintiërs', abbrEn: '1Co', abbrNl: '1Kor', xref: '1Cor' },
  { id: 47, test: 'NT', en: 'II Corinthians', nl: '2 Korintiërs', abbrEn: '2Co', abbrNl: '2Kor', xref: '2Cor' },
  { id: 48, test: 'NT', en: 'Galatians', nl: 'Galaten', abbrEn: 'Gal', abbrNl: 'Gal', xref: 'Gal' },
  { id: 49, test: 'NT', en: 'Ephesians', nl: 'Efeziërs', abbrEn: 'Eph', abbrNl: 'Efez', xref: 'Eph' },
  { id: 50, test: 'NT', en: 'Philippians', nl: 'Filippenzen', abbrEn: 'Php', abbrNl: 'Filip', xref: 'Phil' },
  { id: 51, test: 'NT', en: 'Colossians', nl: 'Kolossenzen', abbrEn: 'Col', abbrNl: 'Kol', xref: 'Col' },
  { id: 52, test: 'NT', en: 'I Thessalonians', nl: '1 Tessalonicenzen', abbrEn: '1Th', abbrNl: '1Tess', xref: '1Thess' },
  { id: 53, test: 'NT', en: 'II Thessalonians', nl: '2 Tessalonicenzen', abbrEn: '2Th', abbrNl: '2Tess', xref: '2Thess' },
  { id: 54, test: 'NT', en: 'I Timothy', nl: '1 Timoteüs', abbrEn: '1Ti', abbrNl: '1Tim', xref: '1Tim' },
  { id: 55, test: 'NT', en: 'II Timothy', nl: '2 Timoteüs', abbrEn: '2Ti', abbrNl: '2Tim', xref: '2Tim' },
  { id: 56, test: 'NT', en: 'Titus', nl: 'Titus', abbrEn: 'Tit', abbrNl: 'Tit', xref: 'Titus' },
  { id: 57, test: 'NT', en: 'Philemon', nl: 'Filemon', abbrEn: 'Phm', abbrNl: 'Filem', xref: 'Phlm' },
  { id: 58, test: 'NT', en: 'Hebrews', nl: 'Hebreeën', abbrEn: 'Heb', abbrNl: 'Hebr', xref: 'Heb' },
  { id: 59, test: 'NT', en: 'James', nl: 'Jakobus', abbrEn: 'Jas', abbrNl: 'Jak', xref: 'Jas' },
  { id: 60, test: 'NT', en: 'I Peter', nl: '1 Petrus', abbrEn: '1Pe', abbrNl: '1Pet', xref: '1Pet' },
  { id: 61, test: 'NT', en: 'II Peter', nl: '2 Petrus', abbrEn: '2Pe', abbrNl: '2Pet', xref: '2Pet' },
  { id: 62, test: 'NT', en: 'I John', nl: '1 Johannes', abbrEn: '1Jn', abbrNl: '1Joh', xref: '1John' },
  { id: 63, test: 'NT', en: 'II John', nl: '2 Johannes', abbrEn: '2Jn', abbrNl: '2Joh', xref: '2John' },
  { id: 64, test: 'NT', en: 'III John', nl: '3 Johannes', abbrEn: '3Jn', abbrNl: '3Joh', xref: '3John' },
  { id: 65, test: 'NT', en: 'Jude', nl: 'Judas', abbrEn: 'Jud', abbrNl: 'Judas', xref: 'Jude' },
  { id: 66, test: 'NT', en: 'Revelation', nl: 'Openbaring', abbrEn: 'Rev', abbrNl: 'Openb', xref: 'Rev' }
];

const insertBook = db.prepare(`
  INSERT INTO books (id, canonical_order, testament, abbr_en, abbr_nl, name_en, name_nl)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

CANONICAL_BOOKS.forEach(b => {
  insertBook.run(b.id, b.id, b.test, b.abbrEn, b.abbrNl, b.en, b.nl);
});

// Lookup maps
const bookByName = new Map<string, typeof CANONICAL_BOOKS[0]>();
const bookByXref = new Map<string, typeof CANONICAL_BOOKS[0]>();
CANONICAL_BOOKS.forEach(b => {
  bookByName.set(b.en.toLowerCase(), b);
  bookByXref.set(b.xref.toLowerCase(), b);
});

// CSV parser helper that handles quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[charIndex(i)];
    if (char === '"') {
      if (inQuotes && line[charIndex(i + 1)] === '"') {
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

function charIndex(i: number): number {
  return i;
}

// Function to import CSV Bible
function importBibleCsv(filePath: string, translationId: string) {
  console.log(`Importing ${translationId} from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const insertVerse = db.prepare(`
    INSERT OR REPLACE INTO verses (translation_id, book_id, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO fts_verses (verse_id, translation_id, book_name_en, book_name_nl, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const maxChapters = new Map<number, number>();

  const transaction = db.transaction(() => {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = parseCsvLine(line);
      if (parts.length < 4) continue;

      const bookName = parts[0].trim().toLowerCase();
      const chapter = parseInt(parts[1], 10);
      const verse = parseInt(parts[2], 10);
      const text = parts.slice(3).join(',').trim();

      const book = bookByName.get(bookName);
      if (!book) continue; // Skip non-canonical / apocrypha for clean 66-book alignment

      const curMax = maxChapters.get(book.id) || 0;
      if (chapter > curMax) {
        maxChapters.set(book.id, chapter);
      }

      const info = insertVerse.run(translationId, book.id, chapter, verse, text);
      insertFts.run(info.lastInsertRowid, translationId, book.en, book.nl, chapter, verse, text);
    }
  });

  transaction();

  // Update chapters_count
  const updateChapters = db.prepare(`UPDATE books SET chapters_count = ? WHERE id = ?`);
  maxChapters.forEach((count, bookId) => {
    updateChapters.run(count, bookId);
  });

  console.log(`✓ Completed ${translationId}`);
}

importBibleCsv(path.join(process.cwd(), 'raw_data/KJV.csv'), 'KJV');
importBibleCsv(path.join(process.cwd(), 'raw_data/DutSVV.csv'), 'SVV');

// Function to import Cross References
console.log('--- Importing Cross References (OpenBible.info / TSK) ---');
const xrefContent = fs.readFileSync(path.join(process.cwd(), 'raw_data/cross_references.txt'), 'utf8');
const xrefLines = xrefContent.split(/\r?\n/);

const insertXref = db.prepare(`
  INSERT INTO cross_references (from_book_id, from_chapter, from_verse, to_book_id, to_chapter, to_verse, votes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function parseRef(str: string) {
  // e.g. "Gen.1.1" or "1John.3.16" or "1Kgs.18.21"
  const parts = str.split('.');
  if (parts.length < 3) return null;
  const bookAbbr = parts[0].toLowerCase();
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  const book = bookByXref.get(bookAbbr);
  if (!book || isNaN(chapter) || isNaN(verse)) return null;
  return { bookId: book.id, chapter, verse };
}

let xrefCount = 0;
const xrefTx = db.transaction(() => {
  for (let i = 1; i < xrefLines.length; i++) {
    const line = xrefLines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const from = parseRef(parts[0]);
    const to = parseRef(parts[1]);
    const votes = parseInt(parts[2], 10) || 1;

    if (from && to) {
      insertXref.run(from.bookId, from.chapter, from.verse, to.bookId, to.chapter, to.verse, votes);
      xrefCount++;
    }
  }
});
xrefTx();
console.log(`✓ Imported ${xrefCount} cross references!`);

console.log('--- Seeding Knowledge Graph Entities ---');

const insertEntity = db.prepare(`
  INSERT INTO graph_entities (id, type, name_en, name_nl, description_en, description_nl)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertEntityVerse = db.prepare(`
  INSERT OR IGNORE INTO graph_entity_verses (entity_id, book_id, chapter, verse, role)
  VALUES (?, ?, ?, ?, ?)
`);

const ENTITIES = [
  // Figures
  { id: 'jesus', type: 'figure', en: 'Jesus Christ', nl: 'Jezus Christus', descEn: 'Son of God, Messiah and Savior', descNl: 'Zoon van God, Messias en Verlosser' },
  { id: 'abraham', type: 'figure', en: 'Abraham', nl: 'Abraham', descEn: 'Father of faith, patriarch of Israel', descNl: 'Vader van het geloof, aartsvader van Israël' },
  { id: 'moses', type: 'figure', en: 'Moses', nl: 'Mozes', descEn: 'Prophet, lawgiver, and leader of the Exodus', descNl: 'Profeet, wetgever en leider van de Exodus' },
  { id: 'david', type: 'figure', en: 'King David', nl: 'Koning David', descEn: 'King of Israel, psalmist, man after God’s own heart', descNl: 'Koning van Israël, psalmist, man naar Gods hart' },
  { id: 'paul', type: 'figure', en: 'Apostle Paul', nl: 'Apostel Paulus', descEn: 'Apostle to the Gentiles and Epistle author', descNl: 'Apostel der heidenen en brievenschrijver' },
  { id: 'peter', type: 'figure', en: 'Apostle Peter', nl: 'Apostel Petrus', descEn: 'Early church pillar and disciple', descNl: 'Vroege kerkleider en discipel' },
  { id: 'john', type: 'figure', en: 'Apostle John', nl: 'Apostel Johannes', descEn: 'The beloved disciple, author of Gospel and Revelation', descNl: 'De geliefde discipel, schrijver van Evangelie en Openbaring' },

  // Themes
  { id: 'creation', type: 'theme', en: 'Creation', nl: 'Schepping', descEn: 'Origin of heavens, earth, and mankind by God’s Word', descNl: 'Ontstaan van hemel, aarde en mens door Gods Woord' },
  { id: 'covenant', type: 'theme', en: 'Covenant', nl: 'Verbond', descEn: 'Divine promises and pledges between God and His people', descNl: 'Goddelijke beloften en verbonden tussen God en Zijn volk' },
  { id: 'faith', type: 'theme', en: 'Faith', nl: 'Geloof', descEn: 'Trust and confidence in the promises and character of God', descNl: 'Vertrouwen en overgave aan Gods beloften' },
  { id: 'grace', type: 'theme', en: 'Grace', nl: 'Genade', descEn: 'Unmerited favor and love bestowed by God', descNl: 'Onverdiende goedgunstigheid en liefde van God' },
  { id: 'resurrection', type: 'theme', en: 'Resurrection', nl: 'Wederopstanding', descEn: 'Victory over death and promised new eternal life', descNl: 'Overwinning op de dood en eeuwig nieuw leven' },
  { id: 'righteousness', type: 'theme', en: 'Righteousness', nl: 'Gerechtigheid', descEn: 'Moral purity, justice, and justification before God', descNl: 'Zuiverheid, rechtvaardigheid en vrijspraak voor God' },

  // Places
  { id: 'jerusalem', type: 'place', en: 'Jerusalem', nl: 'Jeruzalem', descEn: 'Holy City, Mount Zion, capital of united kingdom', descNl: 'Heilige Stad, Berg Sion, hoofdstad van Israël' },
  { id: 'bethlehem', type: 'place', en: 'Bethlehem', nl: 'Bethlehem', descEn: 'City of David and birthplace of the Messiah', descNl: 'Stad van David en geboorteplaats van de Messias' },
  { id: 'rome', type: 'place', en: 'Rome', nl: 'Rome', descEn: 'Capital of the Roman Empire', descNl: 'Hoofdstad van het Romeinse Rijk' },
  { id: 'sinai', type: 'place', en: 'Mount Sinai', nl: 'Berg Sinaï', descEn: 'Mountain where God gave the Law to Moses', descNl: 'Berg waar God de Wet aan Mozes schonk' }
];

const ENTITY_VERSES = [
  // Creation
  { id: 'creation', b: 1, c: 1, v: 1, role: 'primary' },
  { id: 'creation', b: 1, c: 1, v: 2, role: 'context' },
  { id: 'creation', b: 1, c: 1, v: 3, role: 'light' },
  { id: 'creation', b: 19, c: 104, v: 24, role: 'psalm' },
  { id: 'creation', b: 43, c: 1, v: 1, role: 'logos' },
  { id: 'creation', b: 43, c: 1, v: 3, role: 'logos' },
  { id: 'creation', b: 51, c: 1, v: 16, role: 'christ' },
  { id: 'creation', b: 58, c: 11, v: 3, role: 'faith' },

  // Jesus
  { id: 'jesus', b: 40, c: 1, v: 21, role: 'birth-name' },
  { id: 'jesus', b: 43, c: 1, v: 14, role: 'incarnation' },
  { id: 'jesus', b: 43, c: 3, v: 16, role: 'love' },
  { id: 'jesus', b: 43, c: 14, v: 6, role: 'the-way' },
  { id: 'jesus', b: 45, c: 5, v: 8, role: 'sacrifice' },
  { id: 'jesus', b: 46, c: 15, v: 3, role: 'gospel' },
  { id: 'jesus', b: 50, c: 2, v: 9, role: 'exaltation' },
  { id: 'jesus', b: 66, c: 22, v: 13, role: 'alpha-omega' },

  // Faith
  { id: 'faith', b: 1, c: 15, v: 6, role: 'abraham' },
  { id: 'faith', b: 35, c: 2, v: 4, role: 'just-shall-live' },
  { id: 'faith', b: 45, c: 1, v: 17, role: 'gospel-righteousness' },
  { id: 'faith', b: 45, c: 4, v: 3, role: 'reckoned' },
  { id: 'faith', b: 48, c: 3, v: 11, role: 'law-vs-faith' },
  { id: 'faith', b: 58, c: 11, v: 1, role: 'definition' },
  { id: 'faith', b: 58, c: 11, v: 6, role: 'pleasing-god' },
  { id: 'faith', b: 59, c: 2, v: 17, role: 'works' },

  // Grace
  { id: 'grace', b: 43, c: 1, v: 17, role: 'grace-truth' },
  { id: 'grace', b: 45, c: 3, v: 24, role: 'justified-freely' },
  { id: 'grace', b: 45, c: 6, v: 14, role: 'under-grace' },
  { id: 'grace', b: 47, c: 12, v: 9, role: 'sufficient' },
  { id: 'grace', b: 49, c: 2, v: 8, role: 'saved-by-grace' },
  { id: 'grace', b: 56, c: 2, v: 11, role: 'salvation-appeared' },

  // Abraham
  { id: 'abraham', b: 1, c: 12, v: 1, role: 'call' },
  { id: 'abraham', b: 1, c: 15, v: 5, role: 'stars' },
  { id: 'abraham', b: 1, c: 22, v: 2, role: 'moriah' },
  { id: 'abraham', b: 45, c: 4, v: 1, role: 'father' },
  { id: 'abraham', b: 58, c: 11, v: 8, role: 'obedient-faith' },

  // Moses
  { id: 'moses', b: 2, c: 3, v: 2, role: 'burning-bush' },
  { id: 'moses', b: 2, c: 20, v: 1, role: 'ten-commandments' },
  { id: 'moses', b: 5, c: 34, v: 10, role: 'prophet' },
  { id: 'moses', b: 58, c: 11, v: 24, role: 'faith-choice' },

  // David
  { id: 'david', b: 9, c: 16, v: 13, role: 'anointing' },
  { id: 'david', b: 9, c: 17, v: 45, role: 'goliath' },
  { id: 'david', b: 10, c: 7, v: 12, role: 'covenant' },
  { id: 'david', b: 19, c: 23, v: 1, role: 'shepherd-psalm' },
  { id: 'david', b: 19, c: 51, v: 1, role: 'repentance' },

  // Jerusalem
  { id: 'jerusalem', b: 10, c: 5, v: 7, role: 'zion' },
  { id: 'jerusalem', b: 19, c: 122, v: 6, role: 'peace-of-jerusalem' },
  { id: 'jerusalem', b: 42, c: 19, v: 41, role: 'jesus-weeps' },
  { id: 'jerusalem', b: 44, c: 1, v: 8, role: 'witness' },
  { id: 'jerusalem', b: 66, c: 21, v: 2, role: 'new-jerusalem' }
];

const entityTx = db.transaction(() => {
  ENTITIES.forEach(e => {
    insertEntity.run(e.id, e.type, e.en, e.nl, e.descEn, e.descNl);
  });
  ENTITY_VERSES.forEach(ev => {
    insertEntityVerse.run(ev.id, ev.b, ev.c, ev.v, ev.role);
  });
});
entityTx();

console.log(`✓ Seeded ${ENTITIES.length} knowledge graph entities and links!`);

// Optimize and close
console.log('--- Optimizing SQLite bibles.db ---');
db.pragma('optimize');
db.close();

const stats = fs.statSync(DB_PATH);
console.log(`DONE! bibles.db created at ${DB_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
