import React, { useState } from 'react';
import { VisualObject, AllowedAction, ShapeType } from '../../types/reasoning';
import { FrameCanvas } from '../../utils/svgShapes';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Undo2, RotateCcw as ResetIcon, Play, Plus, Trash2 } from 'lucide-react';

interface ReasoningCanvasProps {
  initialObjects: VisualObject[];
  targetObjects?: VisualObject[];
  allowedActions: AllowedAction[];
  onStateChange?: (objects: VisualObject[]) => void;
  onValidate?: (isMatch: boolean) => void;
  className?: string;
  readOnly?: boolean;
}

const PALETTE = ['#0E2235', '#C99543', '#718C7B', '#2B4C7E', '#B84A39', '#5C6B73'];

export const ReasoningCanvas: React.FC<ReasoningCanvasProps> = ({
  initialObjects,
  targetObjects,
  allowedActions,
  onStateChange,
  onValidate,
  className = '',
  readOnly = false,
}) => {
  const [objects, setObjects] = useState<VisualObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string | null>(initialObjects[0]?.id || null);
  const [history, setHistory] = useState<VisualObject[][]>([initialObjects]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [showTargetGhost, setShowTargetGhost] = useState(false);

  // Active object
  const activeObj = objects.find((o) => o.id === selectedId) || objects[0];

  const pushState = (newObjects: VisualObject[]) => {
    setObjects(newObjects);
    setHistory((prev) => [...prev, newObjects]);
    onStateChange?.(newObjects);
    checkMatch(newObjects);
  };

  const checkMatch = (current: VisualObject[]) => {
    if (!targetObjects || !onValidate) return;
    const isMatch = evaluateMatch(current, targetObjects);
    onValidate(isMatch);
  };

  const evaluateMatch = (current: VisualObject[], target: VisualObject[]): boolean => {
    if (current.length !== target.length) return false;
    // Compare geometric properties modulo 360
    return target.every((t) => {
      return current.some((c) => {
        const shapeMatch = c.shape === t.shape;
        const rotNormC = ((c.rotation % 360) + 360) % 360;
        const rotNormT = ((t.rotation % 360) + 360) % 360;
        const rotMatch = Math.abs(rotNormC - rotNormT) < 5;
        const flipXMatch = Boolean(c.reflectedX) === Boolean(t.reflectedX);
        const flipYMatch = Boolean(c.reflectedY) === Boolean(t.reflectedY);
        const colorMatch = !t.color || c.color.toLowerCase() === t.color.toLowerCase();
        const scaleMatch = Math.abs((c.scale || 1) - (t.scale || 1)) < 0.2;
        const posMatch = Math.abs(c.x - t.x) < 15 && Math.abs(c.y - t.y) < 15;
        return shapeMatch && rotMatch && flipXMatch && flipYMatch && colorMatch && scaleMatch && posMatch;
      });
    });
  };

  // Actions
  const handleRotate = (angleDelta: number) => {
    if (!activeObj) return;
    const updated = objects.map((obj) => {
      if (obj.id === activeObj.id) {
        const nextRotation = (obj.rotation + angleDelta + 360) % 360;
        return { ...obj, rotation: nextRotation };
      }
      return obj;
    });
    pushState(updated);
  };

  const handleReflectX = () => {
    if (!activeObj) return;
    const updated = objects.map((obj) => (obj.id === activeObj.id ? { ...obj, reflectedX: !obj.reflectedX } : obj));
    pushState(updated);
  };

  const handleReflectY = () => {
    if (!activeObj) return;
    const updated = objects.map((obj) => (obj.id === activeObj.id ? { ...obj, reflectedY: !obj.reflectedY } : obj));
    pushState(updated);
  };

  const handleColorChange = (hex: string) => {
    if (!activeObj) return;
    const updated = objects.map((obj) => (obj.id === activeObj.id ? { ...obj, color: hex } : obj));
    pushState(updated);
  };

  const handleScaleCycle = () => {
    if (!activeObj) return;
    const scaleSteps = [0.5, 0.8, 1.0, 1.3];
    const currentIdx = scaleSteps.findIndex((s) => Math.abs(s - (activeObj.scale || 1)) < 0.15);
    const nextScale = scaleSteps[(currentIdx + 1) % scaleSteps.length];
    const updated = objects.map((obj) => (obj.id === activeObj.id ? { ...obj, scale: nextScale } : obj));
    pushState(updated);
  };

  const handleAddElement = () => {
    if (objects.length >= 6) return;
    const proto = objects[0] || initialObjects[0];
    const newObj: VisualObject = {
      ...proto,
      id: `elem-${Date.now()}`,
      x: 20 + objects.length * 15,
      y: 50,
      zIndex: objects.length + 1,
    };
    const updated = [...objects, newObj];
    setSelectedId(newObj.id);
    pushState(updated);
  };

  const handleRemoveElement = () => {
    if (objects.length <= 1) return;
    const updated = objects.filter((o) => o.id !== activeObj?.id);
    setSelectedId(updated[0]?.id || null);
    pushState(updated);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHist = history.slice(0, -1);
    const previous = newHist[newHist.length - 1];
    setHistory(newHist);
    setObjects(previous);
    onStateChange?.(previous);
    checkMatch(previous);
  };

  const handleReset = () => {
    setObjects(initialObjects);
    setHistory([initialObjects]);
    setSelectedId(initialObjects[0]?.id || null);
    onStateChange?.(initialObjects);
    checkMatch(initialObjects);
  };

  const handleReplay = async () => {
    if (history.length <= 1 || isReplaying) return;
    setIsReplaying(true);
    for (let i = 0; i < history.length; i++) {
      setObjects(history[i]);
      await new Promise((r) => setTimeout(r, 450));
    }
    setIsReplaying(false);
  };

  return (
    <div className={`flex flex-col bg-white border border-[#E8E6E1] rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Workspace Header & Replay Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF7F0] border-b border-[#E8E6E1] text-xs font-medium text-[#0E2235]">
        <div className="flex items-center gap-2">
          <span className="font-serif font-semibold text-sm">Interactive Reasoning Canvas</span>
          <span className="text-[#718C7B]">· Free Experimentation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReplay}
            disabled={history.length <= 1 || isReplaying}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:bg-[#FAF7F0] disabled:opacity-40 transition-colors"
            title="Watch your step-by-step transformations replay"
          >
            <Play className="w-3.5 h-3.5 text-[#C99543]" />
            <span>Replay my changes</span>
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-1.5 text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:bg-[#FAF7F0] disabled:opacity-40 transition-colors"
            title="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:bg-[#FAF7F0] transition-colors"
            title="Reset to starting state"
          >
            <ResetIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative aspect-square max-h-[380px] w-full bg-[#FAF7F0]/40 flex items-center justify-center p-6 select-none">
        {/* Subtle coordinate quadrant lines */}
        <div className="absolute inset-8 border border-dashed border-[#E8E6E1] rounded-xl pointer-events-none" />

        {/* Ghost target overlay toggle */}
        {showTargetGhost && targetObjects && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <FrameCanvas objects={targetObjects} />
          </div>
        )}

        <FrameCanvas
          objects={objects}
          selectedId={selectedId}
          onSelectObject={(id) => !readOnly && setSelectedId(id)}
          isInteractive={!readOnly}
          showGrid={true}
        />
      </div>

      {/* Tailored Transformation Toolbar (Only enabled for active lesson goals) */}
      {!readOnly && (
        <div className="p-3 bg-[#FAF7F0] border-t border-[#E8E6E1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Rotation Controls */}
            {allowedActions.includes('rotate-90-cw') && (
              <button
                onClick={() => handleRotate(90)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#0E2235]" />
                <span>Rotate 90° Right</span>
              </button>
            )}
            {allowedActions.includes('rotate-90-ccw') && (
              <button
                onClick={() => handleRotate(-90)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0E2235]" />
                <span>Rotate 90° Left</span>
              </button>
            )}
            {allowedActions.includes('rotate-45') && (
              <button
                onClick={() => handleRotate(45)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#C99543]" />
                <span>Turn 45° Diagonal</span>
              </button>
            )}

            {/* Reflection Controls */}
            {allowedActions.includes('reflect-x') && (
              <button
                onClick={handleReflectX}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#718C7B] hover:bg-white transition-all shadow-xs"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-[#718C7B]" />
                <span>Flip Left-Right</span>
              </button>
            )}
            {allowedActions.includes('reflect-y') && (
              <button
                onClick={handleReflectY}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#718C7B] hover:bg-white transition-all shadow-xs"
              >
                <FlipVertical className="w-3.5 h-3.5 text-[#718C7B]" />
                <span>Flip Up-Down</span>
              </button>
            )}

            {/* Scale Cycle */}
            {allowedActions.includes('resize') && (
              <button
                onClick={handleScaleCycle}
                className="px-3 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                Scale: {activeObj?.scale || 1.0}×
              </button>
            )}

            {/* Add / Remove Elements */}
            {allowedActions.includes('add-element') && (
              <button
                onClick={handleAddElement}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dot</span>
              </button>
            )}
            {allowedActions.includes('remove-element') && (
              <button
                onClick={handleRemoveElement}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0E2235] bg-white border border-[#E8E6E1] rounded-lg hover:border-[#0E2235] hover:bg-white transition-all shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Color Swatches if enabled */}
          {allowedActions.includes('change-color') && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8E6E1]">
              <span className="text-[11px] text-slate-500 mr-1">Color:</span>
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleColorChange(hex)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    activeObj?.color === hex ? 'scale-125 border-[#0E2235] shadow-xs' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`Select color ${hex}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
