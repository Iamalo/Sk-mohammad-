
import React, { useEffect, useState } from 'react';
import { getAllFlipbooks, deleteFlipbook, SavedFlipbook } from '../services/storageService';
import { generateFlipbookHtml } from '../services/downloadService';
import { Trash2, BookOpen, Clock, Download, ExternalLink, Library as LibraryIcon, ArrowLeft, MoreVertical } from 'lucide-react';

interface LibraryProps {
  onOpen: (flipbook: SavedFlipbook) => void;
  onClose: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onOpen, onClose }) => {
  const [items, setItems] = useState<SavedFlipbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    try {
      const books = await getAllFlipbooks();
      setItems(books.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Permanently remove this from your collection?')) {
      await deleteFlipbook(id);
      loadLibrary();
    }
  }

  const handleDownload = (book: SavedFlipbook, e: React.MouseEvent) => {
    e.stopPropagation();
    const html = generateFlipbookHtml(book.pages, book.title);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.title.replace(/\.[^/.]+$/, "") || 'flipbook'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-4">
          <button 
            onClick={onClose}
            className="group flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Creator</span>
          </button>
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
              <LibraryIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Collection</h2>
              <p className="text-slate-500 font-medium">Your private vault of interactive publications</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest">
            {items.length} {items.length === 1 ? 'Publication' : 'Publications'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Storage...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-40 text-center space-y-8 shadow-sm">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-8 ring-white shadow-inner">
            <BookOpen className="w-12 h-12 text-slate-300" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-900">Your library is empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">Create your first flipbook or album to see it appear here in your local collection.</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Start Creating Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 pb-20">
          {items.map((book) => (
            <div 
              key={book.id}
              onClick={() => onOpen(book)}
              className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer"
            >
              <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                <img 
                  src={book.pages[0]} 
                  alt={book.title}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                   <div className="flex flex-col items-center space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white font-black uppercase tracking-widest text-xs">Open Publication</span>
                   </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                   <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 uppercase shadow-sm border border-white">
                      {book.pages.length} Pages
                   </div>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-grow flex flex-col">
                <div className="space-y-1 flex-grow">
                  <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{book.title}</h3>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <button 
                      onClick={(e) => handleDownload(book, e)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 py-3 rounded-xl transition-all font-bold text-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download HTML</span>
                    </button>
                    <button 
                      onClick={(e) => handleDelete(book.id, e)}
                      className="ml-2 p-3 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
