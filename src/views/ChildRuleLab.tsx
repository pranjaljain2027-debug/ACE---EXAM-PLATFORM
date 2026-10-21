import React, { useState } from 'react';
import { ShapeType, VisualObject, PatternFrame } from '../types/reasoning';
import { FrameCanvas } from '../utils/svgShapes';
import { PatternSequenceView } from '../components/canvas/PatternSequenceView';
import { ReasoningCanvas } from '../components/canvas/ReasoningCanvas';
import { Compass, Sparkles, Play, RefreshCw, CheckCircle2, HelpCircle } from 'lucide-react';

const SHAPES: ShapeType[] = ['arrow', 'crescent', 'triangle', 'diamond', 'hexagon', 'star', 'square'];

const RULES = [
  { id: 'rot-90-cw', name: '90° Clockwise Turn', category: 'Rotation' },
  { id: 'rot-90-ccw', name: '90° Counterclockwise Turn', category: 'Rotation' },
  { id: 'rot-180', name: '180° Half Turn Inversion', category: 'Rotation' },
  { id: 'ref-h', name: 'Horizontal Mirror Reflection', category: 'Reflection' },
  { id: 'ref-v', name: 'Vertical Water Reflection', category: 'Reflection' },
  { id: 'color-cycle', name: 'Triadic Color Cycling', category: 'Color' },
  { id: 'scale-ladder', name: 'Proportional Size Shrink', category: 'Progression' },
];

export const ChildRuleLab: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>('crescent');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rot-90-cw');
  const [baseColor, setBaseColor] = useState<string>('#0E2235');
  const [testMode, setTestMode] = useState<boolean>(false);
  const [testSolved, setTestSolved] = useState<boolean>(false);

  // Generate 4 frames based on chosen rule and shape
  const generateFrames = (): PatternFrame[] => {
    const frames: PatternFrame[] = [];
    const colors = ['#C99543', '#0E2235', '#718C7B', '#2B4C7E'];
    const scales = [1.3, 1.05, 0.8, 0.55];

    for (let i = 0; i < 4; i++) {
      let rot = 0;
      let flipX = false;
      let flipY = false;
      let col = baseColor;
      let scl = 1.0;

      switch (selectedRuleId) {
        case 'rot-90-cw':
          rot = (i * 90) % 360;
          break;
        case 'rot-90-ccw':
          rot = ((4 - i) * 90) % 360;
          break;
        case 'rot-180':
          rot = i % 2 === 0 ? 0 : 180;
          break;
        case 'ref-h':
          flipX = i % 2 === 1;
          break;
        case 'ref-v':
          flipY = i % 2 === 1;
          break;
        case 'color-cycle':
          col = colors[i % colors.length];
          break;
        case 'scale-ladder':
          scl = scales[i];
          break;
      }

      frames.push({
        stepIndex: i + 1,
        label: `Step ${i + 1}`,
        isMissing: testMode && i === 3,
        objects: [
          {
            id: `lab-${i}`,
            shape: selectedShape,
            x: 50,
            y: 50,
            rotation: rot,
            scale: scl,
            color: col,
            reflectedX: flipX,
            reflectedY: flipY,
            zIndex: 1,
          },
        ],
      });
    }

    return frames;
  };

  const frames = generateFrames();
  const targetStep4 = frames[3].objects;

  return (
    <div className="bg-[#FAF7F0] text-[#0E2235] py-8 px-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C99543]">
            <Compass className="w-4 h-4" />
            <span>Open Rule Laboratory</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0E2235]">
            Create and Test Your Own Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Choose any shape and geometric rule. Watch how mathematics and space create dynamic sequences!
          </p>
        </div>

        <button
          onClick={() => {
            setTestMode(!testMode);
            setTestSolved(false);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            testMode
              ? 'bg-[#0E2235] text-white'
              : 'bg-white text-[#0E2235] border border-[#E8E6E1] hover:border-slate-400'
          }`}
        >
          {testMode ? '✓ Exit Prediction Mode' : 'Predict the 4th Frame'}
        </button>
      </div>

      {/* Two-Column Layout: Controls Left, Pattern Reference Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Sequence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Control Strip: Shapes & Rules */}
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs space-y-6">
            {/* Shape Picker */}
            <div>
              <span className="text-xs font-semibold text-[#0E2235] block mb-2">
                1. Select Test Geometry:
              </span>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setSelectedShape(shape)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium capitalize transition-all ${
                      selectedShape === shape
                        ? 'border-[#0E2235] bg-[#FAF7F0] text-[#0E2235] font-semibold ring-2 ring-[#0E2235]/10'
                        : 'border-[#E8E6E1] bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{shape}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rule Picker */}
            <div>
              <span className="text-xs font-semibold text-[#0E2235] block mb-2">
                2. Select Transformation Rule:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RULES.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      setSelectedRuleId(rule.id);
                      setTestSolved(false);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedRuleId === rule.id
                        ? 'border-[#0E2235] bg-[#FAF7F0] text-[#0E2235] font-semibold ring-2 ring-[#0E2235]/10'
                        : 'border-[#E8E6E1] bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {rule.category}
                    </span>
                    <span className="leading-snug block">{rule.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Generated Sequence View */}
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-[#0E2235]">
                Synthesized Pattern Sequence
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {testMode ? 'Missing Frame Challenge' : 'Live Sequence'}
              </span>
            </div>

            <PatternSequenceView frames={frames} format="sequence" />
          </div>

          {/* Interactive Predictor Canvas if in Test Mode */}
          {testMode && (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0E2235]">
                    Construct the 4th Frame
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Apply the chosen rule to complete the missing frame.
                  </p>
                </div>
                {testSolved && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Prediction Match Confirmed!</span>
                  </div>
                )}
              </div>

              <ReasoningCanvas
                initialObjects={[
                  {
                    id: 'test-user',
                    shape: selectedShape,
                    x: 50,
                    y: 50,
                    rotation: 0,
                    scale: 1.0,
                    color: baseColor,
                    reflectedX: false,
                    reflectedY: false,
                    zIndex: 1,
                  },
                ]}
                targetObjects={targetStep4}
                allowedActions={['rotate-90-cw', 'rotate-90-ccw', 'reflect-x', 'reflect-y', 'resize', 'change-color']}
                onValidate={(match) => setTestSolved(match)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Pattern Reference Images */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#718C7B] font-mono mb-4">
              Pattern Reference
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Smaller preview of each pattern step — relate what you see to the rule you're choosing.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {frames.map((frame, index) => (
                <div
                  key={index}
                  className={`relative flex flex-col bg-white rounded-lg border transition-all ${frame.isMissing ? 'border-dashed border-[#C99543] bg-[#FAF7F0]/60' : 'border-[#E8E6E1] hover:border-[#718C7B]'}`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#E8E6E1]/60 text-[9px] font-medium text-[#0E2235]/70">
                    <span>{frame.label || `Step ${index + 1}`}</span>
                    {frame.isMissing && <span className="text-[#C99543] font-semibold">Target</span>}
                  </div>
                  <div className="aspect-[0.85] p-2 sm:p-3 flex items-center justify-center">
                    {frame.isMissing ? (
                      <div className="flex flex-col items-center justify-center text-[#C99543] gap-1">
                        <HelpCircle className="w-5 h-5 stroke-[1.5]" />
                        <span className="text-[10px] font-semibold">Missing</span>
                      </div>
                    ) : (
                      <FrameCanvas objects={frame.objects} showGrid={false} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
