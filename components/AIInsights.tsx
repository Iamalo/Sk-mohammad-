
import React from 'react';
import { Sparkles, BrainCircuit, Hash, Palette, Loader2, Info } from 'lucide-react';
import { PdfMetadata } from '../App';

interface AIInsightsProps {
  isAnalyzing: boolean;
  metadata: PdfMetadata | null;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ isAnalyzing, metadata }) => {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="flex items-center space-x-3 text-indigo-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <h2 className="text-xl font-bold">Analyzing Content...</h2>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
          <div className="pt-4 flex space-x-2">
             <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse"></div>
             <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[700px]">
      <div className="p-6 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-700">
            <BrainCircuit className="w-5 h-5" />
            <h2 className="text-lg font-bold">AI Insights</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">Gemini Powered</span>
        </div>
      </div>

      <div className="p-6 overflow-y-auto space-y-8">
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-800">
            <Info className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm">Executive Summary</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "{metadata.summary}"
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-800">
            <Hash className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-sm">Key Concepts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {metadata.keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-xs font-medium">
                #{kw}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-800">
            <Palette className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm">Suggested Theme</h3>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full shadow-inner ${metadata.suggestedTheme === 'Corporate' ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
            <div>
              <p className="text-sm font-bold text-slate-800">{metadata.suggestedTheme}</p>
              <p className="text-[10px] text-slate-400">Optimized for readability</p>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50">
        <button className="w-full flex items-center justify-center space-x-2 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all font-semibold text-sm shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>Regenerate Insights</span>
        </button>
      </div>
    </div>
  );
};
