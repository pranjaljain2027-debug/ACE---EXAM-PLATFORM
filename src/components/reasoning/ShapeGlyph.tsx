"use client";

/**
 * The figure renderer (U5).
 *
 * Hand-built SVG rather than canvas or WebGL (KTD4): the figures are a handful
 * of polygons, and real SVG gives inspectable, resizable output for free. Each
 * shape is authored as one closed silhouette in a 100×100 box, so a quarter
 * turn means the same thing in every cell of every puzzle.
 *
 * Two properties matter beyond drawing:
 *
 * - A `transform` renders the figure *after* the transformation rather than
 *   narrating it, so the explanation shows the turn it is describing.
 * - `animate` decides whether that move is played or drawn already made. Under
 *   `prefers-reduced-motion` the figure is drawn turned, with no transition and
 *   no scheduled frame. Both paths reach the same picture; only one of them
 *   takes time (R25).
 */
import { useEffect, useId, useState } from "react";
import type { CSSProperties } from "react";
import type { FillStyle, FigureGlyph, FigureTransform, ShapeKind } from "@/content/questions/types";

/**
 * Every shape points "up" at quarter turn 0, per the figure vocabulary, and
 * every silhouette is centred on (50, 50) so that turning it rotates about its
 * own middle rather than swinging around the corner of the box.
 */
const SILHOUETTE: Record<ShapeKind, string> = {
  triangle: "M50 18L84 82L16 82Z",
  arrow: "M50 12L78 50L62 50L62 88L38 88L38 50L22 50Z",
  chevron: "M50 26L84 74L62 74L50 52L38 74L16 74Z",
};

export interface ShapeGlyphProps {
  glyph: FigureGlyph;
  /** Rendered edge length in px. The drawing itself is always 100×100. */
  size?: number;
  /**
   * Render the figure as it looks *after* this transformation, which is what
   * an explanation step's `transform` visual state names.
   */
  transform?: FigureTransform | null;
  /**
   * Play the move into `transform` instead of drawing it already made. The
   * player passes `false` when the visitor has asked for reduced motion.
   */
  animate?: boolean;
  /** Hide the figure from assistive technology where a visible label names it. */
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface TurningFigureProps {
  readonly glyph: FigureGlyph;
  readonly targetTurn: number;
  /** Move to the target on the next frame instead of jumping there. */
  readonly animate: boolean;
  readonly fill: FillStyle;
  /** The striped fill's pattern, resolved by the owner of the `<defs>`. */
  readonly stripedFill: string;
}

/**
 * The rotating part of a glyph. It holds no state beyond the turn it is
 * currently drawn at: on first paint it shows the figure's own orientation, and
 * a scheduled frame moves it to the transformed one. Remounting this component
 * is how a repeated transformation starts again rather than resuming.
 */
function TurningFigure({
  glyph,
  targetTurn,
  animate,
  fill,
  stripedFill,
}: TurningFigureProps) {
  const [liveTurn, setLiveTurn] = useState<number | null>(null);

  useEffect(() => {
    if (!animate) {
      return;
    }
    const frame = requestAnimationFrame(() => setLiveTurn(targetTurn));
    return () => cancelAnimationFrame(frame);
  }, [animate, targetTurn]);

  const shownTurn = animate ? (liveTurn ?? glyph.quarterTurns) : targetTurn;

  const turnStyle: CSSProperties = {
    transform: `rotate(${shownTurn * 90}deg)`,
    transformBox: "view-box",
    transformOrigin: "50px 50px",
    ...(animate ? { transition: "transform var(--duration-slow) var(--ease-standard)" } : {}),
  };

  return (
    <g
      data-slot="turn"
      data-glyph-id={glyph.glyphId}
      data-turn={shownTurn}
      style={turnStyle}
    >
      <path
        d={SILHOUETTE[glyph.shape]}
        fill={fill === "solid" ? "currentColor" : fill === "striped" ? stripedFill : "none"}
        stroke={fill === "solid" ? "none" : "currentColor"}
        strokeWidth={7}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function ShapeGlyph({
  glyph,
  size = 56,
  transform = null,
  animate = false,
  decorative = false,
  className,
  style,
}: ShapeGlyphProps) {
  const rawId = useId();
  // `useId` may emit characters that are not legal in a URL fragment, which is
  // what a pattern fill is referenced by.
  const patternId = `glyph-stripes-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const isRotation = transform !== null && transform.kind === "rotate";
  const extraTurns = isRotation ? transform.quarterTurns : 0;
  const targetTurn = (glyph.quarterTurns + extraTurns) % 4;
  const fill = transform !== null && transform.kind === "fill" ? transform.fill : glyph.fill;
  const playing = animate && isRotation && extraTurns !== 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      data-glyph-id={glyph.glyphId}
      style={{ color: "var(--color-text)", overflow: "visible", ...style }}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : glyph.altText}
      focusable="false"
    >
      {!decorative && <title>{glyph.altText}</title>}
      {fill === "striped" && (
        <defs>
          {/* A pattern paints with the colour of the element that defines it,
              which is why `color` is set on the svg above. */}
          <pattern
            id={patternId}
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeWidth="3.5" />
          </pattern>
        </defs>
      )}
      <TurningFigure
        key={`${glyph.glyphId}-${targetTurn}-${playing ? "playing" : "drawn"}`}
        glyph={glyph}
        targetTurn={targetTurn}
        animate={playing}
        fill={fill}
        stripedFill={`url(#${patternId})`}
      />
    </svg>
  );
}