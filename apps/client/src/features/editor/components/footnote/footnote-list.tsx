import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export type FootnoteEntry = {
  footnoteId: string;
  note: string;
  label: string; // the marked text in the document
  index: number;
};

type FootnoteListProps = {
  editor: Editor | null;
};

/**
 * Scans the editor document and returns all footnote marks in document order.
 */
function extractFootnotes(editor: Editor): FootnoteEntry[] {
  const entries: FootnoteEntry[] = [];
  let counter = 0;

  editor.state.doc.descendants((node) => {
    if (!node.isText) return;
    const footnoteMark = node.marks.find((m) => m.type.name === "footnote");
    if (!footnoteMark) return;

    counter += 1;
    entries.push({
      footnoteId: footnoteMark.attrs.footnoteId,
      note: footnoteMark.attrs.note ?? "",
      label: node.text ?? "",
      index: counter,
    });
  });

  return entries;
}

/**
 * FootnoteList — sidebar panel that lists all footnotes in document order.
 *
 * Allows editing and deleting individual footnote notes inline.
 */
export function FootnoteList({ editor }: FootnoteListProps) {
  const { t } = useTranslation();
  const [footnotes, setFootnotes] = useState<FootnoteEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Re-scan whenever the document changes
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      setFootnotes(extractFootnotes(editor));
    };

    update();
    editor.on("update", update);
    editor.on("create", update);

    return () => {
      editor.off("update", update);
      editor.off("create", update);
    };
  }, [editor]);

  if (!footnotes.length) {
    return (
      <Text size="sm" c="dimmed">
        {t("No footnotes yet. Select text and use the bubble menu to add one.")}
      </Text>
    );
  }

  const handleStartEdit = (entry: FootnoteEntry) => {
    setEditingId(entry.footnoteId);
    setEditValue(entry.note);
  };

  const handleSaveEdit = (footnoteId: string) => {
    if (!editor) return;
    editor.chain().focus().updateFootnote(footnoteId, editValue).run();
    setEditingId(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = (footnoteId: string) => {
    if (!editor) return;
    editor.chain().focus().unsetFootnote(footnoteId).run();
  };

  return (
    <Stack gap="sm">
      {footnotes.map((entry) => (
        <Box
          key={entry.footnoteId}
          p="sm"
          style={{
            borderRadius: "var(--mantine-radius-sm)",
            border: `1px solid ${
              editingId === entry.footnoteId
                ? "var(--mantine-color-blue-5)"
                : "light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))"
            }`,
            background:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))",
            transition: "border-color 0.15s ease",
          }}
        >
          <Group justify="space-between" wrap="nowrap" mb={4}>
            <Group gap="xs" wrap="nowrap" style={{ cursor: "pointer" }} onClick={() => {
              const el = document.querySelector(`[data-footnote-id="${entry.footnoteId}"]`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("footnote-highlight");
                setTimeout(() => el.classList.remove("footnote-highlight"), 2000);
              }
            }}>
              <Badge size="xs" variant="filled" color="blue" radius="sm" style={{ cursor: "pointer" }}>
                {entry.index}
              </Badge>
              <Text
                size="xs"
                c="dimmed"
                truncate="end"
                style={{ maxWidth: 160 }}
              >
                {entry.label}
              </Text>
            </Group>

            <Group gap={4} wrap="nowrap">
              {editingId !== entry.footnoteId ? (
                <>
                  <Tooltip label={t("Edit")} withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => handleStartEdit(entry)}
                      aria-label={t("Edit footnote")}
                    >
                      <IconPencil size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("Delete")} withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(entry.footnoteId)}
                      aria-label={t("Delete footnote")}
                    >
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip label={t("Save")} withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="green"
                      onClick={() => handleSaveEdit(entry.footnoteId)}
                      aria-label={t("Save footnote")}
                    >
                      <IconCheck size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("Cancel")} withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={handleCancelEdit}
                      aria-label={t("Cancel edit")}
                    >
                      <IconX size={13} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
          </Group>

          {editingId === entry.footnoteId ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.currentTarget.value)}
              placeholder={t("Footnote text…")}
              autosize
              minRows={2}
              maxRows={6}
              size="xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSaveEdit(entry.footnoteId);
                }
                if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
            />
          ) : (
            <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
              {entry.note || (
                <em style={{ opacity: 0.5 }}>{t("(empty)")}</em>
              )}
            </Text>
          )}
        </Box>
      ))}
    </Stack>
  );
}
