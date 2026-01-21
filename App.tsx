
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Book as BookIcon, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Square, 
  Settings, 
  Volume2, 
  Type, 
  Loader2,
  Trash2,
  List
} from 'lucide-react';
import { Book, ReadingSettings, VoiceName } from './types';
import { parsePdf, parseTextFile } from './services/pdfService';
import { ttsService } from './services/geminiService';

const DEFAULT_SETTINGS: ReadingSettings = {
  voice: VoiceName.Kore,
  fontSize: 18,
  lineHeight: 1.6,
  isSerif: true
};

export default function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      let parsedBook: Book;
      if (file.type === 'application/pdf') {
        parsedBook = await parsePdf(file);
      } else {
        parsedBook = await parseTextFile(file);
      }
      setBook(parsedBook);
      setCurrentPage(0);
    } catch (err) {
      console.error(err);
      setError("Failed to parse the file. Please try a different PDF or Text file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSpeak = async () => {
    if (!book || isReading) return;
    
    setIsReading(true);
    try {
      const pageText = book.pages[currentPage].text;
      await ttsService.speak(pageText, settings.voice);
    } catch (err) {
      console.error(err);
      setError("Failed to generate speech. Please check your API key or connection.");
    } finally {
      setIsReading(false);
    }
  };

  const handleStop = async () => {
    await ttsService.stop();
    setIsReading(false);
  };

  const nextPage = () => {
    if (book && currentPage < book.totalPages - 1) {
      handleStop();
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (book && currentPage > 0) {
      handleStop();
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetBook = () => {
    handleStop();
    setBook(null);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BookIcon size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">AuraReader</h1>
        </div>

        <div className="flex items-center gap-4">
          {book && (
            <div className="flex items-center bg-slate-100 rounded-full px-4 py-1.5 text-sm font-medium text-slate-600">
              <span className="truncate max-w-[200px]">{book.title}</span>
              <div className="w-px h-4 bg-slate-300 mx-3" />
              <span>Page {currentPage + 1} of {book.totalPages}</span>
            </div>
          )}
          
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            title="Settings"
          >
            <Settings size={22} />
          </button>

          {book && (
            <button 
              onClick={resetBook}
              className="p-2 rounded-full hover:bg-red-50 transition-colors text-red-500"
              title="Close Book"
            >
              <Trash2 size={22} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Settings */}
        {isSettingsOpen && (
          <aside className="w-72 bg-white border-r p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Settings size={18} /> Reading Settings
            </h2>
            
            <div className="space-y-8">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-3 uppercase tracking-wider">Voice Character</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(VoiceName).map(v => (
                    <button
                      key={v}
                      onClick={() => setSettings(s => ({ ...s, voice: v }))}
                      className={`px-4 py-2 rounded-lg text-left transition-all ${
                        settings.voice === v 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 block mb-3 uppercase tracking-wider">Typography</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings(s => ({ ...s, isSerif: true }))}
                    className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                      settings.isSerif ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="serif-font text-lg font-bold">Aa</span>
                    <span className="block text-xs">Serif</span>
                  </button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, isSerif: false }))}
                    className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                      !settings.isSerif ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="text-lg font-bold">Aa</span>
                    <span className="block text-xs">Sans</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 block mb-3 uppercase tracking-wider">Font Size ({settings.fontSize}px)</label>
                <input 
                  type="range" min="12" max="32" value={settings.fontSize}
                  onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 block mb-3 uppercase tracking-wider">Line Height</label>
                <div className="flex gap-2">
                  {[1.2, 1.4, 1.6, 2.0].map(val => (
                    <button
                      key={val}
                      onClick={() => setSettings(s => ({ ...s, lineHeight: val }))}
                      className={`flex-1 py-2 rounded-md border text-sm transition-all ${
                        settings.lineHeight === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-6 py-3 rounded-xl shadow-lg border border-red-100 flex items-center gap-3">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="hover:text-red-800">×</button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
            {!book ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                  <Upload size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-800">Welcome to AuraReader</h2>
                <p className="text-slate-500 mb-8">Upload your favorite ebook or PDF and let our high-quality AI read it aloud to you.</p>
                
                <input 
                  type="file" accept=".pdf,.txt" className="hidden" 
                  ref={fileInputRef} onChange={handleFileUpload} 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="group relative bg-indigo-600 text-white px-10 py-4 rounded-2xl font-semibold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                  )}
                  {isProcessing ? "Processing..." : "Choose Ebook File"}
                </button>
                <p className="mt-4 text-xs text-slate-400">Supports PDF and Text formats</p>
              </div>
            ) : (
              <div 
                className={`max-w-2xl mx-auto bg-white p-10 lg:p-16 rounded-3xl shadow-sm border border-slate-100 ${settings.isSerif ? 'serif-font' : ''}`}
                style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  lineHeight: settings.lineHeight,
                  minHeight: '80vh'
                }}
              >
                <div className="mb-10 flex justify-between items-center text-xs uppercase tracking-widest text-slate-400 font-bold border-b pb-4">
                  <span>{book.title}</span>
                  <span>Page {currentPage + 1}</span>
                </div>
                
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-indigo-600">
                  {book.pages[currentPage].text}
                </p>
                
                {book.pages[currentPage].text === "[Blank Page]" && (
                  <div className="text-center py-20 text-slate-300 italic">
                    This page appears to be empty or contains only images.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {book && (
            <div className="h-24 border-t bg-white flex items-center justify-center px-8 sticky bottom-0 z-20 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-6 max-w-4xl w-full justify-between">
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="p-3 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <span className="text-sm font-semibold tabular-nums text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                    {currentPage + 1} / {book.totalPages}
                  </span>
                  <button 
                    onClick={nextPage}
                    disabled={currentPage === book.totalPages - 1}
                    className="p-3 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {!isReading ? (
                    <button 
                      onClick={handleSpeak}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                      <Volume2 size={20} />
                      Read Aloud
                    </button>
                  ) : (
                    <button 
                      onClick={handleStop}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-red-100 transition-all active:scale-95"
                    >
                      <Loader2 className="animate-spin" size={20} />
                      Stop Reading
                    </button>
                  )}
                </div>

                <div className="hidden md:flex items-center gap-3">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Current Voice</span>
                      <span className="text-sm font-semibold text-slate-700">{settings.voice}</span>
                   </div>
                   <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                     <Volume2 size={20} />
                   </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
