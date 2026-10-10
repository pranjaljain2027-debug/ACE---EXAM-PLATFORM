import type { HTMLAttributes } from "react";

export type CardPadding = "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Change the element when the grouping needs different semantics. */
  as?: "div" | "section" | "article" | "li";
  padding?: CardPadding;
  /** The whole surface is a target; it lifts on hover. */
  interactive?: boolean;
}

/**
 * A quiet surface for when a group genuinely needs an edge. Not every block
 * should be a Card — on this interface most content sits directly on the
 * canvas, and a border on everything is noise.
 */
export function Card({
  as: Element = "div",
  padding = "md",
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Element
      {...rest}
      className={[
        "ui-card",
        padding !== "md" && `ui-card--${padding}`,
        interactive && "ui-card--interactive",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
