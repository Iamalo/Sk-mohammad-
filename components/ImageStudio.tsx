
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, Type, Square, Circle, Sparkles, Sun, 
  Contrast, Droplets, Target, Trash2, Plus, 
  Layers, Move, Palette, Sliders, ChevronDown,
  MousePointer2, Undo2, Redo2, Image as ImageIcon,
  Type as TextIcon, Shapes, Heart, Star, GripHorizontal,
  Layout, Search, Upload, Info, Maximize2, Minimize2
} from 'lucide-react';

interface Element {
  id: string;
  type: 'text' | 'shape' | 'decoration';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  fontSize?: number;
  shapeType?: 'rect' | 'circle' | 'star' | 'heart';
}

interface ImageStudioProps {
  initialImage: string;
  isDesignMode?: boolean;
  onCancel: () => void;
  onFinish: (updatedImage: string) => void;
}

// Fix: Added missing SidebarTab component definition for navigating studio categories
const SidebarTab = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-4 space-y-1.5 transition-all relative ${active ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    {active && <div className="absolute bottom-0 inset-x-4 h-1 bg-indigo-600 rounded-full" />}
  </button>
);

// Fix: Added missing AdjustmentSlider component definition for photo filters
const AdjustmentSlider = ({ label, value, onChange, icon, max = 200 }: { label: string, value: number, onChange: (v: number) => void, icon: React.ReactNode, max?: number }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-slate-600">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400">{value}%</span>
    </div>
    <input 
      type="range" min="0" max={max} value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
    />
  </div>
);

export const ImageStudio: React.FC<ImageStudioProps> = ({ initialImage, isDesignMode = false, onCancel, onFinish }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'templates' | 'elements' | 'uploads' | 'text' | 'adjust'>(isDesignMode ? 'elements' : 'adjust');
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = initialImage;
    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 1600;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Base Image with Filters
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, 1200, 1600);
      ctx.restore();

      // Draw Elements
      elements.forEach(el => {
        ctx.fillStyle = el.color || '#4f46e5';
        if (el.type === 'shape' || el.type === 'decoration') {
          if (el.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(el.x + el.width/2, el.y + el.height/2, el.width/2, 0, Math.PI * 2);
            ctx.fill();
          } else if (el.shapeType === 'star') {
             drawStar(ctx, el.x + el.width/2, el.y + el.height/2, 5, el.width/2, el.width/4);
          } else if (el.shapeType === 'heart') {
             drawHeart(ctx, el.x, el.y, el.width, el.height);
          } else {
            ctx.fillRect(el.x, el.y, el.width, el.height);
          }
        } else if (el.type === 'text') {
          ctx.font = `bold ${el.fontSize}px Inter, sans-serif`;
          ctx.fillText(el.content || '', el.x, el.y + (el.fontSize || 80));
        }
      });
    };
  }, [initialImage, brightness, contrast, saturation, blur, elements]);

  function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const topCurveHeight = h * 0.3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.7);
    ctx.bezierCurveTo(x + w / 2, y + h * 0.7, x + w / 2 - w / 2, y + h * 0.7 - topCurveHeight, x + w / 2 - w / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + w / 2 - w / 2, y, x + w / 2, y, x + w / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + w / 2, y, x + w / 2 + w / 2, y, x + w / 2 + w / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + w / 2 + w / 2, y + h * 0.7 - topCurveHeight, x + w / 2, y + h * 0.7, x + w / 2, y + h * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const addElement = (type: 'text' | 'shape' | 'decoration', shapeType?: Element['shapeType']) => {
    const newEl: Element = {
      id: crypto.randomUUID(),
      type,
      x: 300,
      y: 400,
      width: type === 'text' ? 600 : 200,
      height: type === 'text' ? 100 : 200,
      content: type === 'text' ? 'New Design Text' : '',
      color: type === 'text' ? '#000000' : '#6366f1',
      shapeType: shapeType || 'rect',
      fontSize: 80
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    const el = elements.find(item => item.id === id);
    if (!el || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 1600 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    setDragOffset({ x: mouseX - el.x, y: mouseY - el.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 1600 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y } : el));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onFinish(canvas.toDataURL('image/png'));
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="fixed inset-0 z-[100] bg-[#f0f2f5] flex flex-col md:flex-row overflow-y-auto select-none">
      {/* 1. Left Sidebar (Asset Library) */}
      <div className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto min-h-screen md:h-screen sticky top-0">
        <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
          <SidebarTab active={activeSidebarTab === 'templates'} icon={<Layout />} label="Templates" onClick={() => setActiveSidebarTab('templates')} />
          <SidebarTab active={activeSidebarTab === 'elements'} icon={<Shapes />} label="Elements" onClick={() => setActiveSidebarTab('elements')} />
          <SidebarTab active={activeSidebarTab === 'text'} icon={<TextIcon />} label="Text" onClick={() => setActiveSidebarTab('text')} />
          <SidebarTab active={activeSidebarTab === 'adjust'} icon={<Sliders />} label="Adjust" onClick={() => setActiveSidebarTab('adjust')} />
        </div>

        <div className="p-4 flex-grow space-y-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search assets..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>

          {activeSidebarTab === 'templates' && (
             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library Templates</h4>
               <div className="grid grid-cols-2 gap-2">
                 {[1,2,3,4,5,6,7,8].map(i => (
                   <div key={i} className="aspect-[3/4] bg-slate-100 rounded-lg hover:ring-2 ring-indigo-500 cursor-pointer overflow-hidden border border-slate-200">
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeSidebarTab === 'elements' && (
             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shapes & Decorations</h4>
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => addElement('shape', 'rect')} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-white flex flex-col items-center space-y-2 transition-all">
                   <Square className="w-6 h-6 text-slate-600" />
                   <span className="text-[10px] font-bold">Rectangle</span>
                 </button>
                 <button onClick={() => addElement('shape', 'circle')} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-white flex flex-col items-center space-y-2 transition-all">
                   <Circle className="w-6 h-6 text-slate-600" />
                   <span className="text-[10px] font-bold">Circle</span>
                 </button>
                 <button onClick={() => addElement('decoration', 'star')} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-white flex flex-col items-center space-y-2 transition-all">
                   <Star className="w-6 h-6 text-slate-600" />
                   <span className="text-[10px] font-bold">Star</span>
                 </button>
                 <button onClick={() => addElement('decoration', 'heart')} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-white flex flex-col items-center space-y-2 transition-all">
                   <Heart className="w-6 h-6 text-slate-600" />
                   <span className="text-[10px] font-bold">Heart</span>
                 </button>
               </div>
             </div>
          )}

          {activeSidebarTab === 'text' && (
             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Typography</h4>
               <button onClick={() => addElement('text')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2">
                 <Plus className="w-4 h-4" />
                 <span>Add Heading</span>
               </button>
             </div>
          )}

          {activeSidebarTab === 'adjust' && (
             <div className="space-y-6">
                <AdjustmentSlider label="Brightness" value={brightness} onChange={setBrightness} icon={<Sun />} />
                <AdjustmentSlider label="Contrast" value={contrast} onChange={setContrast} icon={<Contrast />} />
                <AdjustmentSlider label="Saturation" value={saturation} onChange={setSaturation} icon={<Droplets />} />
                <AdjustmentSlider label="Blur" value={blur} max={20} onChange={setBlur} icon={<Target />} />
             </div>
          )}
        </div>
      </div>

      {/* 2. Main Stage (Canvas) */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-6">
             <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
               <X className="w-6 h-6" />
             </button>
             <div className="h-6 w-px bg-slate-200" />
             <div className="flex items-center space-x-2 text-slate-400">
                <Undo2 className="w-4 h-4 cursor-not-allowed opacity-30" />
                <Redo2 className="w-4 h-4 cursor-not-allowed opacity-30" />
             </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500">
               <span className="uppercase">Zoom</span>
               <input type="range" min="0.1" max="1.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-16 accent-indigo-500" />
             </div>
             <button onClick={handleExport} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center space-x-2">
               <Check className="w-4 h-4" />
               <span>Done Editing</span>
             </button>
          </div>
        </div>

        <div className="flex-grow bg-[#f0f2f5] overflow-auto flex items-center justify-center p-12">
          <div 
            ref={stageRef}
            className="relative bg-white shadow-2xl transition-all"
            style={{ 
              width: '1200px', 
              height: '1600px',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            
            {/* Interactive Overlay Elements */}
            <div className="absolute inset-0">
               {elements.map(el => (
                 <div 
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    className={`absolute cursor-move border-2 transition-colors ${selectedId === el.id ? 'border-indigo-500' : 'border-transparent hover:border-indigo-200'}`}
                    style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                 >
                   {el.type === 'text' && (
                     <textarea 
                        className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 font-bold overflow-hidden"
                        style={{ color: el.color, fontSize: `${el.fontSize}px`, lineHeight: 1.1 }}
                        value={el.content}
                        onChange={(e) => setElements(prev => prev.map(item => item.id === el.id ? { ...item, content: e.target.value } : item))}
                     />
                   )}
                   {selectedId === el.id && (
                     <div className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer" onClick={() => setElements(prev => prev.filter(i => i.id !== el.id))}>
                       <Trash2 className="w-3 h-3" />
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Right Sidebar (Properties) */}
      <div className="w-full md:w-80 bg-white border-l border-slate-200 shrink-0 h-screen overflow-y-auto hidden lg:block">
        <div className="p-6 space-y-8">
           {selectedElement ? (
             <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Layer Properties</h3>
                  <button onClick={() => setSelectedId(null)}><X className="w-4 h-4 text-slate-300" /></button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Object Color</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['#000000', '#ffffff', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#475569'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, color: c } : el))}
                        className={`w-8 h-8 rounded-lg border border-slate-100 ${selectedElement.color === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Size</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" min="10" max="300" 
                        value={selectedElement.fontSize} 
                        onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: parseInt(e.target.value) } : el))}
                        className="flex-grow accent-indigo-500" 
                      />
                      <span className="text-xs font-bold text-slate-600 min-w-[3ch]">{selectedElement.fontSize}</span>
                    </div>
                  </div>
                )}
             </div>
           ) : (
             <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <MousePointer2 className="w-10 h-10" />
                <p className="text-xs font-black uppercase tracking-widest">Select an element<br/>to edit properties</p>
             </div>
           )}
           
           <div className="h-px bg-slate-100 my-8" />

           <div className="space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Smart Designer</h3>
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                 <div className="flex items-center space-x-2 text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">AI Suggestions</span>
                 </div>
                 <p className="text-[11px] text-slate-600 leading-relaxed">Try using high contrast colors for your cover text to make it stand out.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
