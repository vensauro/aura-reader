
export interface BookPage {
  pageNumber: number;
  text: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  pages: BookPage[];
  totalPages: number;
  format: 'pdf' | 'text';
}

export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface ReadingSettings {
  voice: VoiceName;
  fontSize: number;
  lineHeight: number;
  isSerif: boolean;
}
