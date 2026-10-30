export interface Translation {
  id: string;
  name: string;
  language: string;
  abbreviation: string;
  description: string;
  verse_count?: number;
}

export interface Book {
  id: number;
  canonical_order: number;
  testament: 'OT' | 'NT';
  abbr_en: string;
  abbr_nl: string;
  name_en: string;
  name_nl: string;
  chapters_count: number;
}

export interface Verse {
  id: number;
  translation_id: string;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface CrossReference {
  id: number;
  from_book_id: number;
  from_chapter: number;
  from_verse: number;
  to_book_id: number;
  to_chapter: number;
  to_verse: number;
  votes: number;
  to_book_name?: string;
  to_verse_text?: string;
}

export interface Highlight {
  id: string;
  book_id: number;
  chapter: number;
  verse: number;
  color: string;
  category?: string;
  created_at: string;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  color?: string;
}

export interface Bookmark {
  id: string;
  folder_id?: string;
  book_id: number;
  chapter: number;
  verse: number;
  label?: string;
  created_at: string;
  book_name?: string;
  verse_text?: string;
}

export interface Note {
  id: string;
  title: string;
  content_markdown: string;
  created_at: string;
  updated_at: string;
  linked_verses?: {
    book_id: number;
    chapter: number;
    verse: number;
    book_name?: string;
  }[];
}

export interface ReadingPlanDay {
  plan_id: string;
  day_number: number;
  readings: {
    book_id: number;
    chapter: number;
    book_name?: string;
  }[];
  completed: boolean;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  current_day: number;
  progress_percent: number;
}

export interface SearchResult {
  verse_id: number;
  translation_id: string;
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  snippet?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'verse' | 'book' | 'figure' | 'place' | 'theme' | 'note';
  color: string;
  val: number;
  details?: string;
  passage?: {
    book_id: number;
    chapter: number;
    verse: number;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'cross_ref' | 'entity_link' | 'theme_link' | 'note_link';
  label?: string;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}
