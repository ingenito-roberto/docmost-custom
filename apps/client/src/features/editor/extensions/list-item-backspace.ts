import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Smart Backspace handler for list items with multiple blocks.
 *
 * When the cursor is at the very beginning of a block that is a child of
 * a listItem / taskItem:
 *
 *  • If the block is a paragraph (2nd or later) → merge its text content into
 *    the previous block using ProseMirror's `join` transform.
 *  • If the block is any other type (callout, blockquote, codeBlock, …) →
 *    extract it from the listItem and re-insert it right after the parent list,
 *    so the block moves to a lower indentation level without being destroyed.
 *
 * Returns `true` when the handler consumes the event, `false` to fall through
 * to the default ProseMirror behaviour.
 */
export function handleListItemBackspace(
  editor: Editor,
  itemTypeName: "listItem" | "taskItem",
): boolean {
  const { state, view } = editor;
  const { selection } = state;
  const { $from, empty } = selection;

  // Only act on collapsed (caret) selections.
  if (!empty) return false;

  // Cursor must be at position 0 within its immediate parent node.
  if ($from.parentOffset !== 0) return false;

  // Walk up to find the list item ancestor.
  let itemDepth = -1;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === itemTypeName) {
      itemDepth = d;
      break;
    }
  }
  if (itemDepth < 0) return false;

  // The direct child of the list item that contains (or IS) the cursor node.
  const blockDepth = itemDepth + 1;
  const blockNode = $from.node(blockDepth);
  const blockIndex = $from.index(itemDepth);
  // Position just before the direct child's opening token.
  const blockStart = $from.before(blockDepth);

  /* ── Paragraph case ─────────────────────────────────────────────── */
  if (blockNode.type.name === "paragraph") {
    // Only handle paragraphs that are NOT the first child.
    // (The first paragraph's backspace is handled by default list behaviour.)
    if (blockIndex < 1) return false;

    try {
      // `join(blockStart)` merges the node at blockStart with its preceding
      // sibling by removing the closing token of para1 and the opening token
      // of para2 — exactly a text-merge.
      const tr = state.tr.join(blockStart);
      // Place cursor at the junction: position blockStart − 1 in the original
      // doc maps to the end of para1's content in the merged result.
      const cursorPos = Math.max(0, blockStart - 1);
      const $cursor = tr.doc.resolve(cursorPos);
      tr.setSelection(TextSelection.near($cursor, -1));
      view.dispatch(tr);
      return true;
    } catch {
      return false;
    }
  }

  /* ── Non-text block case (callout, blockquote, codeBlock, …) ────── */
  // Lift the block out of the list item and place it right after the
  // parent list node so it becomes a peer of the list in the document.
  try {
    // Capture positions before any mutation.
    // itemDepth - 1 is the list node (bulletList / orderedList / taskList).
    const listAfterPos = $from.after(itemDepth - 1);

    const tr = state.tr;

    // 1. Delete the block from inside the list item.
    tr.delete(blockStart, blockStart + blockNode.nodeSize);

    // 2. Insert the block right after the list.
    //    Because we deleted blockNode.nodeSize tokens inside the list,
    //    the list's end position has moved left by that amount.
    const adjustedInsertPos = listAfterPos - blockNode.nodeSize;
    tr.insert(adjustedInsertPos, blockNode);

    view.dispatch(tr);
    return true;
  } catch {
    return false;
  }
}
