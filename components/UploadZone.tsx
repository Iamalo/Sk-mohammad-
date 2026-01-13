
import React, { useState, useRef } from 'react';
import { Upload, FileText, Images, Plus } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  label?: string;
  multiple?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onUpload, 
  accept = "*", 
  label = "Upload File",
  multiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file: File) => {
      if (accept === "application/pdf") return file.type === "application/pdf";
      if (accept === "image/*") return file.type.startsWith("image/");
      return true;
    });
    if (files.length > 0) onUpload(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(Array.from(files));
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all duration-500
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-2xl' 
            : 'border-slate-200 bg-slate-50/30 hover:border-indigo-300 hover:bg-white hover:shadow-xl'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-6">
          <div className={`
            w-20 h-20 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 shadow-inner
            ${isDragging ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-500'}
          `}>
            {accept === "application/pdf" ? <FileText className="w-10 h-10" /> : <Plus className="w-10 h-10" />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {label}
            </h3>
            <p className="text-slate-400 font-medium text-sm">
              Click or drag and drop to start
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
             <Upload className="w-3 h-3" />
             <span>Secure Browser Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
