import { BibleDatabaseService } from '../electron/db/database';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TranslationToImport {
  id: string;
  name: string;
  language: string;
  abbreviation: string;
  description: string;
  url: string;
}

const TRANSLATIONS: TranslationToImport[] = [
  // 1. Modern Dutch Translation
  {
    id: 'CANIS',
    name: 'Canisiusvertaling (1939)',
    language: 'nl',
    abbreviation: 'CANIS',
    description: 'Moderne 20e-eeuwse Nederlandse vertaling (Petrus Canisiusvertaling)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/NlCanisius1939.csv'
  },
  // 2. Modern English Translation
  {
    id: 'BSB',
    name: 'Berean Standard Bible (2023)',
    language: 'en',
    abbreviation: 'BSB',
    description: 'Modern, highly accurate English translation in the Public Domain (CC0)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/BSB.csv'
  },
  // 3. Original Hebrew Old Testament
  {
    id: 'WLC',
    name: 'Westminster Leningrad Codex (Hebrew OT)',
    language: 'he',
    abbreviation: 'WLC',
    description: 'Authentic original Hebrew Masoretic text with complete vowel points (Niqqud) and cantillation accents',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/WLC.csv'
  },
  // 4. Original Greek New Testament
  {
    id: 'TR',
    name: 'Textus Receptus (Greek NT 1550/1894)',
    language: 'el',
    abbreviation: 'TR',
    description: 'Original Koine Greek New Testament (Stephanus 1550 / Scrivener 1894)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/TR.csv'
  },
  // 5. Greek Septuagint & NT (Complete Greek Bible)
  {
    id: 'GRE',
    name: 'Greek Bible (Septuagint OT & NT)',
    language: 'el',
    abbreviation: 'GRE',
    description: 'Complete Greek Bible (Ancient Septuagint Old Testament and Greek New Testament)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/GreVamvas.csv'
  },
  // 6. Ancient Aramaic / Syriac NT
  {
    id: 'PESH',
    name: 'Aramaic Peshitta (Syriac NT)',
    language: 'syr',
    abbreviation: 'PESH',
    description: 'Ancient Aramaic/Syriac New Testament (Peshitta)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/Peshitta.csv'
  },
  // 7. Latin Vulgate
  {
    id: 'VULG',
    name: 'Biblia Sacra Vulgata (Latin Vulgate)',
    language: 'la',
    abbreviation: 'VULG',
    description: 'Hieronymi Vulgata Clementina (Jerome Latin Vulgate 405 AD / 1592)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/Vulgate.csv'
  }
];

async function main() {
  const service = new BibleDatabaseService();
  const tempDir = path.resolve(process.cwd(), 'temp_bibles');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log('======================================================================');
  console.log('Starting Import of Modern Translations & Original Texts');
  console.log('======================================================================');

  for (const item of TRANSLATIONS) {
    const csvPath = path.join(tempDir, `${item.id}.csv`);
    console.log(`\n--> [1/2] Downloading ${item.name} (${item.id})...`);

    try {
      execSync(`curl.exe -s -L -o "${csvPath}" "${item.url}"`, { stdio: 'inherit' });
      const stats = fs.statSync(csvPath);
      console.log(`    Downloaded ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      console.log(`--> [2/2] Parsing and indexing into SQLite database & FTS5 index...`);
      const res = service.importTranslation(
        {
          id: item.id,
          name: item.name,
          language: item.language,
          abbreviation: item.abbreviation,
          description: item.description
        },
        csvPath
      );

      if (res.success) {
        console.log(`    ✓ SUCCESS: Imported ${res.versesCount.toLocaleString()} verses into ${item.id}!`);
      } else {
        console.error(`    ✗ ERROR: ${res.error}`);
      }
    } catch (err: any) {
      console.error(`    ✗ FAILED to import ${item.id}:`, err.message);
    }
  }

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n======================================================================');
  console.log('SUMMARY OF ALL INSTALLED BIBLES IN WORKSTATION:');
  console.log('======================================================================');
  const allTranslations = service.getTranslations();
  allTranslations.forEach(t => {
    console.log(`• [${t.id}] ${t.name} (${t.language.toUpperCase()}) — ${t.verse_count?.toLocaleString()} verses`);
  });
}

main().catch(console.error);
