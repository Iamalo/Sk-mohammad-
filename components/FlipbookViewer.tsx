
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Layers, Square, ZoomIn, Play, Pause, 
  Search, StickyNote, Grid, X, SlidersHorizontal
} from 'lucide-react';

interface FlipbookViewerProps {
  pages: string[];
  documentId?: string; 
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ pages, documentId = 'default' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showThumbs, setShowThumbs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem(`notes_${documentId}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [activeNotePage, setActiveNotePage] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<number | null>(null);
  const total = pages.length;

  useEffect(() => {
    localStorage.setItem(`notes_${documentId}`, JSON.stringify(notes));
  }, [notes, documentId]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = window.setInterval(() => {
        if (currentIndex < total - (isSinglePage ? 1 : 2)) {
          nextPage();
        } else {
          setIsAutoPlaying(false);
        }
      }, 3500);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlaying, currentIndex, isSinglePage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const nextPage = () => {
    if (isSinglePage) {
      if (currentIndex < total - 1) setCurrentIndex(prev => prev + 1);
    } else {
      if (currentIndex + 2 < total) setCurrentIndex(prev => prev + 2);
      else if (currentIndex + 1 < total) setCurrentIndex(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (isSinglePage) {
      if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    } else {
      if (currentIndex >= 2) setCurrentIndex(prev => prev - 2);
      else if (currentIndex > 0) setCurrentIndex(0);
    }
  };

  const jumpToPage = (index: number) => {
    const target = isSinglePage ? index : (index % 2 === 0 ? index : index - 1);
    setCurrentIndex(Math.max(0, Math.min(target, total - 1)));
    setShowThumbs(false);
  };

  const handleNoteSave = (val: string) => {
    if (activeNotePage !== null) {
      setNotes(prev => ({ ...prev, [activeNotePage]: val }));
      setActiveNotePage(null);
    }
  };

  const showDouble = !isSinglePage && total > 1;

  const filteredPages = useMemo(() => {
    if (!searchQuery) return [];
    return pages.map((_, i) => i + 1).filter(num => num.toString().includes(searchQuery));
  }, [searchQuery, pages]);

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-full flex flex-col bg-[#060913] overflow-hidden transition-all duration-300
        ${isFullscreen ? 'h-screen' : 'h-[800px] rounded-[3rem] shadow-2xl border border-white/5'}
      `}
    >
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 bg-black/40 backdrop-blur-3xl px-6 py-3 rounded-full border border-white/10 shadow-2xl text-white">
        <button 
          onClick={() => setIsSinglePage(!isSinglePage)}
          className={`p-2 rounded-xl transition-all ${isSinglePage ? 'bg-indigo-600' : 'hover:bg-white/10'}`}
          title="Toggle Spread"
        >
          {isSinglePage ? <Square className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`p-2 rounded-xl transition-all ${isAutoPlaying ? 'bg-green-600' : 'hover:bg-white/10'}`}
          title="Auto-Flip"
        >
          {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setShowThumbs(!showThumbs)}
          className={`p-2 rounded-xl transition-all ${showThumbs ? 'bg-indigo-600' : 'hover:bg-white/10'}`}
          title="Thumbnails"
        >
          <Grid className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-white/20 mx-2" />

        <div className="flex items-center space-x-3">
          <ZoomIn className="w-4 h-4 opacity-50" />
          <input 
            type="range" min="1" max="2.5" step="0.1" value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer"
          />
        </div>

        <div className="h-6 w-px bg-white/20 mx-2" />

        <button onClick={toggleFullscreen} className="p-2 rounded-xl hover:bg-white/10">
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center relative px-8 overflow-hidden group">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-8 pointer-events-none z-40 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={prevPage}
            disabled={currentIndex <= 0}
            className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 disabled:opacity-0 transition-all active:scale-95 shadow-2xl"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button 
            onClick={nextPage}
            disabled={currentIndex >= total - (showDouble ? 2 : 1)}
            className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-2xl border border-white/20 text-white hover:bg-white/20 disabled:opacity-0 transition-all active:scale-95 shadow-2xl"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>

        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-500 ease-out gap-1"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className={`relative transition-all duration-700 ${showDouble ? 'w-1/2 h-full' : 'w-full h-full'} flex items-center justify-center`}>
            <img 
              src={pages[currentIndex]} 
              className="max-w-full max-h-[80%] object-contain rounded shadow-2xl bg-white"
              alt={`Page ${currentIndex + 1}`}
            />
            {showDouble && <div className="absolute top-[10%] bottom-[10%] right-0 w-32 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />}
            
            <button 
              onClick={() => setActiveNotePage(currentIndex)}
              className="absolute top-[12%] left-[12%] p-2 bg-yellow-400 text-black rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Add Note"
            >
              <StickyNote className={`w-5 h-5 ${notes[currentIndex] ? 'fill-black' : ''}`} />
            </button>
          </div>

          {showDouble && (
            <div className="w-1/2 h-full relative flex items-center justify-center">
              {currentIndex + 1 < total ? (
                <>
                  <img 
                    src={pages[currentIndex + 1]} 
                    className="max-w-full max-h-[80%] object-contain rounded shadow-2xl bg-white"
                    alt={`Page ${currentIndex + 2}`}
                  />
                  <div className="absolute top-[10%] bottom-[10%] left-0 w-32 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                  <button 
                    onClick={() => setActiveNotePage(currentIndex + 1)}
                    className="absolute top-[12%] right-[12%] p-2 bg-yellow-400 text-black rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Add Note"
                  >
                    <StickyNote className={`w-5 h-5 ${notes[currentIndex + 1] ? 'fill-black' : ''}`} />
                  </button>
                </>
              ) : (
                <div className="w-full h-[80%] flex items-center justify-center bg-white/5 rounded-lg border border-white/10 border-dashed">
                  <span className="text-white/20 font-black uppercase text-xs tracking-widest">End of file</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-8 flex items-center justify-between z-50">
        <div className="flex items-center space-x-6">
          <div className="bg-white/10 px-6 py-2 rounded-full border border-white/10 text-white text-xs font-black uppercase tracking-widest">
            Page {currentIndex + 1} {showDouble && currentIndex + 2 <= total && `& ${currentIndex + 2}`} / {total}
          </div>
          
          <div className="flex items-center space-x-3 text-white/40">
            <SlidersHorizontal className="w-4 h-4" />
            <input 
              type="range" min="0" max={total - 1} value={currentIndex}
              onChange={(e) => jumpToPage(parseInt(e.target.value))}
              className="w-48 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-indigo-400" />
          <input 
            type="text" placeholder="Go to page..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/10 border border-white/10 rounded-full py-3 pl-12 pr-6 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all w-48 focus:w-64"
          />
          {searchQuery && (
             <div className="absolute bottom-full mb-4 right-0 w-64 bg-slate-900 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">Matches</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {filteredPages.length > 0 ? filteredPages.map(p => (
                    <button 
                      key={p} onClick={() => { jumpToPage(p - 1); setSearchQuery(''); }}
                      className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 rounded-xl font-bold transition-colors"
                    >
                      Page {p}
                    </button>
                  )) : <div className="p-4 text-xs text-white/20 italic">No results</div>}
                </div>
             </div>
          )}
        </div>
      </div>

      {activeNotePage !== null && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-yellow-200 p-8 rounded-[2.5rem] shadow-2xl w-96 relative rotate-1">
            <button onClick={() => setActiveNotePage(null)} className="absolute top-6 right-6 text-yellow-900/50 hover:text-yellow-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-yellow-900 font-black mb-6 uppercase tracking-widest text-xs opacity-50">Page {activeNotePage + 1} Annotation</h3>
            <textarea 
              autoFocus
              className="w-full h-48 bg-transparent border-none resize-none focus:ring-0 text-yellow-900 font-medium placeholder-yellow-900/30"
              placeholder="Start typing your thoughts here..."
              defaultValue={notes[activeNotePage] || ''}
              onBlur={(e) => handleNoteSave(e.target.value)}
            />
            <div className="mt-4 flex justify-between items-center text-[10px] font-black text-yellow-900/40 uppercase">
              <span>Saved Locally</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`
        absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-3xl border-t border-white/10 p-6 z-50 transition-all duration-500 transform
        ${showThumbs ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="flex items-center justify-between mb-4 px-4">
          <span className="text-white font-black uppercase text-[10px] tracking-widest opacity-40">Document Overview</span>
          <button onClick={() => setShowThumbs(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide px-4">
          {pages.map((p, i) => (
            <button 
              key={i} onClick={() => jumpToPage(i)}
              className={`flex-shrink-0 w-24 aspect-[3/4] bg-white rounded-xl overflow-hidden border-2 transition-all ${currentIndex === i ? 'border-indigo-500 scale-110 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
            >
              <img src={p} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
