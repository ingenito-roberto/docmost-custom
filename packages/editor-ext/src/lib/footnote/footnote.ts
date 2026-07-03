import { Mark, mergeAttributes } from "@tiptap/core";

export interface FootnoteOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      /**
       * Set a footnote mark on the current selection.
       * @param note The text content of the footnote.
       */
      setFootnote: (note: string) => ReturnType;
      /**
       * Remove a footnote mark (by its data-footnote-id) from the document.
       */
      unsetFootnote: (footnoteId: string) => ReturnType;
      /**
       * Update the text content of an existing footnote.
       */
      updateFootnote: (footnoteId: string, note: string) => ReturnType;
    };
  }
}

function generateId(): string {
  return `fn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Footnote — inline Mark extension.
 *
 * Wraps arbitrary text with a superscript counter (via CSS counters) and
 * stores the footnote body text in a `data-footnote-note` attribute.
 *
 * Custom DOM events (`FOOTNOTE_HOVER` / `FOOTNOTE_HOVER_END`) are dispatched
 * so the React layer can display a tooltip without being coupled to ProseMirror.
 */
export const Footnote = Mark.create<FootnoteOptions>({
  name: "footnote",
  exitable: true,
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-footnote-id"),
        renderHTML: (attributes) => {
          if (!attributes.footnoteId) return {};
          return { "data-footnote-id": attributes.footnoteId };
        },
      },
      note: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-footnote-note") ?? "",
        renderHTML: (attributes) => ({
          "data-footnote-note": attributes.note ?? "",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-footnote-id]",
        getAttrs: (el) => {
          const element = el as HTMLElement;
          const footnoteId = element.getAttribute("data-footnote-id")?.trim();
          if (!footnoteId) return false;
          return {
            footnoteId,
            note: element.getAttribute("data-footnote-note") ?? "",
          };
        },
      },
    ];
  },

  addCommands() {
    return {
      setFootnote:
        (note: string) =>
        ({ commands }) => {
          const footnoteId = generateId();
          return commands.setMark(this.name, { footnoteId, note });
        },

      unsetFootnote:
        (footnoteId: string) =>
        ({ tr, dispatch }) => {
          if (!footnoteId) return false;
          tr.doc.descendants((node, pos) => {
            const from = pos;
            const to = pos + node.nodeSize;
            const footnoteMark = node.marks.find(
              (mark) =>
                mark.type.name === this.name &&
                mark.attrs.footnoteId === footnoteId,
            );
            if (footnoteMark) {
              tr = tr.removeMark(from, to, footnoteMark);
            }
          });
          return dispatch?.(tr);
        },

      updateFootnote:
        (footnoteId: string, note: string) =>
        ({ tr, dispatch }) => {
          if (!footnoteId) return false;
          tr.doc.descendants((node, pos) => {
            const from = pos;
            const to = pos + node.nodeSize;
            const footnoteMark = node.marks.find(
              (mark) =>
                mark.type.name === this.name &&
                mark.attrs.footnoteId === footnoteId,
            );
            if (footnoteMark) {
              tr = tr.removeMark(from, to, footnoteMark);
              tr = tr.addMark(
                from,
                to,
                this.type.create({
                  footnoteId: footnoteMark.attrs.footnoteId,
                  note,
                }),
              );
            }
          });
          return dispatch?.(tr);
        },
    };
  },

  renderHTML({ HTMLAttributes }) {
    // SSR / headless fallback — no DOM APIs available
    if (typeof window === "undefined" || typeof document === "undefined") {
      return [
        "span",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: "footnote-mark",
        }),
        0,
      ];
    }

    // Build the wrapper <span class="footnote-mark" data-footnote-id="..." ...>
    const wrapper = document.createElement("span");
    Object.entries(
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ).forEach(([attr, val]) => wrapper.setAttribute(attr, val));
    wrapper.classList.add("footnote-mark");

    // Inline <sup> rendered AFTER the text node via CSS ::after (see footnote.css).
    // We still add a DOM <sup> element so screen-readers can announce the number.
    const sup = document.createElement("sup");
    sup.classList.add("footnote-sup");
    sup.setAttribute("aria-hidden", "true");
    wrapper.appendChild(sup);

    // Hover events for the React tooltip layer
    wrapper.addEventListener("mouseenter", () => {
      const note = wrapper.getAttribute("data-footnote-note") ?? "";
      const footnoteId = wrapper.getAttribute("data-footnote-id") ?? "";
      const rect = wrapper.getBoundingClientRect();
      wrapper.dispatchEvent(
        new CustomEvent("FOOTNOTE_HOVER", {
          bubbles: true,
          detail: { footnoteId, note, rect },
        }),
      );
    });

    wrapper.addEventListener("mouseleave", () => {
      wrapper.dispatchEvent(
        new CustomEvent("FOOTNOTE_HOVER_END", { bubbles: true, detail: {} }),
      );
    });

    return wrapper;
  },
});
