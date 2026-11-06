import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'resources', 'bibles.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('--- Uniting Original Texts into a Single Option ---');

const tx = db.transaction(() => {
  // 1. Delete existing ORIG if present
  db.prepare(`DELETE FROM fts_verses WHERE translation_id = 'ORIG'`).run();
  db.prepare(`DELETE FROM verses WHERE translation_id = 'ORIG'`).run();
  db.prepare(`DELETE FROM translations WHERE id = 'ORIG'`).run();

  // 2. Insert the unified translation
  db.prepare(`
    INSERT INTO translations (id, name, language, abbreviation, description, license)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'ORIG',
    'Original Texts (Hebrew OT / Greek NT)',
    'orig',
    'ORIG',
    'Complete original scriptures: Hebrew Masoretic Text (WLC) for the Old Testament and Koine Greek (TR) for the New Testament',
    'Public Domain'
  );

  // 3. Copy Hebrew OT (books 1-39) into ORIG
  console.log('Copying Hebrew OT (books 1-39)...');
  const insertVerse = db.prepare(`
    INSERT INTO verses (translation_id, book_id, chapter, verse, text)
    VALUES ('ORIG', ?, ?, ?, ?)
  `);
  const insertFts = db.prepare(`
    INSERT INTO fts_verses (verse_id, translation_id, book_name_en, text)
    VALUES (?, 'ORIG', ?, ?)
  `);

  const hebrewVerses = db.prepare(`
    SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name_en
    FROM verses v
    JOIN books b ON v.book_id = b.id
    WHERE v.translation_id = 'WLC' AND v.book_id <= 39
  `).all() as any[];

  for (const v of hebrewVerses) {
    const res = insertVerse.run(v.book_id, v.chapter, v.verse, v.text);
    insertFts.run(Number(res.lastInsertRowid), v.name_en, v.text);
  }
  console.log(`✓ Copied ${hebrewVerses.length} Hebrew OT verses`);

  // 4. Copy Greek NT (books 40-66) into ORIG
  console.log('Copying Greek NT (books 40-66)...');
  const greekVerses = db.prepare(`
    SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name_en
    FROM verses v
    JOIN books b ON v.book_id = b.id
    WHERE v.translation_id = 'TR' AND v.book_id >= 40
  `).all() as any[];

  for (const v of greekVerses) {
    const res = insertVerse.run(v.book_id, v.chapter, v.verse, v.text);
    insertFts.run(Number(res.lastInsertRowid), v.name_en, v.text);
  }
  console.log(`✓ Copied ${greekVerses.length} Greek NT verses`);

  // 5. Remove the fragmented individual options (WLC, TR, GRE, PESH) so only ORIG remains as the original texts option
  console.log('Cleaning up fragmented original text options (WLC, TR, GRE, PESH)...');
  const removeIds = ['WLC', 'TR', 'GRE', 'PESH'];
  for (const id of removeIds) {
    db.prepare(`DELETE FROM fts_verses WHERE translation_id = ?`).run(id);
    db.prepare(`DELETE FROM verses WHERE translation_id = ?`).run(id);
    db.prepare(`DELETE FROM translations WHERE id = ?`).run(id);
  }
  console.log('✓ Cleaned up redundant entries');
});

tx();

console.log('\n======================================================');
console.log('AVAILABLE TRANSLATIONS NOW:');
console.log('======================================================');
const list = db.prepare(`
  SELECT t.id, t.name, t.language, (SELECT count(*) FROM verses v WHERE v.translation_id = t.id) as verse_count
  FROM translations t
  ORDER BY t.id
`).all() as any[];

list.forEach(t => console.log(`• [${t.id}] ${t.name} (${t.language.toUpperCase()}) — ${t.verse_count?.toLocaleString()} verses`));

// Test samples
const gen1 = db.prepare(`SELECT text FROM verses WHERE translation_id = 'ORIG' AND book_id = 1 AND chapter = 1 AND verse = 1`).get() as any;
const mat1 = db.prepare(`SELECT text FROM verses WHERE translation_id = 'ORIG' AND book_id = 40 AND chapter = 1 AND verse = 1`).get() as any;

console.log('\nVerified ORIG Genesis 1:1 (Hebrew):', gen1?.text);
console.log('Verified ORIG Matthew 1:1 (Greek):', mat1?.text);
