
import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadZone } from './components/UploadZone';
import { FlipbookViewer } from './components/FlipbookViewer';
import { AIInsights } from './components/AIInsights';
import { Library } from './components/Library';
import { ImageStudio } from './components/ImageStudio';
import { analyzePdfContent } from './services/geminiService';
import { renderPdfToImages } from './services/pdfService';
import { processImagesToDataUrls } from './services/imageService';
import { generateFlipbookHtml } from './services/downloadService';
import { saveFlipbook, SavedFlipbook } from './services/storageService';
import { 
  Sparkles, Download, ArrowLeft, ArrowRight, Loader2, 
  Save, FileText, Images, Edit3, CheckCircle2,
  LayoutGrid, Book
} from 'lucide-react';

export interface PdfMetadata {
  title: string;
  summary: string;
  keywords: string[];
  suggestedTheme: string;
}

export type AppView = 'home' | 'viewer' | 'library' | 'image-studio' | 'selection-grid';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [fileLabel, setFileLabel] = useState<string>('');
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);

  const handlePdfUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      setFileLabel(files[0].name);
      const images = await renderPdfToImages(files[0]);
      setPageImages(images);
      setView('selection-grid');
    } catch (error) {
      console.error("PDF Processing failed", error);
      alert("Failed to process PDF.");
      setView('home');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleImageUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const images = await processImagesToDataUrls(files);
      setPageImages(images);
      setFileLabel(`Collection of ${files.length} images`);
      setView('selection-grid');
    } catch (error) {
      console.error("Image Processing failed", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setView('image-studio');
  };

  const handleFinishPageEdit = (updatedImage: string) => {
    if (editingIndex !== null) {
      const newImages = [...pageImages];
      newImages[editingIndex] = updatedImage;
      setPageImages(newImages);
    }
    setEditingIndex(null);
    setView('selection-grid');
  };

  const finalizeFlipbook = async () => {
    setIsAnalyzing(true);
    setView('viewer');
    try {
      const aiData = await analyzePdfContent(fileLabel);
      setMetadata(aiData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToCollection = async () => {
    const newBook: SavedFlipbook = {
      id: crypto.randomUUID(),
      title: fileLabel || 'Untitled Flipbook',
      pages: pageImages,
      createdAt: Date.now(),
      summary: metadata?.summary
    };
    await saveFlipbook(newBook);
    alert('Saved to library!');
  };

  const goToHome = () => {
    setView('home');
    setFileLabel('');
    setPageImages([]);
    setMetadata(null);
  };

  const handleDownload = () => {
    const html = generateFlipbookHtml(pageImages, fileLabel || 'My Flipbook');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileLabel.replace(/\.[^/.]+$/, "") || 'flipbook'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdff] text-slate-900">
      <Header onLibraryClick={() => setView('library')} onHomeClick={goToHome} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {view === 'home' && !isProcessing && (
          <div className="flex flex-col space-y-24 pt-8 animate-in fade-in duration-700">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Publishing Studio</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                Interactive <span className="text-indigo-600">Flipbooks</span><br/>Simplified.
              </h1>
              <p className="text-xl text-slate-500 font-medium">Upload, customize your cover like Canva, and export as interactive HTML.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600">
                  <FileText className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black">PDF To Book</h2>
                <UploadZone onUpload={handlePdfUpload} accept="application/pdf" label="Drop PDF" />
              </div>
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600">
                  <Images className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black">Image Gallery</h2>
                <UploadZone onUpload={handleImageUpload} accept="image/*" label="Drop Images" multiple />
              </div>
            </div>
          </div>
        )}

        {view === 'selection-grid' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div>
                 <h2 className="text-3xl font-black tracking-tight">Project Dashboard</h2>
                 <p className="text-slate-500">Edit pages individually or design your cover.</p>
               </div>
               <button onClick={finalizeFlipbook} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center space-x-3">
                 <span>Preview Flipbook</span>
                 <ArrowRight className="w-4 h-4" />
               </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {pageImages.map((img, idx) => (
                <div key={idx} className="group relative aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 hover:shadow-2xl transition-all">
                  <img src={img} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                    <button onClick={() => startEditing(idx)} className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center space-x-2">
                      <Edit3 className="w-3 h-3" />
                      <span>{idx === 0 || idx === pageImages.length - 1 ? 'Design' : 'Edit'}</span>
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-lg backdrop-blur-md">
                    {idx === 0 ? 'COVER' : idx === pageImages.length - 1 ? 'BACK' : `PAGE ${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'image-studio' && editingIndex !== null && (
          <ImageStudio 
            initialImage={pageImages[editingIndex]} 
            isDesignMode={editingIndex === 0 || editingIndex === pageImages.length - 1}
            onCancel={() => setView('selection-grid')} 
            onFinish={handleFinishPageEdit} 
          />
        )}

        {view === 'viewer' && !isProcessing && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex flex-wrap items-center justify-between gap-4">
                <button onClick={() => setView('selection-grid')} className="flex items-center space-x-3 text-slate-400 hover:text-indigo-600 font-black uppercase text-xs tracking-widest">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Editor</span>
                </button>
                <div className="flex items-center space-x-4">
                  <button onClick={handleSaveToCollection} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center space-x-2">
                    <Save className="w-4 h-4" /> <span>Save</span>
                  </button>
                  <button onClick={handleDownload} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center space-x-2 shadow-lg">
                    <Download className="w-4 h-4" /> <span>Export HTML</span>
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                   <FlipbookViewer pages={pageImages} />
                </div>
                <div className="space-y-8">
                   <AIInsights isAnalyzing={isAnalyzing} metadata={metadata} />
                </div>
             </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Processing Assets...</p>
          </div>
        )}

        {view === 'library' && <Library onOpen={(b) => { setPageImages(b.pages); setFileLabel(b.title); setView('viewer'); }} onClose={goToHome} />}
      </main>

      <Footer />
    </div>
  );
}
