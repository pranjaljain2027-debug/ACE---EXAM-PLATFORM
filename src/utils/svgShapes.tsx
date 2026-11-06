import React from 'react';
import { VisualObject, ShapeType } from '../types/reasoning';

interface ShapeProps {
  object: VisualObject;
  isSelected?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
  size?: number; // base viewbox size in px, defaults to 200
}

export const ShapeSvgElement: React.FC<ShapeProps> = ({
  object,
  isSelected = false,
  isInteractive = false,
  onClick,
  size = 200,
}) => {
  const { shape, x, y, rotation, scale, color, reflectedX, reflectedY } = object;

  // Center coordinate in viewBox
  const cx = (x / 100) * size;
  const cy = (y / 100) * size;
  const baseDim = size * 0.32 * (scale || 1.0);

  // Transform matrix / string
  const scaleX = reflectedX ? -1 : 1;
  const scaleY = reflectedY ? -1 : 1;
  const transform = `translate(${cx}, ${cy}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`;

  const renderShapePath = (type: ShapeType) => {
    const half = baseDim / 2;
    switch (type) {
      case 'square':
        return (
          <rect
            x={-half}
            y={-half}
            width={baseDim}
            height={baseDim}
            rx={baseDim * 0.08}
            className="transition-all duration-300"
          />
        );
      case 'circle':
        return (
          <circle
            cx={0}
            cy={0}
            r={half}
            className="transition-all duration-300"
          />
        );
      case 'triangle': {
        const h = (Math.sqrt(3) / 2) * baseDim;
        const pts = `0,${-h * 0.6} ${half},${h * 0.4} ${-half},${h * 0.4}`;
        return (
          <polygon
            points={pts}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'diamond': {
        const pts = `0,${-half * 1.2} ${half * 0.8},0 0,${half * 1.2} ${-half * 0.8},0`;
        return (
          <polygon
            points={pts}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'arrow': {
        // High-contrast clean pointing arrow
        const w = half * 0.55;
        const stemH = half * 0.85;
        const headW = half * 1.05;
        const headH = half * 0.9;
        const pts = `
          0,${-half - headH * 0.2}
          ${headW},${-half + headH * 0.7}
          ${w},${-half + headH * 0.7}
          ${w},${stemH}
          ${-w},${stemH}
          ${-w},${-half + headH * 0.7}
          ${-headW},${-half + headH * 0.7}
        `;
        return (
          <polygon
            points={pts}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'hexagon': {
        const pts = Array.from({ length: 6 })
          .map((_, i) => {
            const angle = (i * 60 - 30) * (Math.PI / 180);
            return `${half * Math.cos(angle)},${half * Math.sin(angle)}`;
          })
          .join(' ');
        return (
          <polygon
            points={pts}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'star': {
        const points: string[] = [];
        const outerR = half;
        const innerR = half * 0.48;
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * 36 - 90) * (Math.PI / 180);
          points.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'crescent': {
        // Asymmetric crescent moon - fantastic for testing reflection vs rotation
        const r = half;
        const d = `M 0,${-r} A ${r} ${r} 0 0 1 0,${r} A ${r * 0.75} ${r * 0.9} 0 0 0 0,${-r} Z`;
        return (
          <path
            d={d}
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        );
      }
      case 'flag': {
        // Chiral pennant on a pole: distinguishes every rotation and its mirror image.
        const pole = half * 0.16;
        const d = `M ${-half * 0.6},${half} L ${-half * 0.6},${-half} L ${half},${-half * 0.45} L ${-half * 0.6 + pole},${half * 0.1} L ${-half * 0.6 + pole},${half} Z`;
        return <path d={d} strokeLinejoin="round" className="transition-all duration-300" />;
      }
      case 'ell': {
        // Chiral L-shape.
        const t = half * 0.55;
        const d = `M ${-half * 0.7},${-half} L ${-half * 0.7 + t},${-half} L ${-half * 0.7 + t},${half - t} L ${half * 0.8},${half - t} L ${half * 0.8},${half} L ${-half * 0.7},${half} Z`;
        return <path d={d} strokeLinejoin="round" className="transition-all duration-300" />;
      }
      default:
        return <circle cx={0} cy={0} r={half} />;
    }
  };

  return (
    <g
      transform={transform}
      onClick={isInteractive ? onClick : undefined}
      className={`select-none ${isInteractive ? 'cursor-pointer' : ''}`}
      style={{
        fill: color,
        stroke: '#0E2235',
        strokeWidth: isSelected ? 3 : 1.5,
        filter: isSelected ? 'drop-shadow(0 4px 6px rgba(14,34,53,0.25))' : 'none',
      }}
    >
      {renderShapePath(shape)}
      {isSelected && (
        <circle
          cx={0}
          cy={0}
          r={baseDim * 0.65}
          fill="none"
          stroke="#C99543"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="animate-spin-slow pointer-events-none"
        />
      )}
    </g>
  );
};

interface FrameCanvasProps {
  objects: VisualObject[];
  width?: number | string;
  height?: number | string;
  viewBoxSize?: number;
  selectedId?: string | null;
  onSelectObject?: (id: string) => void;
  isInteractive?: boolean;
  className?: string;
  showGrid?: boolean;
  highlightDifference?: boolean;
}

export const FrameCanvas: React.FC<FrameCanvasProps> = ({
  objects,
  width = '100%',
  height = '100%',
  viewBoxSize = 200,
  selectedId = null,
  onSelectObject,
  isInteractive = false,
  className = '',
  showGrid = false,
}) => {
  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className={`w-full h-full block overflow-visible ${className}`}
      style={{ maxWidth: width, maxHeight: height }}
    >
      {/* Background Grid Pattern (architectural subtle grid) */}
      {showGrid && (
        <g opacity="0.18">
          <line x1="0" y1={viewBoxSize / 2} x2={viewBoxSize} y2={viewBoxSize / 2} stroke="#0E2235" strokeDasharray="3 3" />
          <line x1={viewBoxSize / 2} y1="0" x2={viewBoxSize / 2} y2={viewBoxSize} stroke="#0E2235" strokeDasharray="3 3" />
          <circle cx={viewBoxSize / 2} cy={viewBoxSize / 2} r={viewBoxSize * 0.38} fill="none" stroke="#0E2235" strokeDasharray="2 4" />
        </g>
      )}

      {/* Render all visual objects sorted by zIndex */}
      {[...objects]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((obj) => (
          <ShapeSvgElement
            key={obj.id}
            object={obj}
            size={viewBoxSize}
            isSelected={selectedId === obj.id}
            isInteractive={isInteractive}
            onClick={() => onSelectObject && onSelectObject(obj.id)}
          />
        ))}
    </svg>
  );
};
