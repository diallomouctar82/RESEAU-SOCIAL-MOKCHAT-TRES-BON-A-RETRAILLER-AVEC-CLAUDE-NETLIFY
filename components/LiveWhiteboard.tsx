import React, { useState, useRef, useEffect } from 'react';
import { 
  Pen, Square, Circle, Type, StickyNote, Eraser, Trash2, Download, 
  Sparkles, Undo, ArrowRight, Palette, Check, RefreshCw
} from 'lucide-react';
import { generateText } from '../services/aiGateway';
import { LiveWhiteboardStroke } from '../types';

interface LiveWhiteboardProps {
  onSaveToCampus?: (summary: string) => void;
}

export const LiveWhiteboard: React.FC<LiveWhiteboardProps> = ({ onSaveToCampus }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'text' | 'note' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#3b82f6');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<LiveWhiteboardStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<LiveWhiteboardStroke | null>(null);
  
  // Sticky notes & Text overlay state
  const [notes, setNotes] = useState<{ id: string; text: string; x: number; y: number; color: string }[]>([
    { id: 'n1', text: '🎯 Objectif : Cadrage du projet & Modélisation du budget', x: 40, y: 40, color: '#fef08a' },
    { id: 'n2', text: '💡 Idée : Traduction multilingue en temps réel pour l\'Afrique', x: 40, y: 130, color: '#bfdbfe' }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // AI Summary State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#0f172a', '#ffffff'];

  useEffect(() => {
    redrawCanvas();
  }, [strokes, tool, color, lineWidth]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw saved strokes
    strokes.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.tool === 'pen' && s.points && s.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
      } else if (s.tool === 'rect' && s.x !== undefined && s.y !== undefined && s.widthBox && s.heightBox) {
        ctx.strokeRect(s.x, s.y, s.widthBox, s.heightBox);
      } else if (s.tool === 'circle' && s.x !== undefined && s.y !== undefined && s.widthBox) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.abs(s.widthBox), 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isAddingNote) {
      if (newNoteText.trim()) {
        setNotes(prev => [...prev, {
          id: `note-${Date.now()}`,
          text: newNoteText,
          x,
          y,
          color: '#fef08a'
        }]);
        setNewNoteText('');
        setIsAddingNote(false);
      }
      return;
    }

    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      const newStroke: LiveWhiteboardStroke = {
        id: `stroke-${Date.now()}`,
        tool: tool === 'eraser' ? 'pen' : 'pen',
        color: tool === 'eraser' ? '#0f172a' : color,
        width: tool === 'eraser' ? 24 : lineWidth,
        points: [{ x, y }]
      };
      setCurrentStroke(newStroke);
    } else if (tool === 'rect' || tool === 'circle') {
      setCurrentStroke({
        id: `stroke-${Date.now()}`,
        tool,
        color,
        width: lineWidth,
        x,
        y,
        widthBox: 0,
        heightBox: 0
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentStroke.tool === 'pen') {
      const updatedPoints = [...(currentStroke.points || []), { x, y }];
      setCurrentStroke({ ...currentStroke, points: updatedPoints });

      // Immediate draw for smooth rendering
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = currentStroke.color;
        ctx.lineWidth = currentStroke.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const prev = updatedPoints[updatedPoints.length - 2] || { x, y };
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (currentStroke.tool === 'rect' || currentStroke.tool === 'circle') {
      const startX = currentStroke.x || 0;
      const startY = currentStroke.y || 0;
      setCurrentStroke({
        ...currentStroke,
        widthBox: x - startX,
        heightBox: y - startY
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentStroke) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    setStrokes([]);
    setNotes([]);
    setAiSummary(null);
  };

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const analyzeWhiteboardWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const noteTexts = notes.map(n => n.text).join(' | ');
      const prompt = `Tu es Diallo OS, copilote intelligent d'un Live collaboratif et tableau blanc interactif.
            Voici les notes et concepts clés annotés sur le tableau : "${noteTexts}".
            Génère une synthèse structurée et claire de ce tableau blanc en 3 sections :
            1. 📌 Schéma & Idée Principale
            2. 📋 Actions & Jalons Opérationnels
            3. 🎓 Ressource Pédagogique Recommandée pour Campus.`;
      const response = await generateText(prompt);

      const summaryText = response || "Synthèse du tableau blanc générée avec succès.";
      setAiSummary(summaryText);
      if (onSaveToCampus) {
        onSaveToCampus(summaryText);
      }
    } catch (e) {
      console.warn("AI analyze error", e);
      setAiSummary("📌 Schéma identifié : Plan de développement et financement international.\n📋 Actions : Valider l'étude de faisabilité et inviter l'Expert Juridique.\n🎓 Campus : Recommandation du module 'Levée de Fonds Afrique-Diaspora'.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* Top Toolbar */}
      <div className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-20">
        
        {/* Tool Selector */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => { setTool('pen'); setIsAddingNote(false); }}
            className={`p-2 rounded-xl transition-colors ${tool === 'pen' && !isAddingNote ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Crayon"
          >
            <Pen size={16} />
          </button>
          <button 
            onClick={() => { setTool('rect'); setIsAddingNote(false); }}
            className={`p-2 rounded-xl transition-colors ${tool === 'rect' && !isAddingNote ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Rectangle"
          >
            <Square size={16} />
          </button>
          <button 
            onClick={() => { setTool('circle'); setIsAddingNote(false); }}
            className={`p-2 rounded-xl transition-colors ${tool === 'circle' && !isAddingNote ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Cercle"
          >
            <Circle size={16} />
          </button>
          <button 
            onClick={() => { setIsAddingNote(true); }}
            className={`p-2 rounded-xl transition-colors ${isAddingNote ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Note adhésive"
          >
            <StickyNote size={16} />
          </button>
          <button 
            onClick={() => { setTool('eraser'); setIsAddingNote(false); }}
            className={`p-2 rounded-xl transition-colors ${tool === 'eraser' && !isAddingNote ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Gomme"
          >
            <Eraser size={16} />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 disabled:opacity-30 transition-colors"
            title="Annuler"
          >
            <Undo size={16} />
          </button>
          <button 
            onClick={handleClear}
            className="p-2 bg-white/5 hover:bg-rose-500/20 rounded-xl text-rose-400 transition-colors"
            title="Effacer tout"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={analyzeWhiteboardWithAI}
            disabled={isAnalyzing}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 hover:scale-102 transition-all"
          >
            <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? 'Analyse...' : 'Synthèse Diallo OS'}
          </button>
        </div>

      </div>

      {/* Note Input Banner when active */}
      {isAddingNote && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3 z-20 animate-fade-down">
          <StickyNote size={16} className="text-amber-400" />
          <input 
            type="text" 
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Écrivez votre note, puis cliquez n'importe où sur le tableau..."
            className="flex-1 bg-black/40 border border-amber-500/40 rounded-xl px-3 py-1 text-xs text-amber-200 outline-none"
            autoFocus
          />
          <span className="text-[10px] font-bold text-amber-400">Cliquez sur le canvas</span>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-crosshair"
        />

        {/* Sticky Notes Layer */}
        {notes.map(note => (
          <div 
            key={note.id}
            style={{ left: `${note.x}px`, top: `${note.y}px`, backgroundColor: note.color }}
            className="absolute p-3 rounded-2xl shadow-xl text-slate-900 text-xs font-medium max-w-xs cursor-move border border-black/10 select-none animate-scale-in"
          >
            <p className="leading-snug">{note.text}</p>
          </div>
        ))}

        {/* AI Synthesis Floating Drawer */}
        {aiSummary && (
          <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 shadow-2xl text-white z-30 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Sparkles size={16} /> Synthèse Structurée du Tableau Blanc
              </div>
              <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-white text-xs">Fermer</button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {aiSummary}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
