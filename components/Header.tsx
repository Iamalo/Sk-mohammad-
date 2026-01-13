import React from 'react';
import { BookText, Library } from 'lucide-react';

interface HeaderProps {
  onLibraryClick?: () => void;
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLibraryClick, onHomeClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={onHomeClick}
          className="flex items-center space-x-2 group"
        >
          <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <BookText className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            FlipGem AI
          </span>
        </button>
        
        <nav className="flex items-center space-x-6 md:space-x-8">
          <button 
            onClick={onHomeClick}
            className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Home
          </button>
          <button 
            onClick={onLibraryClick}
            className="flex items-center space-x-2 text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <Library className="w-4 h-4" />
            <span>My Collection</span>
          </button>
        </nav>
      </div>
    </header>
  );
};