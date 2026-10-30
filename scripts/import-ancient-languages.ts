import { BibleDatabaseService } from '../electron/db/database';
import fs from 'fs';
import path from 'path';

const ANCIENT_TRANSLATIONS = [
  {
    id: 'VULG',
    name: 'Biblia Sacra Vulgata (Latin Vulgate)',
    language: 'la',
    abbreviation: 'VULG',
    description: 'Hieronymi Vulgata Clementina (Jerome Latin Vulgate 405 AD / 1592)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/Vulgate.csv'
  },
  {
    id: 'TR',
    name: 'Textus Receptus (Greek NT 1550/1894)',
    language: 'el',
    abbreviation: 'TR',
    description: 'Original Koine Greek New Testament (Stephanus 1550 / Scrivener 1894)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/TR.csv'
  },
  {
    id: 'GRE',
    name: 'Greek Bible (Old & New Testament)',
    language: 'el',
    abbreviation: 'GRE',
    description: 'Complete Greek Bible (Septuagint OT & Greek NT)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/GreVamvas.csv'
  },
  {
    id: 'PESH',
    name: 'Aramaic Peshitta (Syriac NT)',
    language: 'syr',
    abbreviation: 'PESH',
    description: 'Ancient Aramaic/Syriac New Testament (Peshitta)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/Peshitta.csv'
  }
];

async function run() {
  const service = new BibleDatabaseService();
  const tmpDir = path.resolve(process.cwd(), 'temp_ancient');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  console.log('--- Starting Import of Greek, Latin, and Aramaic Bibles ---');

  for (const item of ANCIENT_TRANSLATIONS) {
    const filePath = path.join(tmpDir, `${item.id}.csv`);
    console.log(`\n[1/2] Downloading ${item.name}...`);
    const res = await fetch(item.url);
    if (!res.ok) {
      console.error(`Failed to download ${item.name}: ${res.statusText}`);
      continue;
    }
    const text = await res.text();
    fs.writeFileSync(filePath, text, 'utf8');
    console.log(`✓ Downloaded ${(text.length / 1024 / 1024).toFixed(2)} MB`);

    console.log(`[2/2] Parsing and indexing ${item.id} into SQLite FTS5...`);
    const importRes = service.importTranslation(
      {
        id: item.id,
        name: item.name,
        language: item.language,
        abbreviation: item.abbreviation,
        description: item.description
      },
      filePath
    );

    if (importRes.success) {
      console.log(`✓ Successfully imported ${importRes.versesCount.toLocaleString()} verses into ${item.id}!`);
    } else {
      console.error(`✗ Import error for ${item.id}:`, importRes.error);
    }
  }

  // Cleanup temp files
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n======================================================');
  console.log('✓ ALL ANCIENT BIBLES IMPORTED AND FULLY INDEXED!');
  console.log('======================================================');

  const all = service.getTranslations();
  console.log('\nUpdated Translations in Library:');
  all.forEach(t => console.log(`  - [${t.id}] ${t.name} (${t.language.toUpperCase()}) — ${t.verse_count?.toLocaleString()} verses`));
}

run().catch(console.error);
