
// We use a CDN version of PDF.js
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

import { Book, BookPage } from '../types';

export async function parsePdf(file: File): Promise<Book> {
  const pdfjsLib = await import(PDFJS_URL);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pages: BookPage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    pages.push({
      pageNumber: i,
      text: text || "[Blank Page]"
    });
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: file.name.replace('.pdf', ''),
    author: 'Unknown Author',
    pages,
    totalPages,
    format: 'pdf'
  };
}

export async function parseTextFile(file: File): Promise<Book> {
  const text = await file.text();
  // Simple pagination logic for plain text: ~2000 characters per page
  const pageSize = 2000;
  const pages: BookPage[] = [];
  // Fix: Explicitly type rawPages as string[] to resolve 'never' type inference error on content.trim()
  const rawPages: string[] = text.match(new RegExp(`[\\s\\S]{1,${pageSize}}`, 'g')) || [];

  rawPages.forEach((content, index) => {
    pages.push({
      pageNumber: index + 1,
      text: content.trim()
    });
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: file.name.replace('.txt', ''),
    author: 'Unknown Author',
    pages,
    totalPages: pages.length,
    format: 'text'
  };
}
