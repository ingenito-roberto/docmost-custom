import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FootnoteTooltipState {
  footnoteId: string;
  note: string;
  rect: DOMRect;
}

/**
 * FootnoteTooltip — renders a floating tooltip when hovering over a footnote mark.
 *
 * Listens for `FOOTNOTE_HOVER` / `FOOTNOTE_HOVER_END` custom DOM events
 * fired by the Tiptap Footnote extension's renderHTML.
 */
export function FootnoteTooltip() {
  const [tooltip, setTooltip] = useState<FootnoteTooltipState | null>(null);

  useEffect(() => {
    const handleHover = (e: Event) => {
      const { footnoteId, note, rect } = (e as CustomEvent).detail;
      setTooltip({ footnoteId, note, rect });
    };

    const handleHoverEnd = () => {
      setTooltip(null);
    };

    document.addEventListener("FOOTNOTE_HOVER", handleHover);
    document.addEventListener("FOOTNOTE_HOVER_END", handleHoverEnd);

    return () => {
      document.removeEventListener("FOOTNOTE_HOVER", handleHover);
      document.removeEventListener("FOOTNOTE_HOVER_END", handleHoverEnd);
    };
  }, []);

  if (!tooltip) return null;

  const { rect, note } = tooltip;

  // Position tooltip just above the hovered element
  const top = rect.top - 8;
  const left = Math.min(
    rect.left,
    window.innerWidth - 360,
  );

  return createPortal(
    <div
      className="footnote-tooltip"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: "translateY(-100%)",
      }}
    >
      {note || <em style={{ opacity: 0.5 }}>Empty footnote</em>}
    </div>,
    document.body,
  );
}
