"use client";

/**
 * The board a figure-matrix question is asked on (U5).
 *
 * The grid is the dominant visual of the landing demo, so it is drawn rather
 * than described: a real SVG, sized in one viewBox, with every cell a named
 * element so an explanation step can point at one by id.
 *
 * Accessibility: the whole board is one `img` whose accessible name is built
 * from the figures' own alt text — "Row 1: an outlined arrow pointing up, ..."
 * A screen reader gets the board in one pass instead of nine fragments. The
 * narration beside it is what says which row or column a highlight means, so
 * the highlight itself never has to carry the explanation.
 */
import type { CSSProperties } from "react";
import { ShapeGlyph } from "./ShapeGlyph";
import type { FigureGlyph, FigureMatrixVisual, FigureTransform } from "@/content/questions/types";

const BOX = 320;
const STEP = 100;
const CELL = 92;
const GAP = (STEP - CELL) / 2;

export interface MatrixGridTransform {
  readonly cellId: string;
  readonly transform: FigureTransform;
}

export interface MatrixGridProps {
  visual: FigureMatrixVisual;
  /** Cell ids the current explanation step points at. */
  highlightCellIds?: readonly string[];
  /** The transformation the current step applies, played or drawn. */
  transform?: MatrixGridTransform | null;
  /** The figure that finishes the board, shown only at the reveal step. */
  revealedGlyph?: FigureGlyph | null;
  /** Play the transformation. Off when the visitor asks for reduced motion. */
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** What a screen reader is told, built from the figures' own alt text. */
function describeBoard(
  visual: FigureMatrixVisual,
  revealedGlyph: FigureGlyph | null,
): string {
  return visual.rows
    .map((row, rowIndex) => {
      const cells = row.map((cell) => {
        const glyph =
          cell.cellId === visual.missingCellId && revealedGlyph !== null
            ? revealedGlyph
            : cell.glyph;
        return glyph === null ? "an empty square" : glyph.altText;
      });
      return `Row ${rowIndex + 1}: ${cells.join(", ")}.`;
    })
    .join(" ");
}

export function MatrixGrid({
  visual,
  highlightCellIds = [],
  transform = null,
  revealedGlyph = null,
  animate = false,
  className,
  style,
}: MatrixGridProps) {
  const glyphFor = (cellId: string, glyph: FigureGlyph | null): FigureGlyph | null => {
    if (cellId === visual.missingCellId && revealedGlyph !== null) {
      return revealedGlyph;
    }
    return glyph;
  };

  return (
    <svg
      className={className}
      viewBox={`0 0 ${BOX} ${BOX}`}
      role="img"
      aria-label={describeBoard(visual, revealedGlyph)}
      focusable="false"
      style={{ width: "100%", maxWidth: "24rem", height: "auto", ...style }}
    >
      <rect
        x={GAP}
        y={GAP}
        width={BOX - GAP * 2}
        height={BOX - GAP * 2}
        rx={18}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={1}
      />
      {visual.rows.map((row, rowIndex) =>
        row.map((cell, columnIndex) => {
          const x = GAP + columnIndex * STEP + GAP / 2;
          const y = GAP + rowIndex * STEP + GAP / 2;
          const glyph = glyphFor(cell.cellId, cell.glyph);
          const isEmpty = glyph === null;
          const isHighlighted = highlightCellIds.includes(cell.cellId);
          const cellTransform =
            transform !== null && transform.cellId === cell.cellId
              ? transform.transform
              : null;

          return (
            <g key={cell.cellId}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={12}
                fill={isEmpty ? "var(--color-surface-sunken)" : "var(--color-surface)"}
                stroke={
                  isHighlighted
                    ? "var(--color-accent)"
                    : isEmpty
                      ? "var(--color-border-strong)"
                      : "var(--color-border)"
                }
                strokeWidth={isHighlighted ? 4 : 1.5}
                strokeDasharray={isEmpty && revealedGlyph === null ? "6 5" : undefined}
              />
              {isEmpty ? (
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2 + 2}
                  textAnchor="middle"
                  fontSize={44}
                  fill="var(--color-text-subtle)"
                  aria-hidden="true"
                >
                  ?
                </text>
              ) : (
                <g transform={`translate(${x},${y})`}>
                  <ShapeGlyph
                    glyph={glyph}
                    size={CELL}
                    transform={cellTransform}
                    animate={animate}
                    decorative
                  />
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}