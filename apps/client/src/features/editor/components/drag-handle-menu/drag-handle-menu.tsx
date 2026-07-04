import React, { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
import {
  IconTrash,
  IconCopy,
  IconBlockquote,
  IconCaretRightFilled,
  IconCheckbox,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconInfoCircle,
  IconList,
  IconListNumbers,
  IconTypography,
  IconArrowsExchange,
  IconClipboard,
} from "@tabler/icons-react";
import { isEditorReady } from "@docmost/editor-ext";
import classes from "./drag-handle-menu.module.css";
import { useTranslation } from "react-i18next";

/**
 * Node types that can be directly replaced using `setNodeMarkup`
 * (they all contain `block+` content so their schemas are compatible).
 */
const SWAPPABLE_CONTAINER_TYPES = new Set([
  "callout",
  "blockquote",
  "details",
  "detailsContent",
]);

/**
 * Tries to replace a wrapping container node (callout, blockquote, …) with
 * `targetTypeName` while keeping the inner content intact.
 *
 * Strategy:
 * 1. Walk up from the cursor to find the nearest swappable container.
 * 2. Use `setNodeMarkup` to swap the node type in-place — zero content
 *    duplication or wrapping.
 * 3. If schemas are incompatible (e.g. heading → callout), fall back to the
 *    supplied `fallbackFn`.
 */
function turnBlockInto(
  editor: Editor,
  targetTypeName: string,
  targetAttrs: Record<string, any> = {},
  fallbackFn?: (e: Editor) => void,
): void {
  if (!isEditorReady(editor)) return;

  const { state, view } = editor;
  const { selection, schema } = state;
  const targetType = schema.nodes[targetTypeName];
  if (!targetType) {
    fallbackFn?.(editor);
    return;
  }

  // Handle drag handle node selection
  if (selection instanceof NodeSelection) {
    const oldNode = selection.node;
    const { tr } = state;

    // Fast path: if schema is perfectly valid (e.g. blockquote -> callout)
    if (targetType.validContent(oldNode.content)) {
      try {
        const defaultAttrs: Record<string, any> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typeAttrs = (targetType as any).attrs as Record<string, { default?: any }> | undefined;
        if (typeAttrs) {
          Object.entries(typeAttrs).forEach(([key, spec]) => {
            if (spec.default !== undefined) defaultAttrs[key] = spec.default;
          });
        }
        tr.setNodeMarkup(selection.from, targetType, { ...defaultAttrs, ...targetAttrs });
        view.dispatch(tr);
        return;
      } catch {
        // Fallthrough if it fails
      }
    }

    // Extraction path: extract inlines, rebuild target node, replace.
    let newNode: PMNode | null = null;
    try {
      if (targetTypeName === "codeBlock") {
        const textNode = oldNode.textContent ? schema.text(oldNode.textContent) : null;
        newNode = targetType.create(targetAttrs, textNode ? [textNode] : undefined);
      } else {
        const inlines: PMNode[] = [];
        oldNode.descendants((n) => {
          if (n.isInline) inlines.push(n);
        });

        if (targetTypeName === "bulletList" || targetTypeName === "orderedList") {
          const p = schema.nodes.paragraph.create({}, inlines);
          const li = schema.nodes.listItem.create({}, p);
          newNode = targetType.create(targetAttrs, li);
        } else if (targetTypeName === "taskList") {
          const p = schema.nodes.paragraph.create({}, inlines);
          const taskItem = schema.nodes.taskItem.create({ checked: false }, p);
          newNode = targetType.create(targetAttrs, taskItem);
        } else if (targetType.isTextblock) {
          // e.g. heading, paragraph
          newNode = targetType.create(targetAttrs, inlines);
        } else {
          // e.g. callout, blockquote, details
          const p = schema.nodes.paragraph.create({}, inlines);
          newNode = targetType.create(targetAttrs, p);
        }
      }
    } catch {
      // Ignore creation errors
    }

    if (newNode) {
      tr.replaceWith(selection.from, selection.to, newNode);
      view.dispatch(tr);
      return;
    }
  }

  // Not a node selection or extraction failed -> use fallback
  fallbackFn?.(editor);
}

interface DragHandleMenuProps {
  editor: Editor | null;
  /** Position of the drag handle element so the popup can be anchored near it */
  anchorRect: DOMRect | null;
  onClose: () => void;
}

interface TurnIntoItem {
  name: string;
  icon: React.ElementType;
  isActive: (editor: Editor) => boolean;
  command: (editor: Editor) => void;
}

const TURN_INTO_ITEMS: TurnIntoItem[] = [
  {
    name: "Text",
    icon: IconTypography,
    isActive: (e) =>
      e.isActive("paragraph") &&
      !e.isActive("bulletList") &&
      !e.isActive("orderedList"),
    command: (e) => turnBlockInto(e, "paragraph", {}, (ed) => ed.chain().focus().toggleNode("paragraph", "paragraph").run()),
  },
  {
    name: "Heading 1",
    icon: IconH1,
    isActive: (e) => e.isActive("heading", { level: 1 }),
    command: (e) => turnBlockInto(e, "heading", { level: 1 }, (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run()),
  },
  {
    name: "Heading 2",
    icon: IconH2,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    command: (e) => turnBlockInto(e, "heading", { level: 2 }, (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run()),
  },
  {
    name: "Heading 3",
    icon: IconH3,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    command: (e) => turnBlockInto(e, "heading", { level: 3 }, (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run()),
  },
  {
    name: "Heading 4",
    icon: IconH3,
    isActive: (e) => e.isActive("heading", { level: 4 }),
    command: (e) => turnBlockInto(e, "heading", { level: 4 }, (ed) => ed.chain().focus().toggleHeading({ level: 4 }).run()),
  },
  {
    name: "Bullet List",
    icon: IconList,
    isActive: (e) => e.isActive("bulletList"),
    command: (e) => turnBlockInto(e, "bulletList", {}, (ed) => ed.chain().focus().toggleBulletList().run()),
  },
  {
    name: "Numbered List",
    icon: IconListNumbers,
    isActive: (e) => e.isActive("orderedList"),
    command: (e) => turnBlockInto(e, "orderedList", {}, (ed) => ed.chain().focus().toggleOrderedList().run()),
  },
  {
    name: "To-do List",
    icon: IconCheckbox,
    isActive: (e) => e.isActive("taskItem"),
    command: (e) => turnBlockInto(e, "taskList", {}, (ed) => ed.chain().focus().toggleTaskList().run()),
  },
  {
    name: "Blockquote",
    icon: IconBlockquote,
    isActive: (e) => e.isActive("blockquote"),
    command: (e) => turnBlockInto(e, "blockquote", {}, (ed) => ed.chain().focus().toggleNode("paragraph", "paragraph").toggleBlockquote().run()),
  },
  {
    name: "Code",
    icon: IconCode,
    isActive: (e) => e.isActive("codeBlock"),
    command: (e) => turnBlockInto(e, "codeBlock", {}, (ed) => ed.chain().focus().toggleCodeBlock().run()),
  },
  {
    name: "Callout",
    icon: IconInfoCircle,
    isActive: (e) => e.isActive("callout"),
    command: (e) => turnBlockInto(e, "callout", { type: "info", icon: null }, (ed) => ed.chain().focus().toggleCallout().run()),
  },
];


export function DragHandleMenu({ editor, anchorRect, onClose }: DragHandleMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showTurnInto, setShowTurnInto] = useState(false);
  // Start with an off-screen position; adjust after first render
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>(() => {
    if (!anchorRect) return { top: -9999, left: -9999 };
    return { top: anchorRect.bottom + 4, left: anchorRect.left };
  });

  /* ── Position the menu relative to the anchor (drag handle) ── */
  useEffect(() => {
    if (!anchorRect || !menuRef.current) return;
    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = anchorRect.bottom + 4;
    let left = anchorRect.left;

    // Prevent clipping on the right
    if (left + menuRect.width > viewportW - 8) {
      left = viewportW - menuRect.width - 8;
    }
    // Prefer opening downward; flip up if not enough space
    if (top + menuRect.height > viewportH - 8) {
      top = anchorRect.top - menuRect.height - 4;
    }

    setMenuPos({ top, left });
  }, [anchorRect, showTurnInto]);


  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const isHeading = editor && isEditorReady(editor) && editor.isActive("heading");
  const isNumbered = isHeading ? editor.getAttributes("heading").numbered !== false : false;

  const handleToggleNumbering = useCallback(() => {
    if (!isEditorReady(editor)) return;
    editor.chain().focus().toggleHeadingNumbered().run();
    onClose();
  }, [editor, onClose]);

  const handleDelete = useCallback(() => {
    if (!isEditorReady(editor)) return;
    editor.chain().focus().deleteSelection().run();
    onClose();
  }, [editor, onClose]);

  const handleDuplicate = useCallback(() => {
    if (!isEditorReady(editor)) return;
    // Get the selected node and insert a copy after it
    const { selection, tr, doc } = editor.state;
    if (selection instanceof NodeSelection) {
      const node = selection.node;
      const insertPos = selection.$to.pos;
      editor.view.dispatch(tr.insert(insertPos, node));
    } else {
      // For text selections, duplicate the current block
      editor.chain().focus().run();
      const { $from } = editor.state.selection;
      const blockStart = $from.start($from.depth);
      const blockEnd = $from.end($from.depth);
      const blockNode = $from.parent;
      const insertTr = editor.state.tr;
      const insertPos = blockEnd + 1;
      insertTr.insert(insertPos, blockNode.copy(blockNode.content));
      editor.view.dispatch(insertTr);
    }
    onClose();
  }, [editor, onClose]);

  const handleCopyContent = useCallback(() => {
    if (!isEditorReady(editor)) return;
    const { selection } = editor.state;
    let text = "";
    if (selection instanceof NodeSelection) {
      text = selection.node.textContent;
    } else {
      text = editor.state.doc.textBetween(selection.from, selection.to, "\n");
    }
    navigator.clipboard.writeText(text).catch(() => {});
    onClose();
  }, [editor, onClose]);

  if (!anchorRect) return null;

  return (
    <div
      ref={menuRef}
      className={classes.menu}
      style={{ top: menuPos.top, left: menuPos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Turn into ────────────────────────────────────── */}
      <div className={classes.section}>
        <button
          className={classes.sectionHeader}
          onClick={() => setShowTurnInto((v) => !v)}
          aria-expanded={showTurnInto}
        >
          <IconArrowsExchange size={15} className={classes.itemIcon} />
          <span>{t("Turn into")}</span>
          <span className={classes.sectionArrow}>{showTurnInto ? "▴" : "▾"}</span>
        </button>
        {showTurnInto && (
          <div className={classes.subList}>
            {TURN_INTO_ITEMS.map((item) => {
              const active = editor && isEditorReady(editor) && item.isActive(editor);
              return (
                <button
                  key={item.name}
                  className={`${classes.subItem} ${active ? classes.subItemActive : ""}`}
                  onClick={() => {
                    if (!isEditorReady(editor)) return;
                    item.command(editor);
                    onClose();
                  }}
                >
                  <item.icon size={14} className={classes.itemIcon} />
                  {t(item.name)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={classes.divider} />

      {/* ── Duplicate ───────────────────────────────────── */}
      <button className={classes.item} onClick={handleDuplicate}>
        <IconCopy size={15} className={classes.itemIcon} />
        {t("Duplicate")}
      </button>

      {/* ── Copy content ────────────────────────────────── */}
      <button className={classes.item} onClick={handleCopyContent}>
        <IconClipboard size={15} className={classes.itemIcon} />
        {t("Copy content")}
      </button>

      {isHeading && (
        <>
          <div className={classes.divider} />
          <button className={classes.item} onClick={handleToggleNumbering}>
            <IconListNumbers size={15} className={classes.itemIcon} />
            {isNumbered ? t("Remove numbering") : t("Add numbering")}
          </button>
        </>
      )}

      <div className={classes.divider} />

      {/* ── Delete ──────────────────────────────────────── */}
      <button className={`${classes.item} ${classes.itemDanger}`} onClick={handleDelete}>
        <IconTrash size={15} className={classes.itemIcon} />
        {t("Delete")}
      </button>
    </div>
  );
}

export default DragHandleMenu;
