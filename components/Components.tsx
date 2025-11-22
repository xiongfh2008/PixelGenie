
import React, { useState, useRef, useEffect } from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  loading = false, 
  icon,
  className = "", 
  disabled,
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-500 text-white focus:ring-primary-500 shadow-lg shadow-primary-900/20 border border-transparent",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-500 border border-slate-700",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="mr-2" /> : icon ? <span className="mr-2">{icon}</span> : null}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = "", title, action }) => (
  <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-xl ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-slate-700 text-slate-300" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

export const Slider: React.FC<{ 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  onChange: (val: number) => void;
  label?: string;
  suffix?: string;
  className?: string;
}> = ({ value, min, max, step, onChange, label, suffix, className = "" }) => (
  <div className={`w-full ${className}`}>
    {label && (
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm text-primary-400 font-mono">{value}{suffix}</span>
      </div>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400"
    />
  </div>
);

export const SidebarItem: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  description?: string;
}> = ({ active, onClick, icon, label, description }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-4 group ${
      active 
        ? 'bg-primary-600/10 border border-primary-600/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
        : 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700'
    }`}
  >
    <div className={`p-2 rounded-lg transition-colors ${
      active ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
    }`}>
      {icon}
    </div>
    <div>
      <div className={`font-semibold text-sm ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
        {label}
      </div>
      {description && (
        <div className="text-xs text-slate-500 leading-tight mt-0.5">{description}</div>
      )}
    </div>
  </button>
);

export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
  <div className="relative flex items-center group cursor-help">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-3 bg-slate-800 text-xs text-slate-200 rounded-lg shadow-xl border border-slate-700 z-50 text-center leading-relaxed">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700"></div>
    </div>
  </div>
);

export const CompareSlider: React.FC<{ before: string; after: string; className?: string }> = ({ before, after, className="" }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
    } else {
      clientX = event.clientX;
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPos(percentage);
  };

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging.current) {
         // @ts-ignore
         handleMove(e);
      }
    };
    const handleGlobalUp = () => { isDragging.current = false; };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg select-none cursor-ew-resize group ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Background - Right Side) */}
      <img src={after} alt="After" className="w-full h-full object-fill block" draggable={false} />
      
      {/* Before Image (Foreground - Left Side - Clipped) */}
      <img 
        src={before} 
        alt="Before" 
        className="absolute top-0 left-0 w-full h-full object-fill block" 
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      />

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      </div>
      
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white pointer-events-none backdrop-blur-sm">Before</div>
      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white pointer-events-none backdrop-blur-sm">After</div>
    </div>
  );
};

export type BrushTool = 'brush' | 'rect' | 'lasso' | 'eraser';

export const BrushCanvas: React.FC<{ 
  width: number; 
  height: number; 
  onDrawEnd: (dataUrl: string) => void;
  className?: string;
  tool?: BrushTool;
  brushSize?: number;
}> = ({ width, height, onDrawEnd, className = "", tool = 'brush', brushSize = 20 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  
  // For Shapes (Rect, Lasso)
  const startPos = useRef<{x: number, y: number} | null>(null);
  const snapshot = useRef<ImageData | null>(null);
  const lassoPath = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [width, height]);

  // Utility to get scaled coordinates
  const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return { x: x * scaleX, y: y * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    isDrawing.current = true;
    setIsEmpty(false);
    
    const { x, y } = getCoords(e);
    startPos.current = { x, y };

    // Setup Context based on tool
    ctx.strokeStyle = '#FF0000'; // Solid Red for Opaque Masking
    ctx.fillStyle = '#FF0000';
    ctx.lineWidth = brushSize;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    if (tool === 'rect' || tool === 'lasso') {
      // Save snapshot for previewing shapes
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (tool === 'lasso') {
        lassoPath.current = [{x, y}];
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    } else {
      // Brush / Eraser
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'rect') {
      if (snapshot.current && startPos.current) {
         ctx.putImageData(snapshot.current, 0, 0);
         const w = x - startPos.current.x;
         const h = y - startPos.current.y;
         ctx.fillRect(startPos.current.x, startPos.current.y, w, h);
      }
    } else if (tool === 'lasso') {
      if (snapshot.current) {
        ctx.lineTo(x, y);
        ctx.stroke();
        lassoPath.current.push({x, y});
      }
    }
  };

  const stopDraw = () => {
    if (isDrawing.current && canvasRef.current) {
      isDrawing.current = false;
      const ctx = canvasRef.current.getContext('2d');
      
      // Finalize Shapes
      if (tool === 'lasso' && ctx && lassoPath.current.length > 2) {
         ctx.beginPath();
         ctx.moveTo(lassoPath.current[0].x, lassoPath.current[0].y);
         for(let i=1; i<lassoPath.current.length; i++) {
            ctx.lineTo(lassoPath.current[i].x, lassoPath.current[i].y);
         }
         ctx.closePath();
         ctx.fill(); // Fill the lasso shape
      }
      
      // Cleanup
      snapshot.current = null;
      startPos.current = null;
      lassoPath.current = [];
      
      onDrawEnd(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onDrawEnd(""); // Clear in parent
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`absolute top-0 left-0 w-full h-full touch-none z-10 ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      {!isEmpty && (
        <button 
          onClick={(e) => { e.stopPropagation(); clear(); }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-full shadow-lg transition-transform hover:scale-105"
        >
          Clear Mask
        </button>
      )}
    </div>
  );
};
